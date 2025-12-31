from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import logging
import base64
import os

from src.config.settings import CORS_ORIGINS, PSYCHOLOGY_DETECTION_ENABLED
from src.database.database import get_db, init_db
from src.database import models as db_models
from src.api import models as api_models
from src.api.chat_service import get_ai_response, get_ai_response_with_image, build_message_history
from src.psychology.multi_detector import MultiPsychologyDetector
from src.reports.chinese_template_generator import generate_chinese_conversation_report

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

# Initialize Multi-Psychology Detector
psychology_detector = MultiPsychologyDetector() if PSYCHOLOGY_DETECTION_ENABLED else None


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

    # Multi-Framework Psychology Detection (if enabled) - Run BEFORE AI response
    psychology_analysis_for_ai = None
    if psychology_detector and psychology_detector.should_analyze(len(messages)):
        try:
            logger.debug(f"Running multi-framework psychology analysis on conversation {conversation.id}")

            # Get existing psychology state from conversation metadata
            existing_state = conversation.extra_data.get('psychology_state') if conversation.extra_data else None

            # Build message list for detection (include the new user message)
            message_list = [{"role": msg.role, "content": msg.content} for msg in messages]
            message_list.append({"role": "user", "content": chat_request.message})

            # Run multi-framework detection
            psychology_analysis_for_ai = psychology_detector.analyze_conversation(
                messages=message_list,
                existing_state=existing_state,
                current_message_id=len(message_list)
            )

            logger.debug(f"Psychology analysis for AI completed: frameworks={list(psychology_analysis_for_ai.get('frameworks', {}).keys())}")

        except Exception as e:
            logger.error(f"Multi-framework psychology detection failed: {e}", exc_info=True)
            # Continue without psychology context if detection fails

    # Get AI response with psychology context
    try:
        ai_response = get_ai_response(message_history, psychology_analysis=psychology_analysis_for_ai)
        logger.info(f"AI response: {ai_response[:100]}...")
    except Exception as e:
        logger.error(f"Error getting AI response: {e}")
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

    # Store psychology analysis in assistant message if available
    if psychology_analysis_for_ai:
        try:
            # Update conversation metadata with psychology state
            if not conversation.extra_data:
                conversation.extra_data = {}
            conversation.extra_data['psychology_state'] = psychology_analysis_for_ai

            # Add psychology analysis to assistant message extra_data
            if not assistant_message.extra_data:
                assistant_message.extra_data = {}
            assistant_message.extra_data['psychology_analysis'] = psychology_analysis_for_ai
            
            # Maintain backward compatibility - include IFS analysis separately if present
            if 'ifs' in psychology_analysis_for_ai.get('frameworks', {}):
                ifs_analysis = psychology_analysis_for_ai['frameworks']['ifs']
                assistant_message.extra_data['ifs_analysis'] = ifs_analysis

            db.commit()

            frameworks_analyzed = list(psychology_analysis_for_ai.get('frameworks', {}).keys())
            logger.debug(f"Psychology analysis stored: frameworks={frameworks_analyzed}, total_confidence={psychology_analysis_for_ai.get('total_confidence', 0.0)}")

        except Exception as e:
            logger.error(f"Failed to store psychology analysis: {e}", exc_info=True)
            # Don't fail the whole request if storage fails

    response = {
        "session_id": conversation.session_id,
        "conversation_id": conversation.id,
        "user_message": user_message,
        "assistant_message": assistant_message
    }
    logger.info(f"Returning response for session {conversation.session_id}")
    return response


