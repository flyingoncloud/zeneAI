"""Base Framework Detector - Abstract interface for all psychology framework detectors."""

from abc import ABC, abstractmethod
from typing import List, Dict, Optional
import re
from collections import defaultdict


class BaseFrameworkDetector(ABC):
    """
    Abstract base class for all psychology framework detectors.
    
    Provides common interface and shared functionality for pattern matching
    and LLM analysis across different psychological frameworks.
    """
    
    def __init__(self):
        self.patterns = self.get_patterns()
        self.compiled_patterns = self._compile_patterns()
    
    @abstractmethod
    def get_framework_name(self) -> str:
        """Return the name of this framework (e.g., 'cbt', 'jungian')."""
        pass
    
    @abstractmethod
    def get_patterns(self) -> Dict[str, Dict[str, List[str]]]:
        """
        Return pattern definitions for this framework.
        
        Format:
        {
            'category_name': {
                'en': ['english', 'keywords'],
                'cn': ['中文', '关键词']
            }
        }
        """
        pass
    
    @abstractmethod
    def analyze_with_llm(self, messages: List[Dict], patterns: Dict) -> Dict:
        """
        Perform LLM-based analysis for this framework.
        
        Args:
            messages: Recent conversation messages
            patterns: Detected patterns from quick_scan
            
        Returns:
            Framework-specific analysis results
        """
        pass
    
    def quick_scan(self, messages: List[Dict]) -> Dict:
        """
        Fast pattern matching for this framework.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            
        Returns:
            {
                'has_patterns': bool,
                'patterns_found': {...},
                'framework': str
            }
        """
        # Combine all user message content
        text = ' '.join(
            msg.get('content', '').lower() 
            for msg in messages 
            if msg.get('role') == 'user'
        )
        
        result = {
            'has_patterns': False,
            'patterns_found': {},
            'framework': self.get_framework_name()
        }
        
        # Check patterns for this framework
        patterns_found = self._match_patterns(text, self.compiled_patterns)
        if patterns_found:
            result['has_patterns'] = True
            result['patterns_found'] = patterns_found
        
        return result
    
    def _compile_patterns(self) -> Dict[str, Dict[str, set]]:
        """Compile patterns for faster matching."""
        compiled = defaultdict(lambda: defaultdict(set))
        
        for category, lang_patterns in self.patterns.items():
            for lang, keywords in lang_patterns.items():
                compiled[category][lang] = set(k.lower() for k in keywords)
        
        return dict(compiled)
    
    def _match_patterns(self, text: str, patterns: Dict) -> Dict[str, List[str]]:
        """Match patterns in text and return findings."""
        findings = {}
        
        for category, lang_patterns in patterns.items():
            matched = []
            
            # Check both English and Chinese patterns
            for lang, keywords in lang_patterns.items():
                for keyword in keywords:
                    if self._keyword_matches(text, keyword, lang):
                        matched.append(keyword)
            
            if matched:
                findings[category] = matched
        
        return findings
    
    def _keyword_matches(self, text: str, keyword: str, lang: str) -> bool:
        """Check if keyword matches in text with language-appropriate matching."""
        if lang == 'cn' or any(c >= '\u4e00' and c <= '\u9fff' for c in keyword):
            # Chinese - direct substring match
            return keyword in text
        else:
            # English - word boundary match
            pattern = r'\b' + re.escape(keyword) + r'\b'
            return bool(re.search(pattern, text, re.IGNORECASE))
    
    def get_default_config(self) -> Dict:
        """Return default configuration for this framework."""
        return {
            'enabled': True,
            'analysis_interval': 3,
            'confidence_threshold': 0.6,
            'window_size': 10
        }