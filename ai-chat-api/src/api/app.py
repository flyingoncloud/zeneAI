from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from pathlib import Path
import uuid
import logging
import base64
import os
import json

from src.config.settings import CORS_ORIGINS, AI_RESPONSE_LANGUAGE, DATABASE_URL
from src.database.database import get_db, init_db, SessionLocal
from src.database.questionnaire_seeding import seed_questionnaires
from src.database import models as db_models
from src.api import models as api_models
from src.api.chat_service import get_ai_response, get_ai_response_with_image, build_message_history
from src.api.psychology_report_routes import router as psychology_report_router
from src.api.auth_routes import router as auth_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Chat API with Module Recommendations", version="2.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include psychology report routes
app.include_router(psychology_report_router)

# Include auth routes
app.include_router(auth_router)

# Mount static files for uploads
uploads_dir = Path("uploads")
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Mount static files for report charts
charts_dir = Path("reports/charts")
charts_dir.mkdir(parents=True, exist_ok=True)
app.mount("/charts", StaticFiles(directory="reports/charts"), name="charts")

@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup"""
    logger.info("Starting up AI Chat API...")
    try:
        init_db()
        logger.info("✓ Database initialized successfully")

        # NOTE: Questionnaire seeding disabled - now using admin panel to create questionnaires
        # Seed questionnaires from JSON files
        # db = SessionLocal()
        # try:
        #     seed_questionnaires(db)
        #     logger.info("✓ Questionnaires seeded successfully")
        # finally:
        #     db.close()
    except Exception as e:
        logger.error(f"✗ Failed to initialize database: {e}")
        raise


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "AI Chat API with Natural Module Recommendations",
        "version": "2.0.0",
        "features": [
            "AI-driven module recommendations via function calling",
            "Frontend-driven module completion tracking",
            "Dynamic system prompts with module status",
            "4 psychology support modules"
        ]
    }


@app.post("/conversations/", response_model=api_models.ConversationResponse)
def create_conversation(
    conversation: api_models.ConversationCreate,
    db: Session = Depends(get_db)
):
    """Create a new conversation"""
    # Check if session_id already exists
    existing = db.query(db_models.Conversation).filter(
        db_models.Conversation.session_id == conversation.session_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Session ID already exists")

    # Initialize conversation with empty module status
    db_conversation = db_models.Conversation(
        session_id=conversation.session_id,
        user_id=conversation.user_id,
        extra_data={"module_status": {}}
    )
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return db_conversation


@app.get("/conversations/session/{session_id}", response_model=api_models.ConversationResponse)
def get_conversation_by_session(session_id: str, db: Session = Depends(get_db)):
    """Get conversation by session ID"""
    conversation = db.query(db_models.Conversation).filter(
        db_models.Conversation.session_id == session_id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@app.get("/conversations/{conversation_id}", response_model=api_models.ConversationResponse)
def get_conversation(conversation_id: int, db: Session = Depends(get_db)):
    """Get conversation by ID"""
    conversation = db.query(db_models.Conversation).filter(
        db_models.Conversation.id == conversation_id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@app.get("/conversations/user/{user_id}", response_model=List[api_models.ConversationResponse])
def get_user_conversations(user_id: str, db: Session = Depends(get_db)):
    """Get all conversations for a user"""
    conversations = db.query(db_models.Conversation).filter(
        db_models.Conversation.user_id == user_id
    ).all()
    return conversations


@app.post("/chat/", response_model=api_models.ChatResponse)
def chat(
    chat_request: api_models.ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Send a message and get AI response with natural module recommendations

    The AI uses function calling to detect when it recommends modules.
    Module recommendations are tracked in conversation metadata.

    Supports image analysis when images are included in the request.
    """
    logger.info(f"Received chat request: {chat_request.message[:100]}...")

    # Extract user_id from request
    user_id = chat_request.user_id
    logger.info(f"Chat request user_id: {user_id}")

    # Get or create conversation
    if chat_request.session_id:
        conversation = db.query(db_models.Conversation).filter(
            db_models.Conversation.session_id == chat_request.session_id
        ).first()
        if not conversation:
            # Create new conversation with provided session_id
            conversation = db_models.Conversation(
                session_id=chat_request.session_id,
                user_id=user_id,
                extra_data={"module_status": {}}
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
            logger.info(f"Created new conversation with session_id: {chat_request.session_id}, user_id: {user_id}")
        else:
            # Update user_id if conversation exists but doesn't have one
            if not conversation.user_id and user_id:
                conversation.user_id = user_id
                db.commit()
                logger.info(f"Updated conversation {conversation.id} with user_id: {user_id}")
    else:
        # Create new conversation with generated session_id
        session_id = str(uuid.uuid4())
        conversation = db_models.Conversation(
            session_id=session_id,
            user_id=user_id,
            extra_data={"module_status": {}}
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        logger.info(f"Created new conversation with generated session_id: {session_id}, user_id: {user_id}")

    # Ensure module_status exists in metadata
    if not conversation.extra_data:
        conversation.extra_data = {}
    if "module_status" not in conversation.extra_data:
        conversation.extra_data["module_status"] = {}
        flag_modified(conversation, "extra_data")
        db.commit()

    # Save user message
    user_message = db_models.Message(
        conversation_id=conversation.id,
        role="user",
        content=chat_request.message
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    # Check if message contains images
    has_images = bool(chat_request.images and len(chat_request.images) > 0)

    if has_images:
        logger.info(f"Processing message with {len(chat_request.images)} image(s)")

        # For now, use the first image
        image_url = chat_request.images[0]
        logger.info(f"Image URL: {image_url}")

        try:
            # Download and encode image
            import httpx

            # Handle both full URLs and relative paths
            if not image_url.startswith("http"):
                # Relative path - construct full URL
                base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
                image_url = f"{base_url}{image_url}"
                logger.info(f"Constructed full URL: {image_url}")

            # Download image
            with httpx.Client() as client:
                response = client.get(image_url)
                response.raise_for_status()
                image_bytes = response.content

            # Encode to base64
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            logger.info(f"Image downloaded and encoded ({len(image_base64)} chars)")

            # Use vision API
            ai_content = get_ai_response_with_image(
                prompt=chat_request.message,
                image_data=image_base64,
                model="gpt-4o",
                language=None  # Auto-detect
            )

            recommended_modules = []
            logger.info(f"AI vision response: {ai_content[:100]}...")

        except Exception as e:
            logger.error(f"Error processing image: {e}")
            # Fallback to text-only response
            ai_content = "抱歉，我在处理图片时遇到了问题。请稍后再试，或者描述一下图片的内容。"
            recommended_modules = []
    else:
        # Text-only message - use regular chat
        # Get conversation history
        messages = db.query(db_models.Message).filter(
            db_models.Message.conversation_id == conversation.id
        ).order_by(db_models.Message.created_at).all()

        # Build message history for AI
        message_history = build_message_history(messages)
        logger.info(f"Built message history with {len(message_history)} messages")

        # Get AI response with module recommendations
        # Language is auto-detected from the user's message
        try:
            ai_response_data = get_ai_response(
                messages=message_history,
                conversation_id=conversation.id,
                db_session=db,
                language=None  # Auto-detect language from user's message
            )

            ai_content = ai_response_data["content"]
            recommended_modules = ai_response_data.get("recommended_modules", [])
            updated_module_status = ai_response_data.get("module_status", {})  # Get updated module_status

            logger.info(f"AI response: {ai_content[:100]}...")
            logger.info(f"Module recommendations: {len(recommended_modules)} modules")

            # Update conversation metadata with new recommendations
            if recommended_modules:
                module_status = conversation.extra_data.get("module_status", {})

                for module in recommended_modules:
                    module_id = module["module_id"]
                    # Only mark as recommended if not already completed
                    if module_id not in module_status or not module_status[module_id].get("completed_at"):
                        if module_id not in module_status:
                            module_status[module_id] = {}
                        if not module_status[module_id].get("recommended_at"):
                            module_status[module_id]["recommended_at"] = datetime.utcnow().isoformat()
                            logger.info(f"Marked module {module_id} as recommended")

                conversation.extra_data["module_status"] = module_status
                flag_modified(conversation, "extra_data")
                db.commit()
                db.refresh(conversation)

        except Exception as e:
            logger.error(f"Error getting AI response: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # Save assistant message with metadata
    assistant_message = db_models.Message(
        conversation_id=conversation.id,
        role="assistant",
        content=ai_content,
        extra_data={
            "recommended_modules": recommended_modules,
            "function_calls": [] if has_images else ai_response_data.get("function_calls", [])
        }
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    response = {
        "session_id": conversation.session_id,
        "conversation_id": conversation.id,
        "user_message": user_message,
        "assistant_message": assistant_message,
        "recommended_modules": recommended_modules,  # Include at top level
        "module_status": updated_module_status if not has_images else conversation.extra_data.get("module_status", {})  # Use updated status from AI response
    }
    logger.info(f"Returning response for session {conversation.session_id}")
    return response


@app.post("/conversations/{conversation_id}/modules/{module_id}/complete")
def complete_module(
    conversation_id: int,
    module_id: str,
    completion_request: api_models.ModuleCompletionRequest,
    db: Session = Depends(get_db)
):
    """
    Mark a module as completed

    This endpoint is called by the frontend when the user finishes a module interaction
    (e.g., completes breathing exercise, selects an emotion, uploads a doodle, submits assessment)
    """
    logger.info(f"Marking module {module_id} as complete for conversation {conversation_id}")

    # Validate module_id
    valid_modules = ["emotional_first_aid", "inner_doodling", "quick_assessment"]
    if module_id not in valid_modules:
        raise HTTPException(status_code=400, detail=f"Invalid module_id. Must be one of: {valid_modules}")

    # Get conversation
    conversation = db.query(db_models.Conversation).filter(
        db_models.Conversation.id == conversation_id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Ensure metadata structure exists
    if not conversation.extra_data:
        conversation.extra_data = {}
    if "module_status" not in conversation.extra_data:
        conversation.extra_data["module_status"] = {}

    # Update module status
    module_status = conversation.extra_data["module_status"]

    if module_id not in module_status:
        module_status[module_id] = {}

    # For emotional_first_aid, store multiple completions as an array
    if module_id == "emotional_first_aid":
        # Initialize completion_history if it doesn't exist
        if "completion_history" not in module_status[module_id]:
            module_status[module_id]["completion_history"] = []

        # Add new completion to history
        completion_entry = {
            "completed_at": datetime.utcnow().isoformat()
        }
        if completion_request.completion_data:
            completion_entry.update(completion_request.completion_data)

        module_status[module_id]["completion_history"].append(completion_entry)

        # Also update the latest completion for backward compatibility
        module_status[module_id]["completed_at"] = completion_entry["completed_at"]
        if completion_request.completion_data:
            module_status[module_id]["completion_data"] = completion_request.completion_data
    else:
        # For other modules, keep the original behavior (single completion)
        module_status[module_id]["completed_at"] = datetime.utcnow().isoformat()
        if completion_request.completion_data:
            module_status[module_id]["completion_data"] = completion_request.completion_data

    conversation.extra_data["module_status"] = module_status
    flag_modified(conversation, "extra_data")
    db.commit()
    db.refresh(conversation)

    logger.info(f"Successfully marked module {module_id} as complete")

    return {
        "status": "completed",
        "module_id": module_id,
        "completed_at": module_status[module_id]["completed_at"],
        "module_status": module_status
    }


@app.get("/conversations/{conversation_id}/modules")
def get_module_status(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """
    Get module completion status for a conversation

    Returns the status of all 3 modules (recommended, completed, etc.)
    """
    conversation = db.query(db_models.Conversation).filter(
        db_models.Conversation.id == conversation_id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    module_status = {}
    if conversation.extra_data and isinstance(conversation.extra_data, dict):
        module_status = conversation.extra_data.get("module_status", {})

    # Add module metadata for frontend
    from src.modules.module_config import get_module_by_id

    result = {}
    for module_id in ["emotional_first_aid", "inner_doodling", "quick_assessment"]:
        module_config = get_module_by_id(module_id)
        status = module_status.get(module_id, {})

        result[module_id] = {
            "module_id": module_id,
            "name": module_config.get("name_zh") if module_config else module_id,
            "icon": module_config.get("icon") if module_config else "📦",
            "status": status,
            "is_completed": bool(status.get("completed_at")),
            "is_recommended": bool(status.get("recommended_at")),
        }

    return result


@app.post("/analyze-image-uri/")
def analyze_image_uri(
    image_uri: str = Form(...),
    prompt: str = Form("Analyze this image and describe what you see. Focus on the mood, emotions, and insights it might evoke."),
    conversation_id: Optional[int] = Form(None)
):
    """
    Analyze image from URI (local file or S3) using OpenAI Vision API

    If conversation_id is provided and the image is for Inner Doodling,
    automatically mark the module as completed.
    """
    logger.info(f"Received image analysis request - URI: {image_uri}")
    logger.info(f"Prompt: {prompt[:100]}...")

    try:
        # Get image bytes based on URI type
        if image_uri.startswith("http://") or image_uri.startswith("https://"):
            # External URL - download
            logger.info(f"Downloading external image: {image_uri}")
            import httpx
            with httpx.Client() as client:
                response = client.get(image_uri)
                image_bytes = response.content
            logger.info(f"Downloaded {len(image_bytes)} bytes")
        elif image_uri.startswith("/uploads/"):
            # Local file
            import os
            file_path = "." + image_uri
            logger.info(f"Reading local file: {file_path}")
            if not os.path.exists(file_path):
                logger.error(f"File not found: {file_path}")
                raise HTTPException(status_code=404, detail=f"File not found: {image_uri}")
            with open(file_path, "rb") as f:
                image_bytes = f.read()
            logger.info(f"Read {len(image_bytes)} bytes from local file")
        elif image_uri.startswith("s3://"):
            # Future: S3 implementation
            logger.warning("S3 URI received but not implemented")
            raise HTTPException(status_code=501, detail="S3 support not implemented yet")
        else:
            logger.error(f"Unsupported URI format: {image_uri}")
            raise HTTPException(status_code=400, detail=f"Unsupported URI format: {image_uri}")

        # Convert to base64 and analyze
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        logger.info(f"Converted to base64, length: {len(base64_image)}")

        # Import language detection from chat_service
        from src.api.chat_service import detect_language

        # Auto-detect language from prompt
        language = detect_language(prompt)
        logger.info(f"Auto-detected language for image analysis: {language}")

        analysis = get_ai_response_with_image(prompt, base64_image, language=language)
        logger.info(f"AI analysis completed: {analysis[:100]}...")

        # If conversation_id provided, auto-complete Inner Doodling module
        if conversation_id:
            try:
                db = next(get_db())
                conversation = db.query(db_models.Conversation).filter(
                    db_models.Conversation.id == conversation_id
                ).first()

                if conversation:
                    if not conversation.extra_data:
                        conversation.extra_data = {}
                    if "module_status" not in conversation.extra_data:
                        conversation.extra_data["module_status"] = {}

                    module_status = conversation.extra_data["module_status"]
                    if "inner_doodling" not in module_status:
                        module_status["inner_doodling"] = {}

                    module_status["inner_doodling"]["completed_at"] = datetime.utcnow().isoformat()
                    module_status["inner_doodling"]["completion_data"] = {
                        "image_uri": image_uri,
                        "analysis": analysis
                    }

                    conversation.extra_data["module_status"] = module_status
                    flag_modified(conversation, "extra_data")
                    db.commit()

                    logger.info("Auto-marked Inner Doodling as complete")
            except Exception as e:
                logger.warning(f"Failed to auto-complete Inner Doodling: {e}")

        return {"analysis": analysis}
    except Exception as e:
        logger.error(f"Error in image analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-sketch/")
async def analyze_sketch(
    image_data: str = Form(...),
    prompt: str = Form("请分析这张内视涂鸦，描述你看到的内容、情绪和可能的心理意义。")
):
    """
    Analyze sketch image from base64 data without saving to disk

    This endpoint is used for the "开始分析" (Analyze) button to provide
    immediate AI analysis without uploading/saving the image.

    Parameters:
    - image_data: Base64 encoded image data (with or without data URI prefix)
    - prompt: Analysis prompt (default: Chinese prompt for Inner Doodling)

    Returns:
    - analysis: AI analysis text
    """
    logger.info(f"Received sketch analysis request")
    logger.info(f"Prompt: {prompt[:100]}...")

    try:
        # Remove data URI prefix if present (e.g., "data:image/png;base64,")
        if image_data.startswith('data:'):
            image_data = image_data.split(',', 1)[1]

        logger.info(f"Base64 data length: {len(image_data)}")

        # Import language detection from chat_service
        from src.api.chat_service import detect_language

        # Auto-detect language from prompt (should be Chinese)
        language = detect_language(prompt)
        logger.info(f"Auto-detected language for sketch analysis: {language}")

        # Analyze with AI
        analysis = get_ai_response_with_image(prompt, image_data, language=language)
        logger.info(f"AI analysis completed: {analysis[:100]}...")

        return {
            "ok": True,
            "analysis": analysis
        }

    except Exception as e:
        logger.error(f"Error analyzing sketch: {str(e)}")
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")


@app.post("/upload-sketch/")
async def upload_sketch(
    file: UploadFile = File(...),
    conversation_id: Optional[int] = Form(None),
    prompt: str = Form("请分析这张内视涂鸦，描述你看到的内容、情绪和可能的心理意义。")
):
    """
    Upload sketch image, save to disk, analyze with AI, and auto-complete Inner Doodling module

    This endpoint:
    1. Accepts an uploaded image file (PNG/JPEG)
    2. Saves it to /uploads/sketches/ directory
    3. Analyzes it using OpenAI Vision API
    4. Auto-completes the inner_doodling module if conversation_id is provided
    5. Returns the analysis result and file URI
    """
    logger.info(f"Received sketch upload - filename: {file.filename}, conversation_id: {conversation_id}")

    try:
        # Create uploads directory if it doesn't exist
        upload_dir = Path("uploads/sketches")
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename
        file_extension = Path(file.filename).suffix if file.filename else ".png"
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = upload_dir / unique_filename

        # Save uploaded file
        logger.info(f"Saving file to: {file_path}")
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        logger.info(f"Saved {len(contents)} bytes to {file_path}")

        # Convert to base64 for AI analysis
        base64_image = base64.b64encode(contents).decode('utf-8')
        logger.info(f"Converted to base64, length: {len(base64_image)}")

        # Import language detection from chat_service
        from src.api.chat_service import detect_language

        # Auto-detect language from prompt (should be Chinese)
        language = detect_language(prompt)
        logger.info(f"Auto-detected language for sketch analysis: {language}")

        # Analyze with AI
        analysis = get_ai_response_with_image(prompt, base64_image, language=language)
        logger.info(f"AI analysis completed: {analysis[:100]}...")

        # Generate file URI for frontend
        file_uri = f"/uploads/sketches/{unique_filename}"

        # If conversation_id provided, auto-complete Inner Doodling module
        module_status = {}
        if conversation_id:
            try:
                db = next(get_db())
                conversation = db.query(db_models.Conversation).filter(
                    db_models.Conversation.id == conversation_id
                ).first()

                if conversation:
                    if not conversation.extra_data:
                        conversation.extra_data = {}
                    if "module_status" not in conversation.extra_data:
                        conversation.extra_data["module_status"] = {}

                    module_status = conversation.extra_data["module_status"]
                    if "inner_doodling" not in module_status:
                        module_status["inner_doodling"] = {}

                    module_status["inner_doodling"]["completed_at"] = datetime.utcnow().isoformat()
                    module_status["inner_doodling"]["completion_data"] = {
                        "image_uri": file_uri,
                        "analysis": analysis
                    }

                    conversation.extra_data["module_status"] = module_status
                    flag_modified(conversation, "extra_data")
                    db.commit()

                    logger.info(f"Auto-marked Inner Doodling as complete for conversation {conversation_id}")
                else:
                    logger.warning(f"Conversation {conversation_id} not found")
            except Exception as e:
                logger.warning(f"Failed to auto-complete Inner Doodling: {e}")

        return {
            "ok": True,
            "analysis": analysis,
            "file_uri": file_uri,
            "message": "涂鸦已上传并分析完成",
            "module_status": module_status
        }

    except Exception as e:
        logger.error(f"Error uploading sketch: {str(e)}")
        raise HTTPException(status_code=500, detail=f"上传失败: {str(e)}")


@app.post("/api/zene/upload")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    General file upload endpoint for images with duplicate detection

    This endpoint:
    1. Accepts an uploaded image file (PNG/JPEG/WebP)
    2. Validates file type and size
    3. Checks for duplicates using SHA256 hash
    4. Saves it to /uploads/ directory (if not duplicate)
    5. Saves metadata to database
    6. Returns the file URL for use in chat
    """
    logger.info(f"Received file upload - filename: {file.filename}, content_type: {file.content_type}")

    try:
        # Validate content type
        allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type: {file.content_type}. Allowed types: {', '.join(allowed_types)}"
            )

        # Read file contents
        contents = await file.read()
        file_size = len(contents)

        # Validate file size (5MB limit)
        max_size = 5 * 1024 * 1024  # 5MB
        if file_size > max_size:
            raise HTTPException(
                status_code=413,
                detail=f"File too large: {file_size} bytes. Maximum size: {max_size} bytes (5MB)"
            )

        # Calculate SHA256 hash for duplicate detection
        import hashlib
        file_hash = hashlib.sha256(contents).hexdigest()
        logger.info(f"File hash: {file_hash}")

        # Check for existing file with same hash (not deleted)
        existing_media = db.query(db_models.MediaFile).filter(
            db_models.MediaFile.file_hash == file_hash,
            db_models.MediaFile.deleted_at.is_(None)
        ).first()

        if existing_media:
            logger.info(f"Duplicate file detected, returning existing URL: {existing_media.url}")
            return {
                "ok": True,
                "url": existing_media.url,
                "mime": existing_media.mime_type,
                "size": existing_media.file_size,
                "duplicate": True,
                "message": "文件已存在，返回已有文件"
            }

        # Create uploads directory if it doesn't exist
        upload_dir = Path("uploads")
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename with proper extension
        file_extension = Path(file.filename).suffix if file.filename else ".jpg"
        if not file_extension or file_extension not in ['.png', '.jpg', '.jpeg', '.webp']:
            # Determine extension from content type
            ext_map = {
                "image/png": ".png",
                "image/jpeg": ".jpg",
                "image/jpg": ".jpg",
                "image/webp": ".webp"
            }
            file_extension = ext_map.get(file.content_type, ".jpg")

        unique_filename = f"{int(datetime.utcnow().timestamp() * 1000)}-{uuid.uuid4().hex[:8]}{file_extension}"
        file_path = upload_dir / unique_filename

        # Save uploaded file
        logger.info(f"Saving file to: {file_path}")
        with open(file_path, "wb") as f:
            f.write(contents)
        logger.info(f"Saved {file_size} bytes to {file_path}")

        # Generate file URL for frontend
        file_url = f"/uploads/{unique_filename}"

        # Save media metadata to database
        media_file = db_models.MediaFile(
            url=file_url,
            filename=unique_filename,
            original_filename=file.filename,
            file_type="image",  # Currently only images supported
            mime_type=file.content_type,
            file_size=file_size,
            file_hash=file_hash,
        )
        db.add(media_file)
        db.commit()
        db.refresh(media_file)
        logger.info(f"Saved media metadata to database: {media_file.id}")

        return {
            "ok": True,
            "url": file_url,
            "mime": file.content_type,
            "size": file_size,
            "duplicate": False
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"上传失败: {str(e)}")


@app.get("/api/admin/media")
async def get_media_list(db: Session = Depends(get_db)):
    """
    Get list of all uploaded media files from database

    Returns metadata for all non-deleted media files
    """
    try:
        # Query all non-deleted media files, ordered by upload date (newest first)
        media_files = db.query(db_models.MediaFile).filter(
            db_models.MediaFile.deleted_at.is_(None)
        ).order_by(
            db_models.MediaFile.uploaded_at.desc()
        ).all()

        # Format for frontend
        items = []
        for media in media_files:
            # Format file size
            size_kb = media.file_size / 1024
            size_str = f"{size_kb:.1f} KB" if size_kb < 1024 else f"{size_kb / 1024:.1f} MB"

            items.append({
                "id": media.url,
                "url": media.url,
                "name": media.original_filename or media.filename,
                "type": media.file_type,
                "size": size_str,
                "uploadedAt": media.uploaded_at.strftime("%Y-%m-%d"),
                "mime": media.mime_type
            })

        return {"ok": True, "items": items}

    except Exception as e:
        logger.error(f"Error loading media list: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load media list: {str(e)}")


@app.delete("/api/admin/media/{media_id:path}")
async def delete_media(media_id: str, db: Session = Depends(get_db)):
    """
    Delete a media file (soft delete in database, hard delete file)

    Parameters:
    - media_id: The media ID (URL path like /uploads/filename.jpg)
    """
    try:
        # Ensure media_id starts with /
        if not media_id.startswith("/"):
            media_id = f"/{media_id}"

        # Find media file in database
        media_file = db.query(db_models.MediaFile).filter(
            db_models.MediaFile.url == media_id,
            db_models.MediaFile.deleted_at.is_(None)
        ).first()

        if not media_file:
            raise HTTPException(status_code=404, detail="Media file not found")

        # Soft delete in database
        media_file.deleted_at = datetime.utcnow()
        db.commit()
        logger.info(f"Soft deleted media in database: {media_id}")

        # Hard delete the actual file
        file_path = Path(media_id[1:])  # Remove leading slash
        if file_path.exists():
            file_path.unlink()
            logger.info(f"Deleted file: {file_path}")
        else:
            logger.warning(f"File not found: {file_path}")

        return {"ok": True, "message": "Media deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting media: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete media: {str(e)}")


@app.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    """Delete a conversation"""
    conversation = db.query(db_models.Conversation).filter(
        db_models.Conversation.id == conversation_id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conversation)
    db.commit()
    return {"message": "Conversation deleted successfully"}


# ============================================================================
# Questionnaire Endpoints
# ============================================================================

from src.database.questionnaire_models import AssessmentQuestionnaire as DBQuestionnaire, AssessmentQuestion as DBQuestion, AssessmentResponse as DBQuestionnaireResponse, AssessmentAnswer as DBAnswer
from src.services.questionnaire_scoring import QuestionnaireScorer

@app.get("/questionnaires")
def get_all_questionnaires(db: Session = Depends(get_db)):
    """
    Get all available questionnaires from database
    Returns a list of questionnaire metadata with question counts
    """
    try:
        # Debug: Check database connection
        logger.info(f"Database URL: {DATABASE_URL}")

        # Debug: Check if tables exist
        from sqlalchemy import inspect
        inspector = inspect(db.bind)
        tables = inspector.get_table_names()
        logger.info(f"Available tables: {tables}")

        # Query questionnaires
        questionnaires = db.query(DBQuestionnaire).all()
        logger.info(f"Found {len(questionnaires)} questionnaires in database")

        result = []
        for q in questionnaires:
            question_count = db.query(DBQuestion).filter(DBQuestion.questionnaire_id == q.id).count()
            logger.info(f"Questionnaire {q.id}: {q.title} ({question_count} questions)")
            result.append({
                "id": q.id,
                "section": q.section,
                "title": q.title,
                "total_questions": question_count,
                "marking_criteria": q.marking_criteria
            })

        logger.info(f"Returning {len(result)} questionnaires")
        return {"questionnaires": result}

    except Exception as e:
        logger.error(f"Error getting questionnaires: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/questionnaires/{questionnaire_id}")
def get_questionnaire(questionnaire_id: str, db: Session = Depends(get_db)):
    """
    Get a specific questionnaire by ID from database
    Returns the full questionnaire including all questions
    """
    try:
        questionnaire = db.query(DBQuestionnaire).filter(DBQuestionnaire.id == questionnaire_id).first()

        if not questionnaire:
            raise HTTPException(status_code=404, detail=f"Questionnaire {questionnaire_id} not found")

        # Get all questions for this questionnaire
        questions = db.query(DBQuestion).filter(
            DBQuestion.questionnaire_id == questionnaire_id
        ).order_by(DBQuestion.question_number).all()

        # Format questions for frontend
        formatted_questions = [
            {
                "id": q.question_number,
                "text": q.text,
                "category": q.category,
                "sub_section": q.sub_section,
                "dimension": q.dimension,
                "options": q.options,
                "mediaUrl": q.media_url,
                "mediaType": q.media_type
            }
            for q in questions
        ]

        logger.info(f"Loaded questionnaire: {questionnaire_id} with {len(formatted_questions)} questions")

        return {
            "id": questionnaire.id,
            "section": questionnaire.section,
            "title": questionnaire.title,
            "questions": formatted_questions,
            "total_questions": len(formatted_questions),
            "marking_criteria": questionnaire.marking_criteria
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting questionnaire {questionnaire_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class QuestionnaireResponse(BaseModel):
    questionnaire_id: str
    answers: Dict[str, int]  # question_id -> answer value
    metadata: Optional[Dict[str, Any]] = None


@app.post("/conversations/{conversation_id}/questionnaires/submit")
def submit_questionnaire_response(
    conversation_id: int,
    response: QuestionnaireResponse,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Submit questionnaire responses, calculate scores, and save to database
    Also marks the quick_assessment module as completed
    If all 4 questionnaires are completed, triggers psychology report generation
    """
    try:
        # Get conversation
        conversation = db.query(db_models.Conversation).filter(
            db_models.Conversation.id == conversation_id
        ).first()

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Get questionnaire from database
        questionnaire = db.query(DBQuestionnaire).filter(
            DBQuestionnaire.id == response.questionnaire_id
        ).first()

        if not questionnaire:
            raise HTTPException(status_code=404, detail=f"Questionnaire {response.questionnaire_id} not found")

        # Get questions for this questionnaire
        questions = db.query(DBQuestion).filter(
            DBQuestion.questionnaire_id == response.questionnaire_id
        ).all()

        # Convert string keys to integers for scoring
        answers_int = {int(k): v for k, v in response.answers.items()}

        # Calculate scores using scoring service
        scoring_result = QuestionnaireScorer.calculate_score(
            questionnaire_id=response.questionnaire_id,
            marking_criteria=questionnaire.marking_criteria,
            answers=answers_int,
            questions=questions
        )

        # Create questionnaire response record
        db_response = DBQuestionnaireResponse(
            conversation_id=conversation_id,
            questionnaire_id=response.questionnaire_id,
            total_score=scoring_result.get("total_score"),
            category_scores=scoring_result.get("category_scores"),
            interpretation=scoring_result.get("interpretation"),
            extra_data=response.metadata or {}
        )
        db.add(db_response)
        db.flush()  # Get the response ID

        # Save individual answers
        for question_number, answer_value in answers_int.items():
            # Find the question in database
            question = next((q for q in questions if q.question_number == question_number), None)
            if question:
                answer = DBAnswer(
                    response_id=db_response.id,
                    question_id=question.id,
                    answer_value=answer_value
                )
                db.add(answer)

        db.commit()
        db.refresh(db_response)

        # Also save to conversation extra_data for backward compatibility
        if not conversation.extra_data:
            conversation.extra_data = {}

        if "questionnaire_responses" not in conversation.extra_data:
            conversation.extra_data["questionnaire_responses"] = {}

        conversation.extra_data["questionnaire_responses"][response.questionnaire_id] = {
            "response_id": db_response.id,
            "total_score": scoring_result.get("total_score"),
            "submitted_at": db_response.completed_at.isoformat(),
            "interpretation": scoring_result.get("interpretation")
        }

        # NOTE: Do NOT mark quick_assessment module as completed here
        # The progress tracking system (UserQuestionnaireProgress) handles completion correctly
        # Only mark as completed when progress.status == 'completed' (all questions answered)
        # This prevents incorrectly showing "completed" when user only answered a few questions

        # Store response in conversation extra_data for backward compatibility
        # But do NOT set module_status.quick_assessment.completed_at
        # if "module_status" not in conversation.extra_data:
        #     conversation.extra_data["module_status"] = {}
        #
        # module_status = conversation.extra_data["module_status"]
        # if "quick_assessment" not in module_status:
        #     module_status["quick_assessment"] = {}
        #
        # module_status["quick_assessment"]["completed_at"] = datetime.utcnow().isoformat()
        # module_status["quick_assessment"]["completion_data"] = {
        #     "questionnaire_id": response.questionnaire_id,
        #     "total_questions": len(response.answers),
        #     "total_score": scoring_result.get("total_score")
        # }
        #
        # conversation.extra_data["module_status"] = module_status
        # flag_modified(conversation, "extra_data")
        # db.commit()

        logger.info(f"Saved questionnaire response for conversation {conversation_id}: {response.questionnaire_id} (score: {scoring_result.get('total_score')})")

        # NEW: Check if all 4 questionnaires completed and trigger report generation
        report_id = None
        report_status = None

        # Count completed questionnaires for this conversation
        completed_count = db.query(DBQuestionnaireResponse).filter(
            DBQuestionnaireResponse.conversation_id == conversation_id
        ).count()

        logger.info(f"Completed questionnaires count: {completed_count}")

        # Check if this is an admin-created questionnaire (single questionnaire for testing)
        is_admin_questionnaire = response.questionnaire_id.startswith('admin_created')

        if completed_count >= 4 or (is_admin_questionnaire and completed_count >= 1):  # All 4 questionnaires done OR admin questionnaire completed
            logger.info(f"{'All questionnaires' if completed_count >= 4 else 'Admin questionnaire'} completed for conversation {conversation_id}, triggering report generation")

            # Get or create psychology_assessment
            from src.database.psychology_models import PsychologyAssessment, PsychologyReport
            from src.api.psychology_report_routes import generate_report_background

            # Get all questionnaire responses for this conversation
            all_responses = db.query(DBQuestionnaireResponse).filter(
                DBQuestionnaireResponse.conversation_id == conversation_id
            ).all()

            # Calculate dimension scores from questionnaire responses
            # Map questionnaire scores to psychology dimensions
            dimension_scores = {
                'emotional_regulation_score': 0,
                'cognitive_flexibility_score': 0,
                'relationship_sensitivity_score': 0,
                'internal_conflict_score': 0,
                'growth_potential_score': 0
            }

            # Extract scores from each questionnaire
            for resp in all_responses:
                if resp.questionnaire_id == 'questionnaire_2_1':  # Emotional
                    dimension_scores['emotional_regulation_score'] = int(resp.total_score or 0)
                elif resp.questionnaire_id == 'questionnaire_2_2':  # Cognitive
                    dimension_scores['cognitive_flexibility_score'] = int(resp.total_score or 0)
                elif resp.questionnaire_id == 'questionnaire_2_3':  # Relational
                    dimension_scores['relationship_sensitivity_score'] = int(resp.total_score or 0)
                    # Also store attachment scores in sub_dimension_scores
                elif resp.questionnaire_id == 'questionnaire_2_5':  # Growth
                    dimension_scores['growth_potential_score'] = int(resp.total_score or 0)
                elif resp.questionnaire_id.startswith('admin_created'):  # Admin questionnaire
                    # For admin questionnaires, use category_scores to map to dimensions
                    category_scores = resp.category_scores or {}
                    logger.info(f"Admin questionnaire category_scores: {category_scores}")

                    # Map Chinese category names to dimension score keys
                    category_mapping = {
                        '情绪识别能力': 'emotional_regulation_score',
                        '情绪调节能力': 'emotional_regulation_score',
                        '认知重构能力': 'cognitive_flexibility_score',
                        '内在对话能力': 'internal_conflict_score',
                        '关系互动能力': 'relationship_sensitivity_score',
                        '成长潜力': 'growth_potential_score'
                    }

                    # Sum scores by dimension
                    for category, score_data in category_scores.items():
                        dimension_key = category_mapping.get(category)
                        if dimension_key:
                            score = score_data.get('score', 0) if isinstance(score_data, dict) else score_data
                            dimension_scores[dimension_key] += int(score)
                            logger.info(f"Mapped category '{category}' score {score} to {dimension_key}")

            # Calculate internal conflict score (average of emotional and cognitive)
            dimension_scores['internal_conflict_score'] = int(
                (dimension_scores['emotional_regulation_score'] +
                 dimension_scores['cognitive_flexibility_score']) / 2
            )

            logger.info(f"Calculated dimension scores: {dimension_scores}")

            # Get user_id (use conversation.user_id or fallback to session_id)
            user_id = conversation.user_id or conversation.session_id
            logger.info(f"Using user_id: {user_id}")

            # NEW: Ensure UserProfile exists for this user_id
            from src.database.psychology_models import UserProfile

            user_profile = db.query(UserProfile).filter(
                UserProfile.user_id == user_id
            ).first()

            if not user_profile:
                # Create a user profile for this session/user
                user_profile = UserProfile(
                    user_id=user_id,
                    username=f"User_{user_id[:8]}",  # Generate a display name
                    language_preference='zh'
                )
                db.add(user_profile)
                db.commit()
                db.refresh(user_profile)
                logger.info(f"Created UserProfile for user_id: {user_id}")

            # Check if assessment already exists for this user
            assessment = db.query(PsychologyAssessment).filter(
                PsychologyAssessment.user_id == user_id,
                PsychologyAssessment.assessment_type == 'questionnaire'
            ).order_by(PsychologyAssessment.created_at.desc()).first()

            if not assessment:
                # Create assessment record with calculated scores
                assessment = PsychologyAssessment(
                    user_id=user_id,
                    assessment_type='questionnaire',
                    completion_percentage=100,
                    is_complete=True,
                    completed_at=datetime.utcnow(),
                    emotional_regulation_score=dimension_scores['emotional_regulation_score'],
                    cognitive_flexibility_score=dimension_scores['cognitive_flexibility_score'],
                    relationship_sensitivity_score=dimension_scores['relationship_sensitivity_score'],
                    internal_conflict_score=dimension_scores['internal_conflict_score'],
                    growth_potential_score=dimension_scores['growth_potential_score'],
                    extra_data={'conversation_id': conversation_id}
                )
                db.add(assessment)
                db.commit()
                db.refresh(assessment)
                logger.info(f"Created psychology_assessment with id={assessment.id} and dimension scores")
            else:
                # Update existing assessment with new scores
                assessment.completion_percentage = 100
                assessment.is_complete = True
                assessment.completed_at = datetime.utcnow()
                assessment.emotional_regulation_score = dimension_scores['emotional_regulation_score']
                assessment.cognitive_flexibility_score = dimension_scores['cognitive_flexibility_score']
                assessment.relationship_sensitivity_score = dimension_scores['relationship_sensitivity_score']
                assessment.internal_conflict_score = dimension_scores['internal_conflict_score']
                assessment.growth_potential_score = dimension_scores['growth_potential_score']
                if not assessment.extra_data:
                    assessment.extra_data = {}
                assessment.extra_data['conversation_id'] = conversation_id
                db.commit()
                db.refresh(assessment)
                logger.info(f"Updated existing psychology_assessment with id={assessment.id} and dimension scores")

            # Check if report already exists for this assessment
            existing_report = db.query(PsychologyReport).filter(
                PsychologyReport.assessment_id == assessment.id
            ).first()

            if existing_report:
                # Report already exists, return its status
                report_id = existing_report.id
                report_status = existing_report.generation_status
                logger.info(f"Report already exists with id={report_id}, status={report_status}")
            else:
                # Create psychology_report record
                report = PsychologyReport(
                    user_id=user_id,  # Use the same user_id as assessment (with fallback)
                    assessment_id=assessment.id,
                    report_type='comprehensive',
                    language='zh',
                    format='docx',
                    report_data={},
                    generation_status='pending'
                )
                db.add(report)
                db.commit()
                db.refresh(report)

                report_id = report.id
                report_status = 'pending'

                logger.info(f"Created psychology_report with id={report_id}, triggering background generation")

                # Trigger background report generation
                background_tasks.add_task(
                    generate_report_background,
                    report_id=report.id,
                    assessment_id=assessment.id,
                    user_id=user_id,  # Use the same user_id (with fallback)
                    language='zh'
                )

        return {
            "ok": True,
            "message": "问卷提交成功" if not report_id else "所有问卷已完成！正在生成您的心理报告...",
            "conversation_id": conversation_id,
            "questionnaire_id": response.questionnaire_id,
            "response_id": db_response.id,
            "scoring": scoring_result,
            "module_completed": "quick_assessment",
            "module_status": module_status,  # Return full module status for frontend sync
            "report_id": report_id,
            "report_status": report_status
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting questionnaire response: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversations/{conversation_id}/questionnaires")
def get_conversation_questionnaire_responses(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all questionnaire responses with calculated scores for a conversation
    """
    try:
        conversation = db.query(db_models.Conversation).filter(
            db_models.Conversation.id == conversation_id
        ).first()

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Get all questionnaire responses from database
        db_responses = db.query(DBQuestionnaireResponse).filter(
            DBQuestionnaireResponse.conversation_id == conversation_id
        ).all()

        responses = {}
        for db_response in db_responses:
            # Get questionnaire details
            questionnaire = db.query(DBQuestionnaire).filter(
                DBQuestionnaire.id == db_response.questionnaire_id
            ).first()

            # Get answers
            answers = db.query(DBAnswer).filter(
                DBAnswer.response_id == db_response.id
            ).all()

            responses[db_response.questionnaire_id] = {
                "response_id": db_response.id,
                "questionnaire_title": questionnaire.title if questionnaire else None,
                "total_score": db_response.total_score,
                "category_scores": db_response.category_scores,
                "interpretation": db_response.interpretation,
                "completed_at": db_response.completed_at.isoformat(),
                "answer_count": len(answers),
                "extra_data": db_response.extra_data
            }

        return {
            "conversation_id": conversation_id,
            "responses": responses
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting questionnaire responses: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Questionnaire Progress Tracking Endpoints (NEW)
# ============================================================================

from src.database.progress_models import UserQuestionnaireProgress
from src.services.questionnaire_progress import QuestionnaireProgressService


class StartQuestionnaireRequest(BaseModel):
    user_id: str
    session_id: str
    conversation_id: Optional[int] = None  # Optional - questionnaire can work without conversation
    questionnaire_id: Optional[str] = 'admin_created'


class SaveAnswerRequest(BaseModel):
    progress_id: int
    question_id: int
    answer_value: int
    sub_category: Optional[str] = None  # NEW: Optional sub-category from selected option


@app.post("/api/questionnaire/start")
def start_questionnaire(
    request: StartQuestionnaireRequest,
    db: Session = Depends(get_db)
):
    """
    Start or resume questionnaire with progress tracking.

    Returns progress record and questions list.
    MBTI (F9) questions are pre-seeded in DB via seed_mbti_questions script.
    """
    try:
        logger.info(f"Starting questionnaire for user {request.user_id}, questionnaire {request.questionnaire_id}")

        progress, questions = QuestionnaireProgressService.start_or_resume(
            user_id=request.user_id,
            session_id=request.session_id,
            conversation_id=request.conversation_id,
            questionnaire_id=request.questionnaire_id,
            db=db
        )

        # Format questions for response
        formatted_questions = []
        for q in questions:
            question_dict = {
                'id': q.id,
                'question_number': q.question_number,
                'text': q.text,
                'subtitle': q.subtitle,
                'template': q.template,
                'category': q.category,
                'options': q.options or [],
                'mediaUrl': q.media_url,
                'mediaType': q.media_type,
                'templateSettings': q.template_settings or {}
            }
            formatted_questions.append(question_dict)

        return {
            'ok': True,
            'progress': progress.to_dict(),
            'questions': formatted_questions,
            'message': 'Questionnaire started' if progress.current_question_index == 0 else 'Resuming questionnaire'
        }

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error starting questionnaire: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/questionnaire/answer")
def save_questionnaire_answer(
    request: SaveAnswerRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Save answer and update progress.

    Auto-saves each answer and triggers report generation on completion.
    """
    try:
        logger.info(f"Received request: progress_id={request.progress_id}, question_id={request.question_id}, answer_value={request.answer_value}")
        logger.info(f"Saving answer for progress {request.progress_id}, question {request.question_id}")

        result = QuestionnaireProgressService.save_answer(
            progress_id=request.progress_id,
            question_id=request.question_id,
            answer_value=request.answer_value,
            sub_category=request.sub_category,  # NEW: Pass sub_category
            db=db
        )

        # If completed, trigger background report generation
        if result['is_completed'] and result.get('report_id'):
            from src.api.psychology_report_routes import generate_report_background
            from src.database.psychology_models import PsychologyAssessment

            # Get progress to find assessment
            progress = db.query(UserQuestionnaireProgress).filter(
                UserQuestionnaireProgress.id == request.progress_id
            ).first()

            if progress:
                # Get assessment
                assessment = db.query(PsychologyAssessment).filter(
                    PsychologyAssessment.user_id == progress.user_id,
                    PsychologyAssessment.assessment_type == 'questionnaire'
                ).order_by(PsychologyAssessment.created_at.desc()).first()

                if assessment:
                    logger.info(f"Triggering background report generation for report_id={result['report_id']}")
                    background_tasks.add_task(
                        generate_report_background,
                        report_id=result['report_id'],
                        assessment_id=assessment.id,
                        user_id=progress.user_id,
                        language='zh'
                    )

        return result

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error saving answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/questionnaire/progress/{user_id}")
def get_questionnaire_progress(
    user_id: str,
    questionnaire_id: str = 'admin_created',
    db: Session = Depends(get_db)
):
    """
    Get current progress for user and questionnaire.
    """
    try:
        progress = QuestionnaireProgressService.get_progress(
            user_id=user_id,
            questionnaire_id=questionnaire_id,
            db=db
        )

        if not progress:
            return {
                'ok': True,
                'progress': None,
                'message': 'No progress found'
            }

        return {
            'ok': True,
            'progress': progress.to_dict()
        }

    except Exception as e:
        logger.error(f"Error getting progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class ResetProgressRequest(BaseModel):
    user_id: str
    questionnaire_id: str = 'admin_created'


@app.post("/api/questionnaire/progress/reset")
def reset_questionnaire_progress(
    request: ResetProgressRequest,
    db: Session = Depends(get_db)
):
    """
    Delete questionnaire progress for a user to allow retesting.
    Also deletes associated responses and reports.
    """
    try:
        # Delete progress record
        progress_deleted = db.query(UserQuestionnaireProgress).filter(
            UserQuestionnaireProgress.user_id == request.user_id,
            UserQuestionnaireProgress.questionnaire_id == request.questionnaire_id
        ).delete()

        # Delete questionnaire responses (need to join through conversations to get user_id)
        from src.database.models import Conversation

        # Get conversation IDs for this user
        conversation_ids = db.query(Conversation.id).filter(
            Conversation.user_id == request.user_id
        ).all()
        conversation_ids = [c[0] for c in conversation_ids]

        # Delete responses for these conversations and questionnaire
        responses_deleted = 0
        if conversation_ids:
            responses_deleted = db.query(DBQuestionnaireResponse).filter(
                DBQuestionnaireResponse.conversation_id.in_(conversation_ids),
                DBQuestionnaireResponse.questionnaire_id == request.questionnaire_id
            ).delete(synchronize_session=False)

        # Delete psychology reports and assessments for this user
        # Only delete non-completed reports (keep completed ones for history)
        from src.database.psychology_models import PsychologyReport, PsychologyAssessment

        reports_deleted = db.query(PsychologyReport).filter(
            PsychologyReport.user_id == request.user_id,
            PsychologyReport.generation_status != 'completed'
        ).delete()

        # Only delete assessments that have NO completed reports
        # (cascade="all, delete-orphan" on assessment.reports would wipe completed reports)
        assessment_ids_with_completed = db.query(PsychologyReport.assessment_id).filter(
            PsychologyReport.user_id == request.user_id,
            PsychologyReport.generation_status == 'completed',
            PsychologyReport.assessment_id.isnot(None)
        ).distinct().all()
        safe_ids = {r[0] for r in assessment_ids_with_completed}

        if safe_ids:
            assessments_deleted = db.query(PsychologyAssessment).filter(
                PsychologyAssessment.user_id == request.user_id,
                ~PsychologyAssessment.id.in_(safe_ids)
            ).delete(synchronize_session=False)
        else:
            assessments_deleted = db.query(PsychologyAssessment).filter(
                PsychologyAssessment.user_id == request.user_id
            ).delete()

        db.commit()

        logger.info(f"Reset complete for user {request.user_id}: progress={progress_deleted}, responses={responses_deleted}, reports={reports_deleted}, assessments={assessments_deleted}")

        return {
            'ok': True,
            'deleted': {
                'progress': progress_deleted,
                'responses': responses_deleted,
                'reports': reports_deleted,
                'assessments': assessments_deleted
            },
            'message': 'Progress reset successfully'
        }

    except Exception as e:
        logger.error(f"Error resetting progress: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Admin Question Management Endpoints (Using Unified assessment_questions Table)
# ============================================================================

from src.database.questionnaire_models import (
    AssessmentQuestion as DBQuestion,
    AssessmentQuestionnaire as DBQuestionnaire
)


class AdminQuestionCreate(BaseModel):
    questionNumber: int  # User-defined number (1-80)
    internalTitle: str
    template: str  # F1-F8
    stem: str
    subtitle: Optional[str] = None
    category: Optional[str] = None  # NEW: Category for scoring
    tags: List[str] = []
    options: List[Dict[str, Any]] = []
    mediaUrl: Optional[str] = None
    mediaType: Optional[str] = None
    templateSettings: Dict[str, Any] = {}
    validation: Dict[str, Any] = {"required": True}
    order: int = 0


class AdminQuestionUpdate(BaseModel):
    internalTitle: Optional[str] = None
    template: Optional[str] = None
    status: Optional[str] = None
    stem: Optional[str] = None
    subtitle: Optional[str] = None
    category: Optional[str] = None  # NEW: Category for scoring
    tags: Optional[List[str]] = None
    options: Optional[List[Dict[str, Any]]] = None
    mediaUrl: Optional[str] = None
    mediaType: Optional[str] = None
    templateSettings: Optional[Dict[str, Any]] = None
    validation: Optional[Dict[str, Any]] = None
    order: Optional[int] = None


@app.get("/api/admin/questions")
def get_admin_questions(db: Session = Depends(get_db)):
    """
    Get all admin-created questions from unified assessment_questions table
    Returns list of questions with all details
    """
    try:
        # Get only admin-created questions
        questions = db.query(DBQuestion).filter(
            DBQuestion.source_type == 'admin'
        ).order_by(DBQuestion.display_order).all()

        result = []
        for q in questions:
            result.append({
                "id": q.question_number,  # Use question_number as the ID for admin panel
                "internalTitle": q.internal_title or q.text[:50],
                "template": q.template or "F1",
                "status": q.status or "published",
                "stem": q.text,
                "subtitle": q.subtitle,
                "category": q.category,  # NEW: Include category
                "tags": q.tags or [],
                "options": q.options or [],
                "mediaUrl": q.media_url,
                "mediaType": q.media_type,
                "templateSettings": q.template_settings or {},
                "validation": q.validation or {"required": True},
                "order": q.display_order or 0,
                "createdAt": q.created_at.isoformat() if q.created_at else None,
                "updatedAt": q.updated_at.isoformat() if q.updated_at else None
            })

        logger.info(f"Returning {len(result)} admin questions")
        return {"ok": True, "questions": result}

    except Exception as e:
        logger.error(f"Error getting admin questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/questions/{question_number}")
def get_admin_question(question_number: int, db: Session = Depends(get_db)):
    """
    Get a specific admin question by question_number
    """
    try:
        question = db.query(DBQuestion).filter(
            DBQuestion.question_number == question_number,
            DBQuestion.source_type == 'admin'
        ).first()

        if not question:
            raise HTTPException(status_code=404, detail=f"Question {question_number} not found")

        return {
            "ok": True,
            "question": {
                "id": question.question_number,
                "internalTitle": question.internal_title or question.text[:50],
                "template": question.template or "F1",
                "status": question.status or "published",
                "stem": question.text,
                "subtitle": question.subtitle,
                "category": question.category,  # NEW: Include category
                "tags": question.tags or [],
                "options": question.options or [],
                "mediaUrl": question.media_url,
                "mediaType": question.media_type,
                "templateSettings": question.template_settings or {},
                "validation": question.validation or {"required": True},
                "order": question.display_order or 0,
                "createdAt": question.created_at.isoformat() if question.created_at else None,
                "updatedAt": question.updated_at.isoformat() if question.updated_at else None
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting admin question {question_number}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/questions")
def create_admin_question(question: AdminQuestionCreate, db: Session = Depends(get_db)):
    """
    Create a new admin question in unified assessment_questions table
    """
    try:
        # Check if question_number already exists for admin questions
        existing = db.query(DBQuestion).filter(
            DBQuestion.question_number == question.questionNumber,
            DBQuestion.source_type == 'admin'
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Question with number {question.questionNumber} already exists"
            )

        # Ensure admin_created questionnaire exists
        questionnaire_id = "admin_created"
        admin_questionnaire = db.query(DBQuestionnaire).filter(
            DBQuestionnaire.id == questionnaire_id
        ).first()

        if not admin_questionnaire:
            # Create admin_created questionnaire
            admin_questionnaire = DBQuestionnaire(
                id=questionnaire_id,
                section="admin",
                title="Admin Created Questions",
                marking_criteria={}
            )
            db.add(admin_questionnaire)
            db.flush()

        # Create question
        db_question = DBQuestion(
            questionnaire_id=questionnaire_id,
            question_number=question.questionNumber,
            text=question.stem,
            internal_title=question.internalTitle,
            template=question.template,
            status='draft',
            subtitle=question.subtitle,
            category=question.category,  # NEW: Set category
            options=question.options,
            media_url=question.mediaUrl,
            media_type=question.mediaType,
            template_settings=question.templateSettings,
            validation=question.validation,
            tags=question.tags,
            display_order=question.order,
            source_type='admin'
        )

        db.add(db_question)
        db.commit()
        db.refresh(db_question)

        logger.info(f"Created admin question with number {db_question.question_number}")

        return {
            "ok": True,
            "message": "Question created successfully",
            "question": {
                "id": db_question.question_number,
                "internalTitle": db_question.internal_title,
                "template": db_question.template,
                "status": db_question.status,
                "stem": db_question.text,
                "subtitle": db_question.subtitle,
                "category": db_question.category,  # NEW: Include category
                "tags": db_question.tags or [],
                "options": db_question.options or [],
                "mediaUrl": db_question.media_url,
                "mediaType": db_question.media_type,
                "templateSettings": db_question.template_settings or {},
                "validation": db_question.validation or {"required": True},
                "order": db_question.display_order,
                "createdAt": db_question.created_at.isoformat(),
                "updatedAt": db_question.updated_at.isoformat()
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating admin question: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/admin/questions/{question_number}")
def update_admin_question(
    question_number: int,
    updates: AdminQuestionUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing admin question
    """
    try:
        question = db.query(DBQuestion).filter(
            DBQuestion.question_number == question_number,
            DBQuestion.source_type == 'admin'
        ).first()

        if not question:
            raise HTTPException(status_code=404, detail=f"Question {question_number} not found")

        # Update fields if provided
        if updates.internalTitle is not None:
            question.internal_title = updates.internalTitle
        if updates.template is not None:
            question.template = updates.template
        if updates.status is not None:
            question.status = updates.status
        if updates.stem is not None:
            question.text = updates.stem
        if updates.subtitle is not None:
            question.subtitle = updates.subtitle
        if updates.category is not None:
            question.category = updates.category  # NEW: Update category
        if updates.tags is not None:
            question.tags = updates.tags
        if updates.options is not None:
            question.options = updates.options
        if updates.mediaUrl is not None:
            question.media_url = updates.mediaUrl
        if updates.mediaType is not None:
            question.media_type = updates.mediaType
        if updates.templateSettings is not None:
            question.template_settings = updates.templateSettings
        if updates.validation is not None:
            question.validation = updates.validation
        if updates.order is not None:
            question.display_order = updates.order

        # Update timestamp
        question.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(question)

        logger.info(f"Updated admin question {question_number}")

        return {
            "ok": True,
            "message": "Question updated successfully",
            "question": {
                "id": question.question_number,
                "internalTitle": question.internal_title,
                "template": question.template,
                "status": question.status,
                "stem": question.text,
                "subtitle": question.subtitle,
                "category": question.category,  # NEW: Include category in response
                "tags": question.tags or [],
                "options": question.options or [],
                "mediaUrl": question.media_url,
                "mediaType": question.media_type,
                "templateSettings": question.template_settings or {},
                "validation": question.validation or {"required": True},
                "order": question.display_order,
                "createdAt": question.created_at.isoformat(),
                "updatedAt": question.updated_at.isoformat()
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating admin question {question_number}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/admin/questions/{question_number}")
def delete_admin_question(question_number: int, db: Session = Depends(get_db)):
    """
    Delete an admin question
    """
    try:
        question = db.query(DBQuestion).filter(
            DBQuestion.question_number == question_number,
            DBQuestion.source_type == 'admin'
        ).first()

        if not question:
            raise HTTPException(status_code=404, detail=f"Question {question_number} not found")

        db.delete(question)
        db.commit()

        logger.info(f"Deleted admin question {question_number}")

        return {
            "ok": True,
            "message": "Question deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting admin question {question_number}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/questions/{question_number}/publish")
def publish_admin_question(question_number: int, db: Session = Depends(get_db)):
    """
    Publish an admin question (change status from draft to published)
    """
    try:
        question = db.query(DBQuestion).filter(
            DBQuestion.question_number == question_number,
            DBQuestion.source_type == 'admin'
        ).first()

        if not question:
            raise HTTPException(status_code=404, detail=f"Question {question_number} not found")

        question.status = 'published'
        question.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(question)

        logger.info(f"Published admin question {question_number}")

        return {
            "ok": True,
            "message": "Question published successfully",
            "question": {
                "id": question.question_number,
                "status": question.status
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error publishing admin question {question_number}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