@app.post("/analyze-image-uri/")
def analyze_image_uri(
    image_uri: str = Form(...),
    prompt: str = Form("Analyze this image and describe what you see. Focus on the mood, emotions, and therapeutic insights it might evoke for someone in IFS therapy.")
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


@app.post("/conversations/{conversation_id}/generate-report")
def generate_psychology_report(
    conversation_id: int, 
    db: Session = Depends(get_db),
    user_info: Optional[dict] = None
):
    """
    Generate a comprehensive psychology analysis report for a conversation.
    
    The report will only be generated if the conversation meets minimum criteria:
    - At least 6 messages
    - At least 2 psychology frameworks detected
    - Average confidence score >= 0.6
    """
    # Get conversation
    conversation = db.query(db_models.Conversation).filter(
        db_models.Conversation.id == conversation_id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get all messages
    messages = db.query(db_models.Message).filter(
        db_models.Message.conversation_id == conversation_id
    ).order_by(db_models.Message.created_at).all()
    
    # Build conversation data for report generation
    conversation_data = {
        'id': conversation.id,
        'session_id': conversation.session_id,
        'user_id': conversation.user_id,
        'title': getattr(conversation, 'title', f"Conversation {conversation.id}"),
        'created_at': conversation.created_at.isoformat() if conversation.created_at else None,
        'messages': []
    }
    
    # Add messages with psychology analysis
    for message in messages:
        message_data = {
            'id': message.id,
            'role': message.role,
            'content': message.content,
            'timestamp': message.created_at.isoformat() if message.created_at else None
        }
        
        # Include psychology analysis if available
        if message.extra_data and 'psychology_analysis' in message.extra_data:
            message_data['psychology_analysis'] = message.extra_data['psychology_analysis']
        
        conversation_data['messages'].append(message_data)
    
    try:
        # Generate report
        report_path = generate_chinese_conversation_report(
            conversation_data=conversation_data,
            user_info=user_info,
            output_dir="reports"
        )
        
        if not report_path:
            raise HTTPException(
                status_code=400, 
                detail="Conversation does not meet criteria for report generation. Need at least 6 messages, 2+ frameworks detected, and 0.6+ average confidence."
            )
        
        # Return report info
        return {
            "message": "Report generated successfully",
            "report_path": report_path,
            "filename": os.path.basename(report_path),
            "conversation_id": conversation_id,
            "download_url": f"/reports/download/{os.path.basename(report_path)}"
        }
        
    except Exception as e:
        logger.error(f"Error generating report for conversation {conversation_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")


@app.get("/reports/download/{filename}")
def download_report(filename: str):
    """
    Download a generated psychology report.
    
    Args:
        filename: Name of the report file to download
    """
    report_path = os.path.join("reports", filename)
    
    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="Report file not found")
    
    # Validate filename format for security
    if not filename.startswith("ZENE_Report_Pro_Edited_") or not filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="Invalid report filename")
    
    return FileResponse(
        path=report_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )


@app.get("/conversations/{conversation_id}/report-eligibility")
def check_report_eligibility(conversation_id: int, db: Session = Depends(get_db)):
    """
    Check if a conversation is eligible for report generation.
    
    Returns eligibility status and detailed criteria information.
    """
    # Get conversation
    conversation = db.query(db_models.Conversation).filter(
        db_models.Conversation.id == conversation_id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get all messages
    messages = db.query(db_models.Message).filter(
        db_models.Message.conversation_id == conversation_id
    ).order_by(db_models.Message.created_at).all()
    
    # Build conversation data
    conversation_data = {
        'id': conversation.id,
        'messages': []
    }
    
    for message in messages:
        message_data = {
            'role': message.role,
            'content': message.content
        }
        
        if message.extra_data and 'psychology_analysis' in message.extra_data:
            message_data['psychology_analysis'] = message.extra_data['psychology_analysis']
        
        conversation_data['messages'].append(message_data)
    
    # Check eligibility using report generator
    from src.reports.report_generator import ZENEReportGenerator
    generator = ZENEReportGenerator()
    eligible, reason = generator.should_generate_report(conversation_data)
    
    # Gather detailed statistics
    psychology_analyses = [
        msg.get('psychology_analysis') for msg in conversation_data['messages']
        if msg.get('psychology_analysis', {}).get('analyzed', False)
    ]
    
    frameworks_detected = set()
    total_confidence = 0
    analysis_count = 0
    
    for analysis in psychology_analyses:
        frameworks = analysis.get('frameworks', {})
        for name, data in frameworks.items():
            confidence = data.get('confidence_score', 0.0)
            elements = data.get('elements_detected', [])
            
            if confidence >= 0.5 or len(elements) >= 2:
                frameworks_detected.add(name)
                total_confidence += confidence
                analysis_count += 1
    
    avg_confidence = total_confidence / max(analysis_count, 1) if analysis_count > 0 else 0
    
    return {
        "eligible": eligible,
        "reason": reason,
        "criteria": {
            "message_count": len(conversation_data['messages']),
            "min_messages_required": 6,
            "frameworks_detected": len(frameworks_detected),
            "min_frameworks_required": 2,
            "average_confidence": round(avg_confidence, 2),
            "min_confidence_required": 0.6,
            "psychology_analyses_count": len(psychology_analyses)
        },
        "detected_frameworks": list(frameworks_detected)
    }
