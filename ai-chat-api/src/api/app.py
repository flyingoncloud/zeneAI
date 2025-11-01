from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uuid
import logging

from src.config.settings import CORS_ORIGINS
from src.database.database import get_db, init_db
from src.database import models as db_models
from src.api import models as api_models
from src.api.chat_service import get_ai_response, build_message_history

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

    # Get AI response
    try:
        ai_response = get_ai_response(message_history)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Save assistant message
    assistant_message = db_models.Message(
        conversation_id=conversation.id,
        role="assistant",
        content=ai_response
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    return {
        "session_id": conversation.session_id,
        "conversation_id": conversation.id,
        "user_message": user_message,
        "assistant_message": assistant_message
    }


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
