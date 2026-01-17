from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Optional
from datetime import datetime
import uuid
import logging
import base64
import os

from src.config.settings import CORS_ORIGINS, AI_RESPONSE_LANGUAGE
from src.database.database import get_db, init_db
from src.database import models as db_models
from src.api import models as api_models
from src.api.chat_service import get_ai_response, get_ai_response_with_image, build_message_history
from src.api.psychology_report_routes import router as psychology_report_router

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

@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup"""
    logger.info("Starting up AI Chat API...")
    try:
        init_db()
        logger.info("✓ Database initialized successfully")
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
    user_id: str = None,
    db: Session = Depends(get_db)
):
    """
    Send a message and get AI response with natural module recommendations

    The AI uses function calling to detect when it recommends modules.
    Module recommendations are tracked in conversation metadata.
    """
    logger.info(f"Received chat request: {chat_request.message[:100]}...")

    # Get or create conversation
    if chat_request.session_id:
        conversation = db.query(db_models.Conversation).filter(
            db_models.Conversation.session_id == chat_request.session_id
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
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
            "function_calls": ai_response_data.get("function_calls", [])
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
        "module_status": conversation.extra_data.get("module_status", {})  # Include current status
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
    valid_modules = ["breathing_exercise", "emotion_labeling", "inner_doodling", "quick_assessment"]
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

    Returns the status of all 4 modules (recommended, completed, etc.)
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
    for module_id in ["breathing_exercise", "emotion_labeling", "inner_doodling", "quick_assessment"]:
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


@app.post("/conversations/{conversation_id}/generate-report")
def generate_conversation_report(
    conversation_id: int,
    language: str = "zh",
    db: Session = Depends(get_db)
):
    """
    Generate a psychology report based on conversation and module completion data

    This endpoint:
    1. Checks if enough modules have been completed
    2. Gathers conversation messages and module completion data
    3. Generates a comprehensive psychology report
    4. Returns the report data
    """
    logger.info(f"Generating report for conversation {conversation_id}")

    # Get conversation
    conversation = db.query(db_models.Conversation).filter(
        db_models.Conversation.id == conversation_id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Get module status
    module_status = {}
    if conversation.extra_data and isinstance(conversation.extra_data, dict):
        module_status = conversation.extra_data.get("module_status", {})

    # Check completion requirements
    completed_modules = [
        module_id for module_id, status in module_status.items()
        if status.get("completed_at")
    ]

    completed_count = len(completed_modules)

    # Require at least 2 modules completed for a meaningful report
    if completed_count < 2:
        return {
            "ok": False,
            "error": "insufficient_data",
            "message": f"至少需要完成2个模块才能生成报告。当前已完成: {completed_count}/4",
            "completed_modules": completed_modules,
            "required_modules": 2
        }

    # Get conversation messages
    messages = db.query(db_models.Message).filter(
        db_models.Message.conversation_id == conversation_id
    ).order_by(db_models.Message.created_at).all()

    # Build conversation data
    conversation_data = {
        "conversation_id": conversation_id,
        "session_id": conversation.session_id,
        "message_count": len(messages),
        "messages": [
            {
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat() if msg.created_at else None
            }
            for msg in messages
        ],
        "module_status": module_status,
        "completed_modules": completed_modules,
        "created_at": conversation.created_at.isoformat() if conversation.created_at else None
    }

    # Generate report using the conversation report generator
    try:
        from src.reports.chinese_template_generator import generate_chinese_conversation_report

        # Generate report
        report_path = generate_chinese_conversation_report(
            conversation_data=conversation_data,
            user_info={"user_id": conversation.user_id} if conversation.user_id else None,
            output_dir="reports"
        )

        if not report_path:
            return {
                "ok": False,
                "error": "generation_failed",
                "message": "报告生成失败，请稍后重试"
            }

        # Read the generated report
        with open(report_path, 'r', encoding='utf-8') as f:
            report_content = f.read()

        # Store report reference in conversation metadata
        if not conversation.extra_data:
            conversation.extra_data = {}

        conversation.extra_data["last_report"] = {
            "generated_at": datetime.utcnow().isoformat(),
            "report_path": report_path,
            "completed_modules": completed_modules,
            "language": language
        }
        flag_modified(conversation, "extra_data")
        db.commit()

        logger.info(f"Successfully generated report for conversation {conversation_id}")

        return {
            "ok": True,
            "report": {
                "content": report_content,
                "format": "markdown",
                "generated_at": datetime.utcnow().isoformat(),
                "completed_modules": completed_modules,
                "module_count": completed_count,
                "message_count": len(messages)
            }
        }

    except Exception as e:
        logger.error(f"Error generating report: {e}", exc_info=True)
        return {
            "ok": False,
            "error": "generation_error",
            "message": f"报告生成过程中出现错误: {str(e)}"
        }


@app.get("/conversations/{conversation_id}/report-status")
def get_report_status(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """
    Check if a conversation is ready for report generation

    Returns:
    - ready: boolean indicating if report can be generated
    - completed_modules: list of completed module IDs
    - required_modules: minimum number of modules needed
    - message_count: number of messages in conversation
    """
    conversation = db.query(db_models.Conversation).filter(
        db_models.Conversation.id == conversation_id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Get module status
    module_status = {}
    if conversation.extra_data and isinstance(conversation.extra_data, dict):
        module_status = conversation.extra_data.get("module_status", {})

    # Count completed modules
    completed_modules = [
        module_id for module_id, status in module_status.items()
        if status.get("completed_at")
    ]

    # Get message count
    message_count = db.query(db_models.Message).filter(
        db_models.Message.conversation_id == conversation_id
    ).count()

    # Check if report was previously generated
    last_report = None
    if conversation.extra_data:
        last_report = conversation.extra_data.get("last_report")

    return {
        "ready": len(completed_modules) >= 2,
        "completed_modules": completed_modules,
        "required_modules": 2,
        "message_count": message_count,
        "last_report": last_report
    }
