from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
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


# ============================================================================
# Questionnaire Endpoints
# ============================================================================

@app.get("/questionnaires")
def get_all_questionnaires():
    """
    Get all available questionnaires from the resources folder
    Returns a list of questionnaire metadata
    """
    try:
        questionnaires_dir = Path(__file__).parent.parent / "resources" / "questionnaire_jsons"
        questionnaires = []

        if not questionnaires_dir.exists():
            logger.warning(f"Questionnaires directory not found: {questionnaires_dir}")
            return {"questionnaires": []}

        for json_file in sorted(questionnaires_dir.glob("questionnaire_*.json")):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    questionnaires.append({
                        "id": json_file.stem,  # e.g., "questionnaire_2_1"
                        "section": data.get("section"),
                        "title": data.get("title"),
                        "total_questions": len(data.get("questions", [])),
                        "marking_criteria": data.get("marking_criteria")
                    })
            except Exception as e:
                logger.error(f"Error loading questionnaire {json_file}: {e}")
                continue

        logger.info(f"Loaded {len(questionnaires)} questionnaires")
        return {"questionnaires": questionnaires}

    except Exception as e:
        logger.error(f"Error getting questionnaires: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/questionnaires/{questionnaire_id}")
def get_questionnaire(questionnaire_id: str):
    """
    Get a specific questionnaire by ID
    Returns the full questionnaire including all questions
    """
    try:
        questionnaires_dir = Path(__file__).parent.parent / "resources" / "questionnaire_jsons"
        questionnaire_file = questionnaires_dir / f"{questionnaire_id}.json"

        if not questionnaire_file.exists():
            raise HTTPException(status_code=404, detail=f"Questionnaire {questionnaire_id} not found")

        with open(questionnaire_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        logger.info(f"Loaded questionnaire: {questionnaire_id}")
        return {
            "id": questionnaire_id,
            **data
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
    db: Session = Depends(get_db)
):
    """
    Submit questionnaire responses and save them to the conversation
    Also marks the quick_assessment module as completed
    """
    try:
        # Get conversation
        conversation = db.query(db_models.Conversation).filter(
            db_models.Conversation.id == conversation_id
        ).first()

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Initialize extra_data if needed
        if not conversation.extra_data:
            conversation.extra_data = {}

        # Store questionnaire responses
        if "questionnaire_responses" not in conversation.extra_data:
            conversation.extra_data["questionnaire_responses"] = {}

        conversation.extra_data["questionnaire_responses"][response.questionnaire_id] = {
            "answers": response.answers,
            "submitted_at": datetime.utcnow().isoformat(),
            "metadata": response.metadata or {}
        }

        # Mark quick_assessment module as completed
        if "module_status" not in conversation.extra_data:
            conversation.extra_data["module_status"] = {}

        module_status = conversation.extra_data["module_status"]
        if "quick_assessment" not in module_status:
            module_status["quick_assessment"] = {}

        module_status["quick_assessment"]["completed_at"] = datetime.utcnow().isoformat()
        module_status["quick_assessment"]["completion_data"] = {
            "questionnaire_id": response.questionnaire_id,
            "total_questions": len(response.answers),
            "answers": response.answers
        }

        conversation.extra_data["module_status"] = module_status

        # Mark the field as modified for SQLAlchemy
        flag_modified(conversation, "extra_data")
        db.commit()
        db.refresh(conversation)

        logger.info(f"Saved questionnaire response for conversation {conversation_id}: {response.questionnaire_id}")

        return {
            "message": "Questionnaire response saved successfully",
            "conversation_id": conversation_id,
            "questionnaire_id": response.questionnaire_id,
            "module_completed": "quick_assessment"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting questionnaire response: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversations/{conversation_id}/questionnaires")
def get_conversation_questionnaire_responses(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all questionnaire responses for a conversation
    """
    try:
        conversation = db.query(db_models.Conversation).filter(
            db_models.Conversation.id == conversation_id
        ).first()

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        responses = conversation.extra_data.get("questionnaire_responses", {}) if conversation.extra_data else {}

        return {
            "conversation_id": conversation_id,
            "responses": responses
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting questionnaire responses: {e}")
        raise HTTPException(status_code=500, detail=str(e))
