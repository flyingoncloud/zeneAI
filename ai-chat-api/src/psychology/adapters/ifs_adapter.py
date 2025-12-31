"""IFS Adapter - Adapts existing IFS detector to work with multi-framework architecture."""

from typing import List, Dict
from src.psychology.base_detector import BaseFrameworkDetector
from src.ifs.detector import IFSDetector


class IFSAdapter(BaseFrameworkDetector):
    """
    Adapter to integrate existing IFS detector with multi-framework architecture.
    
    This adapter wraps the existing IFSDetector to conform to the BaseFrameworkDetector
    interface while preserving all existing IFS functionality.
    """
    
    def __init__(self, ifs_detector: IFSDetector):
        self.ifs_detector = ifs_detector
        # Don't call super().__init__() as we use the existing IFS patterns
    
    def get_framework_name(self) -> str:
        """Return the framework name."""
        return 'ifs'
    
    def get_patterns(self) -> Dict[str, Dict[str, List[str]]]:
        """
        Return IFS patterns in the expected format.
        
        Note: This is for interface compliance. The actual IFS detector
        uses its own pattern matching system.
        """
        # Return empty patterns as IFS uses its own pattern system
        return {}
    
    def quick_scan(self, messages: List[Dict]) -> Dict:
        """
        Perform quick pattern scan using existing IFS pattern matcher.
        
        Args:
            messages: List of message dicts
            
        Returns:
            Standardized pattern scan result
        """
        try:
            # Use existing IFS quick detection
            ifs_result = self.ifs_detector.detect_quick(messages)
            
            # Convert to standard format
            has_patterns = (
                ifs_result.get('has_self', False) or 
                ifs_result.get('has_parts', False)
            )
            
            return {
                'has_patterns': has_patterns,
                'patterns_found': ifs_result.get('patterns_found', {}),
                'framework': 'ifs'
            }
            
        except Exception as e:
            # Fallback to empty result
            return {
                'has_patterns': False,
                'patterns_found': {},
                'framework': 'ifs'
            }
    
    def analyze_with_llm(self, messages: List[Dict], patterns: Dict) -> Dict:
        """
        Perform LLM analysis using existing IFS system.
        
        Args:
            messages: Recent conversation messages
            patterns: Detected patterns from quick_scan
            
        Returns:
            Standardized LLM analysis result
        """
        try:
            # Use existing IFS detection system
            ifs_result = self.ifs_detector.detect(messages)
            
            # Convert IFS result to standard framework format
            elements_detected = []
            
            # Convert IFS parts to standard elements
            for part in ifs_result.get('parts_detected', []):
                elements_detected.append({
                    'id': part.get('id', 'unknown'),
                    'type': 'ifs_part',
                    'subtype': part.get('type', 'unknown'),
                    'content': part.get('name', ''),
                    'intensity': part.get('intensity', 0.5),
                    'evidence': part.get('evidence', ''),
                    'confidence': part.get('confidence', 0.5),
                    'emotions': part.get('emotions', []),
                    'triggers': part.get('triggers', []),
                    'needs': part.get('needs', [])
                })
            
            # Add Self presence as an element if detected
            self_presence = ifs_result.get('self_presence', {})
            if self_presence.get('detected', False):
                elements_detected.append({
                    'id': 'self_presence',
                    'type': 'ifs_self',
                    'subtype': 'self_energy',
                    'content': 'Self-energy presence',
                    'intensity': self_presence.get('score', 0.5),
                    'evidence': self_presence.get('evidence', ''),
                    'confidence': self_presence.get('score', 0.5),
                    'indicators': self_presence.get('indicators', [])
                })
            
            # Calculate overall confidence
            confidence_score = 0.0
            if elements_detected:
                confidences = [elem.get('confidence', 0.5) for elem in elements_detected]
                confidence_score = sum(confidences) / len(confidences)
            
            return {
                'confidence_score': confidence_score,
                'elements_detected': elements_detected,
                'evidence': self._extract_evidence(ifs_result),
                'ifs_original_result': ifs_result  # Preserve original for backward compatibility
            }
            
        except Exception as e:
            # Return empty result on error
            return {
                'confidence_score': 0.0,
                'elements_detected': [],
                'evidence': None,
                'error': str(e)
            }
    
    def _extract_evidence(self, ifs_result: Dict) -> str:
        """Extract evidence text from IFS result."""
        evidence_parts = []
        
        # Self presence evidence
        self_evidence = ifs_result.get('self_presence', {}).get('evidence')
        if self_evidence:
            evidence_parts.append(f"Self: {self_evidence}")
        
        # Parts evidence
        for part in ifs_result.get('parts_detected', []):
            part_evidence = part.get('evidence')
            if part_evidence:
                part_name = part.get('name', part.get('type', 'Part'))
                evidence_parts.append(f"{part_name}: {part_evidence}")
        
        return "; ".join(evidence_parts) if evidence_parts else None
    
    def get_default_config(self) -> Dict:
        """Return default configuration for IFS framework."""
        return {
            'enabled': True,
            'analysis_interval': 3,
            'confidence_threshold': 0.6,
            'window_size': 10
        }