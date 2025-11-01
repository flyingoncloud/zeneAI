from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime
    extra_data: Optional[Dict[str, Any]] = {}

    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    session_id: str
    user_id: Optional[str] = None


class ConversationResponse(BaseModel):
    id: int
    session_id: str
    user_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    extra_data: Optional[Dict[str, Any]] = {}
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None  # If not provided, creates new conversation


class ChatResponse(BaseModel):
    session_id: str
    conversation_id: int
    user_message: MessageResponse
    assistant_message: MessageResponse
