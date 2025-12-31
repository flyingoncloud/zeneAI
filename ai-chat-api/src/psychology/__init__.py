"""Multi-Psychology Detection Module.

Extends the existing IFS detection system to support multiple psychological frameworks:
- IFS (Internal Family Systems) - Already implemented
- CBT (Cognitive Behavioral Therapy)
- Jungian Psychology
- Narrative Therapy
- Attachment Theory
"""

from src.psychology.multi_detector import MultiPsychologyDetector
from src.psychology.framework_manager import FrameworkManager
from src.psychology.base_detector import BaseFrameworkDetector
from src.psychology.models import (
    FrameworkAnalysis,
    MultiFrameworkAnalysis,
    CBTElement,
    JungianElement,
    NarrativeElement,
    AttachmentElement
)

__all__ = [
    "MultiPsychologyDetector",
    "FrameworkManager", 
    "BaseFrameworkDetector",
    "FrameworkAnalysis",
    "MultiFrameworkAnalysis",
    "CBTElement",
    "JungianElement", 
    "NarrativeElement",
    "AttachmentElement"
]