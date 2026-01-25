from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form, BackgroundTasks
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

from src.config.settings import CORS_ORIGINS, AI_RESPONSE_LANGUAGE, DATABASE_URL
from src.database.database import get_db, init_db, SessionLocal
from src.database.questionnaire_seeding import seed_questionnaires
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

        # Seed questionnaires from JSON files
        db = SessionLocal()
        try:
            seed_questionnaires(db)
            logger.info("✓ Questionnaires seeded successfully")
        finally:
            db.close()
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
            # Create new conversation with provided session_id
            conversation = db_models.Conversation(
                session_id=chat_request.session_id,
                user_id=user_id,
                extra_data={"module_status": {}}
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
            logger.info(f"Created new conversation with session_id: {chat_request.session_id}")
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
                "options": q.options
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
            "total_score": scoring_result.get("total_score")
        }

        conversation.extra_data["module_status"] = module_status
        flag_modified(conversation, "extra_data")
        db.commit()

        logger.info(f"Saved questionnaire response for conversation {conversation_id}: {response.questionnaire_id} (score: {scoring_result.get('total_score')})")

        # NEW: Check if all 4 questionnaires completed and trigger report generation
        report_id = None
        report_status = None

        # Count completed questionnaires for this conversation
        completed_count = db.query(DBQuestionnaireResponse).filter(
            DBQuestionnaireResponse.conversation_id == conversation_id
        ).count()

        logger.info(f"Completed questionnaires count: {completed_count}")

        if completed_count >= 4:  # All 4 questionnaires done
            logger.info(f"All questionnaires completed for conversation {conversation_id}, triggering report generation")

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
                    language='zh',
                    db_session=db
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
