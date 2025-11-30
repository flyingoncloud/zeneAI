"""Main IFS Detector - orchestrates pattern matching and LLM analysis.

Hybrid approach: Fast pattern matching → LLM validation when needed.
Optimized for speed and efficiency.
"""

import logging
from typing import List, Dict, Optional
from src.ifs.pattern_matcher import PatternMatcher
from src.ifs.llm_analyzer import LLMAnalyzer
from src.ifs.state_manager import StateManager
from src.ifs.models import IFSAnalysis, SelfPresence
from src.config.settings import (
    IFS_DETECTION_ENABLED,
    IFS_ANALYSIS_INTERVAL,
    IFS_WINDOW_SIZE,
    IFS_MIN_CONFIDENCE
)

logger = logging.getLogger(__name__)


class IFSDetector:
    """
    Main IFS detection orchestrator.

    Two-stage hybrid approach:
    1. Fast pattern matching (< 10ms)
    2. LLM analysis only when patterns found

    Supports English and Chinese languages.
    """

    def __init__(self):
        self.pattern_matcher = PatternMatcher()
        self.llm_analyzer = LLMAnalyzer()
        self.state_manager = StateManager()
        self.enabled = IFS_DETECTION_ENABLED

    def should_analyze(self, message_count: int) -> bool:
        """
        Determine if IFS analysis should run.

        Args:
            message_count: Total number of messages in conversation

        Returns:
            True if analysis should run
        """
        if not self.enabled:
            return False

        # Run every N messages
        return message_count > 0 and message_count % IFS_ANALYSIS_INTERVAL == 0

    def detect(
        self,
        messages: List[Dict],
        existing_state: Optional[Dict] = None,
        current_message_id: Optional[int] = None
    ) -> Dict:
        """
        Detect IFS elements in conversation.

        Args:
            messages: List of message dicts with 'role' and 'content'
            existing_state: Previous IFS state from conversation metadata
            current_message_id: ID of current message

        Returns:
            IFS analysis dict
        """
        if not self.enabled:
            return self._disabled_response()

        try:
            # Get recent messages only (window for speed)
            recent_messages = messages[-IFS_WINDOW_SIZE:]

            # Stage 1: Fast pattern matching (< 10ms)
            logger.debug(f"Running pattern matching on {len(recent_messages)} messages")
            patterns = self.pattern_matcher.quick_scan(recent_messages)

            # Check if any patterns found
            has_indicators = patterns['has_self'] or patterns['has_parts']

            if not has_indicators:
                # No patterns found - skip LLM, return minimal response
                logger.debug("No IFS patterns detected, skipping LLM analysis")
                analysis = {
                    'analyzed': True,
                    'llm_used': False,
                    'analysis_type': 'pattern_only',
                    'self_presence': SelfPresence().dict(),
                    'parts_detected': []
                }
            else:
                # Stage 2: LLM analysis (only when patterns found)
                logger.debug(f"Patterns found, running LLM analysis: {list(patterns.keys())}")
                llm_result = self.llm_analyzer.analyze(recent_messages, patterns)

                analysis = {
                    'analyzed': True,
                    'llm_used': True,
                    'analysis_type': 'hybrid',
                    **llm_result
                }

            # Merge with existing state
            if existing_state:
                merged = self.state_manager.merge_analysis(
                    existing_state,
                    analysis,
                    current_message_id or len(messages)
                )
                return merged
            else:
                # First analysis
                analysis['last_analyzed_message_id'] = current_message_id or len(messages)
                analysis['analysis_count'] = 1
                return analysis

        except Exception as e:
            logger.error(f"IFS detection error: {e}", exc_info=True)
            return self._error_response()

    def detect_quick(
        self,
        messages: List[Dict]
    ) -> Dict:
        """
        Quick pattern-only detection without LLM.
        Fastest method for real-time feedback.

        Args:
            messages: Recent messages

        Returns:
            Pattern detection results
        """
        try:
            patterns = self.pattern_matcher.quick_scan(messages)

            return {
                'analyzed': True,
                'llm_used': False,
                'analysis_type': 'pattern_only',
                'patterns_found': patterns,
                'has_self': patterns['has_self'],
                'has_parts': patterns['has_parts']
            }
        except Exception as e:
            logger.error(f"Quick detection error: {e}")
            return self._error_response()

    def _disabled_response(self) -> Dict:
        """Return when IFS detection is disabled."""
        return {
            'analyzed': False,
            'enabled': False,
            'message': 'IFS detection is disabled'
        }

    def _error_response(self) -> Dict:
        """Return on error."""
        return {
            'analyzed': False,
            'error': True,
            'self_presence': SelfPresence().dict(),
            'parts_detected': []
        }
