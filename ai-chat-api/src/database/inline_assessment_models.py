"""
Database models for inline assessment question tracking.

Tracks assessment questions asked naturally during chat conversations,
unlike UserQuestionnaireProgress which tracks the formal 83-question assessment.
"""

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey,
    JSON, Boolean, UniqueConstraint, Index, CheckConstraint
)
from sqlalchemy.orm import relationship
from datetime import datetime
from src.database.models import Base


class InlineAssessmentProgress(Base):
    """
    Tracks inline assessment progress and answers collected during conversations.
    Unlike UserQuestionnaireProgress (for formal 83-question assessment),
    this tracks questions asked naturally during chat.
    """
    __tablename__ = "inline_assessment_progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(255), nullable=False, index=True)
    conversation_id = Column(Integer, ForeignKey('conversations.id'), nullable=False)

    # Question tracking
    question_id = Column(Integer, ForeignKey('assessment_questions.id'), nullable=False)
    answer_value = Column(Integer, nullable=False)  # 1-5 scale

    # Domain classification
    domain = Column(String(10), nullable=False, index=True)  # e.g., "2.1"
    subcategory = Column(String(20), nullable=True)  # e.g., "2.1.2"

    # Context
    asked_at = Column(DateTime, default=datetime.utcnow)
    answered_at = Column(DateTime, default=datetime.utcnow)
    conversation_context = Column(JSON, default={})  # Store relevant conversation snippet

    # Relationships
    question = relationship("AssessmentQuestion")
    conversation = relationship("Conversation")

    __table_args__ = (
        UniqueConstraint('user_id', 'question_id', name='uq_user_question_inline'),
        Index('idx_user_domain', 'user_id', 'domain'),
        Index('idx_user_question', 'user_id', 'question_id'),
        CheckConstraint('answer_value >= 1 AND answer_value <= 5', name='ck_answer_value_range'),
        CheckConstraint("domain IN ('2.1', '2.2', '2.3', '2.4', '2.5')", name='ck_domain_valid'),
    )

    def __repr__(self):
        return (
            f"<InlineAssessmentProgress(id={self.id}, user_id={self.user_id}, "
            f"question_id={self.question_id}, domain={self.domain})>"
        )


class InlineAssessmentSummary(Base):
    """
    Aggregated summary of inline assessment progress per user.
    Updated after each answer to track overall progress.
    """
    __tablename__ = "inline_assessment_summary"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(255), nullable=False, unique=True, index=True)

    # Progress metrics
    total_answered = Column(Integer, default=0)
    total_questions = Column(Integer, default=83)
    completion_percentage = Column(Float, default=0.0)

    # Domain coverage (JSON array of domain codes)
    domains_covered = Column(JSON, default=[])  # ["2.1", "2.2", ...]
    domain_question_counts = Column(JSON, default={})  # {"2.1": 5, "2.2": 3, ...}

    # Report generation
    can_generate_report = Column(Boolean, default=False)
    report_generated = Column(Boolean, default=False)
    report_id = Column(Integer, ForeignKey('psychology_reports.id'), nullable=True)

    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow)
    last_updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    report = relationship("PsychologyReport")

    __table_args__ = (
        UniqueConstraint('user_id', name='uq_user_inline_summary'),
    )

    def __repr__(self):
        return (
            f"<InlineAssessmentSummary(id={self.id}, user_id={self.user_id}, "
            f"total_answered={self.total_answered}, can_generate_report={self.can_generate_report})>"
        )

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'total_answered': self.total_answered,
            'total_questions': self.total_questions,
            'completion_percentage': self.completion_percentage,
            'domains_covered': self.domains_covered or [],
            'domain_question_counts': self.domain_question_counts or {},
            'can_generate_report': self.can_generate_report,
            'report_generated': self.report_generated,
            'report_id': self.report_id,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'last_updated_at': self.last_updated_at.isoformat() if self.last_updated_at else None,
        }
