"""Multi-Psychology Detector - Main orchestrator for all psychology frameworks."""

import logging
from typing import List, Dict, Optional
from datetime import datetime

from src.psychology.framework_manager import FrameworkManager
from src.psychology.models import FrameworkAnalysis, MultiFrameworkAnalysis
from src.psychology.data_collector import DataCollector
from src.config.settings import get_framework_config, PSYCHOLOGY_DETECTION_ENABLED

logger = logging.getLogger(__name__)


class MultiPsychologyDetector:
    """
    Main multi-psychology detection orchestrator.
    
    Coordinates analysis across multiple psychological frameworks while
    maintaining the proven two-stage hybrid approach (pattern matching + LLM analysis).
    """
    
    def __init__(self, framework_config: Optional[Dict] = None):
        self.enabled = PSYCHOLOGY_DETECTION_ENABLED
        self.framework_manager = FrameworkManager(framework_config or get_framework_config())
        self.data_collector = DataCollector()
        
        # Will be populated when frameworks are registered
        self._frameworks_registered = False
        
        # Register frameworks on initialization
        self.register_all_frameworks()
        
    def register_all_frameworks(self):
        """Register all available psychology frameworks."""
        if self._frameworks_registered:
            return
            
        try:
            # Register psychology frameworks
            from src.psychology.detectors.cbt_detector import CBTDetector
            from src.psychology.detectors.jungian_detector import JungianDetector
            from src.psychology.detectors.narrative_detector import NarrativeDetector
            from src.psychology.detectors.attachment_detector import AttachmentDetector
            
            self.framework_manager.register_framework(CBTDetector())
            self.framework_manager.register_framework(JungianDetector())
            self.framework_manager.register_framework(NarrativeDetector())
            self.framework_manager.register_framework(AttachmentDetector())
            
            # Try to register IFS if available
            try:
                from src.ifs.detector import IFSDetector
                from src.psychology.adapters.ifs_adapter import IFSAdapter
                
                ifs_detector = IFSDetector()
                ifs_adapter = IFSAdapter(ifs_detector)
                self.framework_manager.register_framework(ifs_adapter)
                logger.info("IFS framework registered successfully")
            except ImportError:
                logger.warning("IFS detector not available, skipping IFS registration")
            
            self._frameworks_registered = True
            
            # Log registered frameworks
            enabled_frameworks = self.framework_manager.get_enabled_frameworks()
            logger.info(f"Psychology frameworks registered successfully: {enabled_frameworks}")
            
        except Exception as e:
            logger.error(f"Failed to register frameworks: {e}")
            # Continue with partial registration
    
    def should_analyze(self, message_count: int) -> bool:
        """
        Determine if any framework should analyze.
        
        Args:
            message_count: Total number of messages in conversation
            
        Returns:
            True if any enabled framework should analyze
        """
        if not self.enabled:
            return False
        
        enabled_frameworks = self.framework_manager.get_enabled_frameworks()
        if not enabled_frameworks:
            return False
        
        # Check if any framework should analyze at this message count
        for framework_name in enabled_frameworks:
            if self.framework_manager.should_analyze(framework_name, message_count):
                return True
        
        return False
    
    def analyze_conversation(
        self,
        messages: List[Dict],
        existing_state: Optional[Dict] = None,
        current_message_id: Optional[int] = None
    ) -> Dict:
        """
        Analyze conversation across all enabled frameworks.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            existing_state: Previous multi-framework state from conversation metadata
            current_message_id: ID of current message
            
        Returns:
            Multi-framework analysis dict
        """
        if not self.enabled:
            return self._disabled_response()
        
        # Ensure frameworks are registered
        self.register_all_frameworks()
        
        try:
            enabled_frameworks = self.framework_manager.get_enabled_frameworks()
            if not enabled_frameworks:
                logger.warning("No frameworks enabled for analysis")
                return self._empty_response()
            
            framework_results = {}
            message_count = len(messages)
            
            # Analyze each enabled framework
            for framework_name in enabled_frameworks:
                try:
                    # Check if this framework should analyze
                    if not self.framework_manager.should_analyze(framework_name, message_count):
                        continue
                    
                    # Get framework detector
                    detector = self.framework_manager.get_framework(framework_name)
                    if not detector:
                        logger.error(f"Framework detector not found: {framework_name}")
                        continue
                    
                    # Get framework-specific window size
                    config = self.framework_manager.get_framework_config(framework_name)
                    window_size = config.get('window_size', 10)
                    recent_messages = messages[-window_size:]
                    
                    # Perform analysis for this framework
                    result = self._analyze_framework(
                        detector, 
                        framework_name, 
                        recent_messages,
                        existing_state
                    )
                    
                    if result:
                        framework_results[framework_name] = result
                        
                        # Collect data for this framework
                        self.data_collector.collect_framework_data(
                            framework_name,
                            result,
                            current_message_id or len(messages),
                            current_message_id or len(messages)
                        )
                        
                except Exception as e:
                    logger.error(f"Framework {framework_name} analysis failed: {e}")
                    # Continue with other frameworks (error isolation)
                    framework_results[framework_name] = self._framework_error_response(framework_name)
            
            # Generate cross-framework insights
            cross_insights = self._generate_cross_framework_insights(framework_results)
            
            # Create analysis summary
            summary = self._create_analysis_summary(framework_results)
            
            # Build final response
            response = {
                'analyzed': True,
                'frameworks': framework_results,
                'cross_framework_insights': cross_insights,
                'analysis_summary': summary,
                'total_confidence': self._calculate_total_confidence(framework_results),
                'last_analyzed_message_id': current_message_id or len(messages),
                'analysis_count': (existing_state or {}).get('analysis_count', 0) + 1,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            return response
            
        except Exception as e:
            logger.error(f"Multi-framework analysis error: {e}", exc_info=True)
            return self._error_response()
    
    def _analyze_framework(
        self, 
        detector, 
        framework_name: str, 
        messages: List[Dict],
        existing_state: Optional[Dict] = None
    ) -> Optional[Dict]:
        """Analyze a single framework."""
        try:
            # Stage 1: Pattern matching
            patterns = detector.quick_scan(messages)
            
            if not patterns.get('has_patterns', False):
                # No patterns found - return pattern-only result
                return {
                    'framework_name': framework_name,
                    'analyzed': True,
                    'llm_used': False,
                    'analysis_type': 'pattern_only',
                    'confidence_score': 0.0,
                    'elements_detected': [],
                    'patterns_found': patterns.get('patterns_found', {}),
                    'evidence': None,
                    'timestamp': datetime.utcnow().isoformat()
                }
            
            # Stage 2: LLM analysis (only when patterns found)
            logger.debug(f"Patterns found for {framework_name}, running LLM analysis")
            llm_result = detector.analyze_with_llm(messages, patterns)
            
            return {
                'framework_name': framework_name,
                'analyzed': True,
                'llm_used': True,
                'analysis_type': 'hybrid',
                'confidence_score': llm_result.get('confidence_score', 0.5),
                'elements_detected': llm_result.get('elements_detected', []),
                'patterns_found': patterns.get('patterns_found', {}),
                'evidence': llm_result.get('evidence'),
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Framework {framework_name} analysis error: {e}")
            return None
    
    def _generate_cross_framework_insights(self, framework_results: Dict) -> Dict:
        """Generate insights from multiple framework detections."""
        insights = {}
        
        # Find frameworks with detections
        frameworks_with_detections = [
            name for name, result in framework_results.items()
            if result.get('elements_detected', [])
        ]
        
        if len(frameworks_with_detections) > 1:
            insights['multiple_frameworks_detected'] = {
                'frameworks': frameworks_with_detections,
                'description': f"Multiple therapeutic frameworks detected: {', '.join(frameworks_with_detections)}",
                'therapeutic_relevance': 'Complex psychological presentation requiring multi-modal approach'
            }
        
        # Calculate framework overlap
        if len(frameworks_with_detections) >= 2:
            insights['framework_overlap'] = {
                'count': len(frameworks_with_detections),
                'complexity_indicator': len(frameworks_with_detections) / len(framework_results)
            }
        
        return insights
    
    def _create_analysis_summary(self, framework_results: Dict) -> Dict:
        """Create summary of multi-framework analysis."""
        frameworks_with_detections = [
            name for name, result in framework_results.items()
            if result.get('elements_detected', [])
        ]
        
        # Find highest confidence framework
        highest_confidence_framework = None
        highest_confidence = 0.0
        
        for name, result in framework_results.items():
            confidence = result.get('confidence_score', 0.0)
            if confidence > highest_confidence:
                highest_confidence = confidence
                highest_confidence_framework = name
        
        return {
            'total_frameworks_analyzed': len(framework_results),
            'frameworks_with_detections': frameworks_with_detections,
            'highest_confidence_framework': highest_confidence_framework,
            'complexity_score': len(frameworks_with_detections) / max(len(framework_results), 1)
        }
    
    def _calculate_total_confidence(self, framework_results: Dict) -> float:
        """Calculate overall confidence across all frameworks."""
        if not framework_results:
            return 0.0
        
        confidences = [
            result.get('confidence_score', 0.0) 
            for result in framework_results.values()
        ]
        
        return sum(confidences) / len(confidences)
    
    def _disabled_response(self) -> Dict:
        """Return when multi-framework detection is disabled."""
        return {
            'analyzed': False,
            'enabled': False,
            'message': 'Multi-framework psychology detection is disabled'
        }
    
    def _empty_response(self) -> Dict:
        """Return when no frameworks are enabled."""
        return {
            'analyzed': False,
            'frameworks': {},
            'message': 'No psychology frameworks enabled'
        }
    
    def _error_response(self) -> Dict:
        """Return on general error."""
        return {
            'analyzed': False,
            'error': True,
            'frameworks': {},
            'cross_framework_insights': {},
            'analysis_summary': {}
        }
    
    def _framework_error_response(self, framework_name: str) -> Dict:
        """Return error response for a specific framework."""
        return {
            'framework_name': framework_name,
            'analyzed': False,
            'error': True,
            'confidence_score': 0.0,
            'elements_detected': [],
            'patterns_found': {},
            'timestamp': datetime.utcnow().isoformat()
        }