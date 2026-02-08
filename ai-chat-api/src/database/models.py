from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class Conversation(Base):
    """Match existing schema from main project"""
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), unique=True, nullable=False, index=True)
    user_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    extra_data = Column("metadata", JSON, default={})

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    questionnaire_progress = relationship("UserQuestionnaireProgress", back_populates="conversation")


class Message(Base):
    """Match existing schema from main project"""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"))
    role = Column(String(50), nullable=False)  # 'user', 'assistant', 'system'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    extra_data = Column("metadata", JSON, default={})

    conversation = relationship("Conversation", back_populates="messages")


class MediaFile(Base):
    """Media files uploaded through admin panel"""
    __tablename__ = "media_files"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String(500), nullable=False, unique=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=True)
    file_type = Column(String(20), nullable=False)  # 'image' or 'video'
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    file_hash = Column(String(64), nullable=True, index=True)  # SHA256 hash for duplicate detection
    uploaded_at = Column(DateTime, default=datetime.utcnow, index=True)
    uploaded_by = Column(String(255), nullable=True)  # Future: track who uploaded
    deleted_at = Column(DateTime, nullable=True)  # Soft delete
    extra_data = Column("metadata", JSON, default={})  # Additional metadata

