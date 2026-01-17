"""
Psychology Assessment Database Models

New models for comprehensive psychology data tracking including:
- User profiles
- Psychology assessments
- Questionnaires and responses
- IFS parts detection
- Cognitive patterns detection
- Attachment styles
- Narrative identities
- Personality styles
- Analysis texts
- Psychology reports
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Numeric
from sqlalchemy.dialects.postgresql import JSON as JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from .models import Base


class UserProfile(Base):
    """User profile information"""
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(255))
    email = Column(String(255))

    # Profile metadata
    age = Column(Integer)
    gender = Column(String(50))
    language_preference = Column(String(10), default='zh')

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assessments = relationship("PsychologyAssessment", back_populates="user", cascade="all, delete-orphan")
    questionnaire_responses = relationship("QuestionnaireResponse", back_populates="user", cascade="all, delete-orphan")


class PsychologyAssessment(Base):
    """Central psychology assessment record"""
    __tablename__ = "psychology_assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), ForeignKey("user_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_type = Column(String(50), nullable=False)  # 'questionnaire', 'conversation', 'combined'

    # Five core dimension scores (0-100)
    emotional_regulation_score = Column(Integer)
    cognitive_flexibility_score = Column(Integer)
    relationship_sensitivity_score = Column(Integer)
    internal_conflict_score = Column(Integer)
    growth_potential_score = Column(Integer)

    # Confidence/reliability (0.0-1.0)
    emotional_regulation_confidence = Column(Numeric(3, 2))
    cognitive_flexibility_confidence = Column(Numeric(3, 2))
    relationship_sensitivity_confidence = Column(Numeric(3, 2))
    internal_conflict_confidence = Column(Numeric(3, 2))
    growth_potential_confidence = Column(Numeric(3, 2))

    # Sub-dimension scores (JSONB)
    sub_dimension_scores = Column(JSONB, default={})

    # IFS-specific metrics
    ifs_metrics = Column(JSONB, default={})

    # Attachment profile
    attachment_profile = Column(JSONB, default={})

    # Narrative profile
    narrative_profile = Column(JSONB, default={})

    # Dominant elements
    dominant_ifs_part = Column(String(50))
    dominant_cognitive_pattern = Column(String(50))
    dominant_narrative = Column(String(50))
    personality_style = Column(String(100))

    # Perspective shifting
    perspective_shifting_summary = Column(String(50))
    perspective_shifting_stars = Column(Integer)

    # Data source tracking
    questionnaire_contribution = Column(Integer, default=0)
    conversation_contribution = Column(Integer, default=0)

    # Status
    is_complete = Column(Boolean, default=False)
    completion_percentage = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime)

    # Extra data
    extra_data = Column(JSONB, default={})

    # Relationships
    user = relationship("UserProfile", back_populates="assessments")
    ifs_parts = relationship("IFSPartsDetection", back_populates="assessment", cascade="all, delete-orphan")
    cognitive_patterns = relationship("CognitivePatternsDetection", back_populates="assessment", cascade="all, delete-orphan")
    attachment_style = relationship("AttachmentStyle", back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    narrative_identity = relationship("NarrativeIdentity", back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    personality_style_obj = relationship("PersonalityStyle", back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    analysis_texts = relationship("AnalysisText", back_populates="assessment", cascade="all, delete-orphan")
    reports = relationship("PsychologyReport", back_populates="assessment", cascade="all, delete-orphan")


class Questionnaire(Base):
    """Questionnaire definitions"""
    __tablename__ = "questionnaires"

    id = Column(Integer, primary_key=True, index=True)
    questionnaire_code = Column(String(50), unique=True, nullable=False, index=True)
    name_en = Column(String(255), nullable=False)
    name_zh = Column(String(255), nullable=False)
    description_en = Column(Text)
    description_zh = Column(Text)

    # Target dimensions
    target_dimensions = Column(JSONB, nullable=False)

    # Extra data
    total_questions = Column(Integer, nullable=False)
    estimated_duration_minutes = Column(Integer)
    version = Column(String(20), default='1.0')
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    questions = relationship("QuestionnaireQuestion", back_populates="questionnaire", cascade="all, delete-orphan")
    responses = relationship("QuestionnaireResponse", back_populates="questionnaire")


class QuestionnaireQuestion(Base):
    """Questionnaire questions"""
    __tablename__ = "questionnaire_questions"

    id = Column(Integer, primary_key=True, index=True)
    questionnaire_id = Column(Integer, ForeignKey("questionnaires.id", ondelete="CASCADE"), nullable=False, index=True)
    question_number = Column(Integer, nullable=False)

    # Question content
    question_text_en = Column(Text, nullable=False)
    question_text_zh = Column(Text, nullable=False)

    # Question type
    question_type = Column(String(50), nullable=False)

    # Options
    options = Column(JSONB)

    # Scoring configuration
    dimension_weights = Column(JSONB, nullable=False)
    reverse_scored = Column(Boolean, default=False)

    # Validation
    is_required = Column(Boolean, default=True)
    min_value = Column(Integer)
    max_value = Column(Integer)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    questionnaire = relationship("Questionnaire", back_populates="questions")


class QuestionnaireResponse(Base):
    """User questionnaire responses"""
    __tablename__ = "questionnaire_responses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), ForeignKey("user_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    questionnaire_id = Column(Integer, ForeignKey("questionnaires.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("psychology_assessments.id", ondelete="SET NULL"))

    # Response status
    status = Column(String(50), default='in_progress')

    # Responses data (structured by section)
    responses = Column(JSONB, nullable=False, default={})

    # Calculated scores
    section_scores = Column(JSONB)
    dimension_scores = Column(JSONB)

    # Timing
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    time_spent_seconds = Column(Integer)

    # Progress tracking
    total_questions = Column(Integer)
    answered_questions = Column(Integer)
    completion_percentage = Column(Integer)

    # Extra data
    extra_data = Column(JSONB, default={})

    # Relationships
    user = relationship("UserProfile", back_populates="questionnaire_responses")
    questionnaire = relationship("Questionnaire", back_populates="responses")


class IFSPartsDetection(Base):
    """IFS parts detection records"""
    __tablename__ = "ifs_parts_detections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), ForeignKey("user_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("psychology_assessments.id", ondelete="CASCADE"), index=True)

    # Source
    source_type = Column(String(50), nullable=False, index=True)
    source_id = Column(Integer)

    # IFS Category
    ifs_category = Column(String(50), index=True)
    category_score = Column(Integer)

    # Specific Part
    part_id = Column(String(50), nullable=False, index=True)
    part_name_en = Column(String(100))
    part_name_zh = Column(String(100))

    # Detection details
    detected = Column(Boolean, default=True)
    confidence_score = Column(Numeric(3, 2))
    detection_count = Column(Integer, default=1)

    # Evidence
    evidence_text = Column(Text)
    evidence_data = Column(JSONB)

    # Timestamps
    first_detected_at = Column(DateTime, default=datetime.utcnow)
    last_detected_at = Column(DateTime, default=datetime.utcnow)

    # Extra data
    extra_data = Column(JSONB, default={})

    # Relationships
    assessment = relationship("PsychologyAssessment", back_populates="ifs_parts")


class CognitivePatternsDetection(Base):
    """Cognitive patterns detection records"""
    __tablename__ = "cognitive_patterns_detections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), ForeignKey("user_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("psychology_assessments.id", ondelete="CASCADE"), index=True)

    # Source
    source_type = Column(String(50), nullable=False, index=True)
    source_id = Column(Integer)

    # Pattern information
    pattern_id = Column(String(50), nullable=False, index=True)
    pattern_name_en = Column(String(100))
    pattern_name_zh = Column(String(100))

    # Detection details
    detected = Column(Boolean, default=True)
    confidence_score = Column(Numeric(3, 2))
    detection_count = Column(Integer, default=1)

    # Evidence
    evidence_examples = Column(JSONB)

    # Timestamps
    first_detected_at = Column(DateTime, default=datetime.utcnow)
    last_detected_at = Column(DateTime, default=datetime.utcnow)

    # Extra data
    extra_data = Column(JSONB, default={})

    # Relationships
    assessment = relationship("PsychologyAssessment", back_populates="cognitive_patterns")


class AttachmentStyle(Base):
    """Attachment style records"""
    __tablename__ = "attachment_styles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), ForeignKey("user_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("psychology_assessments.id", ondelete="CASCADE"), index=True)

    # Source
    source_type = Column(String(50), nullable=False)
    source_id = Column(Integer)

    # Attachment style scores (3-15 each)
    secure_score = Column(Integer)
    anxious_score = Column(Integer)
    avoidant_score = Column(Integer)
    disorganized_score = Column(Integer)

    # Boolean detection flags (for report)
    secure_detected = Column(Boolean, default=False)
    anxious_detected = Column(Boolean, default=False)
    avoidant_detected = Column(Boolean, default=False)
    disorganized_detected = Column(Boolean, default=False)

    # Dominant style
    dominant_style = Column(String(50), index=True)
    dominant_confidence = Column(Numeric(3, 2))

    # Evidence
    evidence_data = Column(JSONB)

    # Timestamps
    detected_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Extra data
    extra_data = Column(JSONB, default={})

    # Relationships
    assessment = relationship("PsychologyAssessment", back_populates="attachment_style")


class NarrativeIdentity(Base):
    """Narrative identity records"""
    __tablename__ = "narrative_identities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), ForeignKey("user_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("psychology_assessments.id", ondelete="CASCADE"), index=True)

    # Source
    source_type = Column(String(50), nullable=False)
    source_id = Column(Integer)

    # Narrative type scores
    hero_score = Column(Integer)
    victim_score = Column(Integer)
    rebel_score = Column(Integer)
    lost_score = Column(Integer)
    explorer_score = Column(Integer)

    # Dominant narrative
    dominant_narrative = Column(String(50), index=True)
    dominant_confidence = Column(Numeric(3, 2))

    # Evidence
    evidence_data = Column(JSONB)

    # Timestamps
    detected_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Extra data
    extra_data = Column(JSONB, default={})

    # Relationships
    assessment = relationship("PsychologyAssessment", back_populates="narrative_identity")


class PersonalityStyle(Base):
    """Personality style classification"""
    __tablename__ = "personality_styles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), ForeignKey("user_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("psychology_assessments.id", ondelete="CASCADE"), index=True)

    # Personality type
    style_type = Column(String(100), nullable=False, index=True)
    style_name_en = Column(String(100))
    style_name_zh = Column(String(100))

    # Classification confidence
    confidence = Column(Numeric(3, 2))

    # Supporting data
    classification_basis = Column(JSONB)

    # Description
    description_en = Column(Text)
    description_zh = Column(Text)

    # Timestamps
    classified_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Extra data
    extra_data = Column(JSONB, default={})

    # Relationships
    assessment = relationship("PsychologyAssessment", back_populates="personality_style_obj")


class AnalysisText(Base):
    """AI-generated analysis texts"""
    __tablename__ = "analysis_texts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), ForeignKey("user_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("psychology_assessments.id", ondelete="CASCADE"), index=True)

    # Analysis type
    analysis_type = Column(String(50), nullable=False, index=True)
    analysis_category = Column(String(50))

    # Related entity
    related_entity_type = Column(String(50), index=True)
    related_entity_id = Column(String(50), index=True)

    # Analysis text
    text_en = Column(Text)
    text_zh = Column(Text, nullable=False)

    # Generation metadata
    generated_by = Column(String(50), default='ai')
    model_version = Column(String(50))
    confidence = Column(Numeric(3, 2))

    # Timestamps
    generated_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Extra data
    extra_data = Column(JSONB, default={})

    # Relationships
    assessment = relationship("PsychologyAssessment", back_populates="analysis_texts")


class PsychologyReport(Base):
    """Generated psychology reports"""
    __tablename__ = "psychology_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), ForeignKey("user_profiles.user_id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("psychology_assessments.id", ondelete="CASCADE"), nullable=False, index=True)

    # Report metadata
    report_type = Column(String(50), default='comprehensive')
    language = Column(String(10), default='zh')
    format = Column(String(20), default='pdf')

    # Report content
    report_data = Column(JSONB, nullable=False)

    # File storage
    file_url = Column(String(500))
    file_path = Column(String(500))
    file_size_bytes = Column(Integer)

    # Status
    generation_status = Column(String(50), default='pending', index=True)
    error_message = Column(Text)

    # Timestamps
    requested_at = Column(DateTime, default=datetime.utcnow)
    generated_at = Column(DateTime)
    expires_at = Column(DateTime, index=True)

    # Extra data
    extra_data = Column(JSONB, default={})

    # Relationships
    assessment = relationship("PsychologyAssessment", back_populates="reports")
