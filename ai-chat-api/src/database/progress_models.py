"""
Database models for questionnaire progress tracking

Provides SQLAlchemy models for tracking user progress through questionnaires,
enabling save/resume functionality and state persistence.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from src.database.database import Base


class UserQuestionnaireProgress(Base):
    """
    Tracks user progress through a questionnaire.

    Enables:
    - Save/resume functionality
    - State persistence across sessions
    - Category-based scoring
    - Report generation on completion
    """
    __tablename__ = "user_questionnaire_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    session_id = Column(String(255))
    conversation_id = Column(Integer, ForeignKey('conversations.id'))
    questionnaire_id = Column(String(50), default='admin_created')

    # Progress tracking
    current_question_index = Column(Integer, default=0)
    total_questions = Column(Integer, nullable=False)
    answers = Column(JSON, default=dict)  # {question_id: answer_value}
    category_scores = Column(JSON, default=dict)  # {category: score}

    # Status
    status = Column(String(20), default='in_progress', index=True)  # in_progress, completed, abandoned
    started_at = Column(DateTime, default=datetime.utcnow)
    last_updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Report reference
    report_id = Column(Integer, ForeignKey('psychology_reports.id'), nullable=True)

    # Relationships
    conversation = relationship("Conversation", back_populates="questionnaire_progress")
    report = relationship("PsychologyReport", back_populates="progress_records")

    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'questionnaire_id', name='uq_user_questionnaire'),
    )

    def __repr__(self):
        return f"<UserQuestionnaireProgress(id={self.id}, user_id={self.user_id}, status={self.status}, progress={self.current_question_index}/{self.total_questions})>"

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'conversation_id': self.conversation_id,
            'questionnaire_id': self.questionnaire_id,
            'current_question_index': self.current_question_index,
            'total_questions': self.total_questions,
            'answers': self.answers or {},
            'category_scores': self.category_scores or {},
            'status': self.status,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'last_updated_at': self.last_updated_at.isoformat() if self.last_updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'report_id': self.report_id
        }

    @property
    def completion_percentage(self) -> float:
        """Calculate completion percentage"""
        if self.total_questions == 0:
            return 0.0
        return (self.current_question_index / self.total_questions) * 100

    @property
    def is_completed(self) -> bool:
        """Check if questionnaire is completed"""
        return self.status == 'completed'

    @property
    def can_resume(self) -> bool:
        """Check if questionnaire can be resumed"""
        return self.status == 'in_progress' and self.current_question_index < self.total_questions

