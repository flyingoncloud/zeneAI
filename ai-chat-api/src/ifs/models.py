"""Pydantic models for IFS detection."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class SelfPresence(BaseModel):
    """Indicators of Self-energy in conversation."""
    detected: bool = False
    score: float = Field(default=0.0, ge=0.0, le=1.0)
    indicators: List[str] = Field(default_factory=list)
    evidence: Optional[str] = None


class Part(BaseModel):
    """Detected IFS part."""
    id: str
    type: str  # 'manager', 'firefighter', 'exile'
    subtype: Optional[str] = None  # 'perfectionist', 'caretaker', 'critic', etc.
    name: Optional[str] = None
    intensity: float = Field(default=0.5, ge=0.0, le=1.0)
    emotions: List[str] = Field(default_factory=list)
    triggers: List[str] = Field(default_factory=list)
    needs: List[str] = Field(default_factory=list)
    evidence: Optional[str] = None
    first_detected_message: Optional[int] = None
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)


class IFSAnalysis(BaseModel):
    """Complete IFS analysis result."""
    analyzed: bool = True
    llm_used: bool = False
    analysis_type: str = "hybrid"  # 'pattern_only', 'hybrid', 'llm_full'
    self_presence: SelfPresence = Field(default_factory=SelfPresence)
    parts_detected: List[Part] = Field(default_factory=list)
    last_analyzed_message_id: Optional[int] = None
    analysis_count: int = 0
    timestamp: Optional[datetime] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }
