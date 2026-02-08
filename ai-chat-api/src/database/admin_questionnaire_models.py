"""
Database models for admin-managed questionnaire system
Supports 8 template types (F1-F8) with rich media and complex question types
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from src.database.models import Base
import enum


class QuestionStatus(enum.Enum):
    """Question publication status"""
    DRAFT = "draft"
    PUBLISHED = "published"


class TemplateType(enum.Enum):
    """Question templatetypes"""
    F1 = "F1"  # Likert 5
    F2 = "F2"  # Single Choice (Text)
    F3 = "F3"  # Single Choice + Stem Image
    F4 = "F4"  # Image Cards (A-D)
    F5 = "F5"  # Image Grid (2x3)
    F6 = "F6"  # Ranking Top N
    F7 = "F7"  # Direction Dial 0-360
    F8 = "F8"  # Video + Single Choice


class AdminQuestionnaire(Base):
    """
    Questionnaire created through admin panel
    A questionnaire is a collection of questions
    """
    __tablename__ = "admin_questionnaires"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Status and visibility
    status = Column(Enum(QuestionStatus), default=QuestionStatus.DRAFT, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Metadata
    tags = Column(JSON, default=[])  # Array of tag strings
    category = Column(String(100), nullable=True)  # e.g., "Emotional", "Cognitive"

    # Ordering
    display_order = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    published_at = Column(DateTime, nullable=True)

    # Relationships
    questions = relationship("AdminQuestion", back_populates="questionnaire", cascade="all, delete-orphan", order_by="AdminQuestion.display_order")
    responses = relationship("AdminQuestionnaireResponse", back_populates="questionnaire")


class AdminQuestion(Base):
    """
    Individual question created through admin panel
    Supports 8 different template types with rich configuration
    """
    __tablename__ = "admin_questions"

    id = Column(Integer, primary_key=True)  # User-defined ID (1-80)
    questionnaire_id = Column(Integer, ForeignKey("admin_questionnaires.id"), nullable=True)  # Optional: can be standalone

    # Basic info
    internal_title = Column(String(255), nullable=False)  # For admin reference
    template = Column(Enum(TemplateType), nullable=False)
    status = Column(Enum(QuestionStatus), default=QuestionStatus.DRAFT, nullable=False)

    # Question content
    stem = Column(Text, nullable=False)  # Main question text
    subtitle = Column(String(500), nullable=True)  # Optional subtitle/instruction

    # Media (for F3, F8)
    media_url = Column(String(500), nullable=True)
    media_type = Column(String(20), nullable=True)  # 'image' or 'video'

    # Options (for F2, F3, F4, F5, F6, F8)
    options = Column(JSON, default=[])  # Array of option objects

    # Template-specific settings
    template_settings = Column(JSON, default={})  # Template-specific configuration

    # Validation rules
    validation = Column(JSON, default={"required": True})  # Validation rules

    # Metadata
    tags = Column(JSON, default=[])  # Array of tag strings
    category = Column(String(100), nullable=True)  # Psychological dimension: 情绪识别能力, 认知重构能力, etc.

    # Ordering
    display_order = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    questionnaire = relationship("AdminQuestionnaire", back_populates="questions")
    answers = relationship("AdminQuestionAnswer", back_populates="question")


class AdminQuestionnaireResponse(Base):
    """
    User's response to a complete admin questionnaire
    """
    __tablename__ = "admin_questionnaire_responses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    questionnaire_id = Column(Integer, ForeignKey("admin_questionnaires.id"), nullable=False)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=True)
    user_id = Column(String(255), nullable=True)

    # Completion tracking
    is_complete = Column(Boolean, default=False)
    completion_percentage = Column(Integer, default=0)

    # Calculated scores (if applicable)
    total_score = Column(Integer, nullable=True)
    category_scores = Column(JSON, nullable=True)

    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Additional data
    extra_data = Column(JSON, default={})

    # Relationships
    questionnaire = relationship("AdminQuestionnaire", back_populates="responses")
    answers = relationship("AdminQuestionAnswer", back_populates="response", cascade="all, delete-orphan")


class AdminQuestionAnswer(Base):
    """
    Individual answer to an admin question
    Supports different answer types based on template
    """
    __tablename__ = "admin_question_answers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    response_id = Column(Integer, ForeignKey("admin_questionnaire_responses.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("admin_questions.id"), nullable=False)

    # Answer data (flexible to support different template types)
    answer_value = Column(JSON, nullable=False)  # Can be: int, string, array, object

    # Metadata
    answered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    time_spent_seconds = Column(Integer, nullable=True)  # Time spent on this question

    # Relationships
    response = relationship("AdminQuestionnaireResponse", back_populates="answers")
    question = relationship("AdminQuestion", back_populates="answers")


# Example JSON structures for different template types:
"""
F1 (Likert 5):
  options: []
  template_settings: {"leftLabel": "非常不同意", "rightLabel": "非常同意"}
  answer_value: 3

F2 (Single Choice Text):
  options: [{"id": "A", "text": "选项A", "value": 1, "label": "A"}, ...]
  template_settings: {}
  answer_value: "A"

F3 (Single Choice + Stem Image):
  media_url: "/uploads/image.png"
  media_type: "image"
  options: [{"id": "A", "text": "选项A", "value": 1, "label": "A"}, ...]
  template_settings: {}
  answer_value: "A"

F4 (Image Cards):
  options: [{"id": "A", "text": "选项A", "imageUrl": "/uploads/a.png", "value": 1, "label": "A"}, ...]
  template_settings: {}
  answer_value: "A"

F5 (Image Grid):
  options: [{"id": "A", "text": "选项A", "imageUrl": "/uploads/a.png", "value": 1, "label": "A"}, ...]
  template_settings: {"gridLayout": "2x3"}
  answer_value: "A"

F6 (Ranking Top N):
  options: [{"id": "opt1", "text": "选项1", "value": 0, "label": "1"}, ...]
  template_settings: {"topN": 3}
  answer_value: ["opt2", "opt1", "opt5"]  # Ordered array

F7 (Direction Dial):
  options: []
  template_settings: {
    "centerObject": "User",
    "targetObject": "Target",
    "defaultAngle": 0,
    "resetLabel": "重置",
    "sceneItems": []
  }
  answer_value: 45  # Angle in degrees

F8 (Video + Single Choice):
  media_url: "/uploads/video.mp4"
  media_type: "video"
  options: [{"id": "A", "text": "选项A", "value": 1, "label": "A"}, ...]
  template_settings: {}
  answer_value: "A"
"""
