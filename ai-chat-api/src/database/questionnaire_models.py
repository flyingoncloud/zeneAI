"""
Database models for questionnaire system
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from src.database.models import Base


class AssessmentQuestionnaire(Base):
    """Questionnaire metadata"""
    __tablename__ = "assessment_questionnaires"

    id = Column(String, primary_key=True)  # e.g., "questionnaire_2_1"
    section = Column(String, nullable=False)  # e.g., "2.1"
    title = Column(String, nullable=False)
    marking_criteria = Column(JSON)  # Scoring rules and interpretation
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    questions = relationship("AssessmentQuestion", back_populates="questionnaire", cascade="all, delete-orphan")
    responses = relationship("AssessmentResponse", back_populates="questionnaire")


class AssessmentQuestion(Base):
    """Individual questions"""
    __tablename__ = "assessment_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    questionnaire_id = Column(String, ForeignKey("assessment_questionnaires.id"), nullable=False)
    question_number = Column(Integer, nullable=False)  # Question number within questionnaire
    text = Column(Text, nullable=False)
    category = Column(String)  # For nested categories (e.g., "Managers", "Firefighters")
    sub_section = Column(String)  # For sub-sections (e.g., "2.2.1")
    dimension = Column(String)  # For dimensions (e.g., "Insight Depth")
    options = Column(JSON)  # For multiple choice questions
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    questionnaire = relationship("AssessmentQuestionnaire", back_populates="questions")
    answers = relationship("AssessmentAnswer", back_populates="question")


class AssessmentResponse(Base):
    """User's response to a complete questionnaire"""
    __tablename__ = "assessment_responses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    questionnaire_id = Column(String, ForeignKey("assessment_questionnaires.id"), nullable=False)

    # Calculated scores
    total_score = Column(Float)
    category_scores = Column(JSON)  # Scores per category/dimension
    interpretation = Column(JSON)  # Interpretation based on marking criteria

    completed_at = Column(DateTime, default=datetime.utcnow)
    extra_data = Column(JSON)  # Additional metadata

    # Relationships
    questionnaire = relationship("AssessmentQuestionnaire", back_populates="responses")
    answers = relationship("AssessmentAnswer", back_populates="response", cascade="all, delete-orphan")


class AssessmentAnswer(Base):
    """Individual answer to a question"""
    __tablename__ = "assessment_answers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    response_id = Column(Integer, ForeignKey("assessment_responses.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("assessment_questions.id"), nullable=False)
    answer_value = Column(Integer, nullable=False)  # The numeric answer (1-5)
    answered_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    response = relationship("AssessmentResponse", back_populates="answers")
    question = relationship("AssessmentQuestion", back_populates="answers")

