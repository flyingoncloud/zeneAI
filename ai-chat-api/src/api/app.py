from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
import logging
import base64
import os

from src.config.settings import CORS_ORIGINS
from src.database.database import get_db, init_db
from src.database import models as db_models
from src.api import models as api_models
from src.api.chat_service import get_ai_response, get_ai_response_with_image, build_message_history

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Chat API - Basic Version", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        "message": "AI Chat API - Basic Version",
        "version": "1.0.0",
        "note": "Database tables are automatically created on startup"
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

    db_conversation = db_models.Conversation(**conversation.dict())
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
    Send a message and get AI response

    If session_id is provided, add to existing conversation.
    Otherwise, create a new conversation with a generated session_id.
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
            user_id=user_id
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

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

    # Get AI response with module recommendations (enhanced with patterns + progression)
    try:
        ai_response_data = get_ai_response(
            messages=message_history,
            current_user_message=chat_request.message,
            conversation_id=conversation.id,  # NEW: Pass for progression tracking
            db_session=db,  # NEW: Pass for database access
            enable_module_recommendations=True
        )

        ai_content = ai_response_data["content"]
        module_recommendations = ai_response_data.get("module_recommendations", [])
        psychological_state = ai_response_data.get("psychological_state", {})
        patterns = ai_response_data.get("patterns", {})  # NEW
        progression = ai_response_data.get("progression", {})  # NEW

        logger.info(f"AI response: {ai_content[:100]}...")
        logger.info(f"Module recommendations: {len(module_recommendations)} modules")
        logger.info(f"Patterns detected: {patterns.get('defense_mechanisms', {}).get('detected', [])}")
        logger.info(f"Emotional trajectory: {progression.get('trajectory', 'unknown')}")

    except Exception as e:
        logger.error(f"Error getting AI response: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    # Save assistant message with enhanced metadata
    assistant_message = db_models.Message(
        conversation_id=conversation.id,
        role="assistant",
        content=ai_content,
        extra_data={
            "module_recommendations": module_recommendations,
            "psychological_state": psychological_state,
            "patterns": patterns,  # NEW: Store pattern recognition results
            "progression": progression  # NEW: Store emotional progression
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
        "module_recommendations": module_recommendations  # Include in API response
    }
    logger.info(f"Returning response for session {conversation.session_id}")
    return response


@app.post("/analyze-image-uri/")
def analyze_image_uri(
    image_uri: str = Form(...),
    prompt: str = Form("Analyze this image and describe what you see. Focus on the mood, emotions, and insights it might evoke.")
):
    """Analyze image from URI (local file or S3) using OpenAI Vision API"""
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
        
        analysis = get_ai_response_with_image(prompt, base64_image)
        logger.info(f"AI analysis completed: {analysis[:100]}...")
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
