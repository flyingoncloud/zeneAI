"""Pydantic models for multi-framework psychology detection."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class FrameworkAnalysis(BaseModel):
    """Analysis result for a single psychology framework."""
    framework_name: str
    analyzed: bool = True
    llm_used: bool = False
    analysis_type: str = "hybrid"  # 'pattern_only', 'hybrid', 'llm_full'
    confidence_score: float = Field(default=0.5, ge=0.0, le=1.0)
    elements_detected: List[Dict] = Field(default_factory=list)
    patterns_found: Dict = Field(default_factory=dict)
    evidence: Optional[str] = None
    timestamp: Optional[datetime] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class MultiFrameworkAnalysis(BaseModel):
    """Complete multi-framework analysis result."""
    conversation_id: int
    message_id: int
    frameworks: Dict[str, FrameworkAnalysis] = Field(default_factory=dict)
    cross_framework_insights: Dict = Field(default_factory=dict)
    analysis_summary: Dict = Field(default_factory=dict)
    total_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class CBTElement(BaseModel):
    """Detected CBT (Cognitive Behavioral Therapy) element."""
    id: str
    type: str  # 'cognitive_distortion', 'behavioral_pattern', 'thought_record', 'intervention'
    subtype: str  # 'catastrophizing', 'behavioral_activation', etc.
    content: str
    intensity: float = Field(default=0.5, ge=0.0, le=1.0)
    evidence: str
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    thoughts: Optional[str] = None
    feelings: Optional[str] = None
    behaviors: Optional[str] = None
    first_detected_message: Optional[int] = None


class JungianElement(BaseModel):
    """Detected Jungian Psychology element."""
    id: str
    type: str  # 'archetype', 'complex', 'dream_symbol', 'individuation_marker'
    subtype: str  # 'shadow', 'anima', 'persona', etc.
    symbolic_content: Optional[str] = None
    archetypal_theme: Optional[str] = None
    individuation_stage: Optional[str] = None
    intensity: float = Field(default=0.5, ge=0.0, le=1.0)
    evidence: str
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    dream_context: Optional[bool] = None
    projection_indicator: Optional[bool] = None
    first_detected_message: Optional[int] = None


class NarrativeElement(BaseModel):
    """Detected Narrative Therapy element."""
    id: str
    type: str  # 'externalization', 'unique_outcome', 'preferred_identity', 'alternative_story'
    problem_separation: Optional[bool] = None
    story_development: Optional[str] = None
    identity_claim: Optional[str] = None
    narrative_shift: Optional[str] = None
    intensity: float = Field(default=0.5, ge=0.0, le=1.0)
    evidence: str
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    externalization_language: Optional[bool] = None
    re_authoring_indicator: Optional[bool] = None
    first_detected_message: Optional[int] = None


class AttachmentElement(BaseModel):
    """Detected Attachment Theory element."""
    id: str
    type: str  # 'attachment_style', 'relational_pattern', 'emotional_regulation', 'attachment_need'
    attachment_style: Optional[str] = None  # 'secure', 'anxious', 'avoidant', 'disorganized'
    relational_behavior: Optional[str] = None
    regulation_strategy: Optional[str] = None
    attachment_trigger: Optional[str] = None
    intensity: float = Field(default=0.5, ge=0.0, le=1.0)
    evidence: str
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    relationship_context: Optional[str] = None
    repair_attempt: Optional[bool] = None
    first_detected_message: Optional[int] = None


class CrossFrameworkInsight(BaseModel):
    """Insight generated from multiple framework detections."""
    insight_type: str  # 'overlap', 'contradiction', 'reinforcement', 'pattern'
    frameworks_involved: List[str]
    description: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: List[str] = Field(default_factory=list)
    therapeutic_relevance: Optional[str] = None


class AnalysisSummary(BaseModel):
    """Summary of multi-framework analysis."""
    total_frameworks_analyzed: int
    frameworks_with_detections: List[str]
    highest_confidence_framework: Optional[str] = None
    primary_therapeutic_themes: List[str] = Field(default_factory=list)
    complexity_score: float = Field(default=0.0, ge=0.0, le=1.0)
    therapeutic_recommendations: List[str] = Field(default_factory=list)