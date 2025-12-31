"""Framework Manager - Manages registration and configuration of psychology frameworks."""

import logging
from typing import Dict, List, Optional, Type
from src.psychology.base_detector import BaseFrameworkDetector

logger = logging.getLogger(__name__)


class FrameworkManager:
    """
    Manages psychology framework registration, configuration, and lifecycle.
    
    Provides centralized management of all available psychology frameworks
    and their configurations.
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.frameworks: Dict[str, BaseFrameworkDetector] = {}
        self.config = config or self._get_default_config()
        
    def register_framework(self, framework: BaseFrameworkDetector) -> None:
        """
        Register a psychology framework detector.
        
        Args:
            framework: Instance of BaseFrameworkDetector
        """
        framework_name = framework.get_framework_name()
        
        if framework_name in self.frameworks:
            logger.warning(f"Framework {framework_name} already registered, overwriting")
        
        self.frameworks[framework_name] = framework
        
        # Add default config if not present
        if framework_name not in self.config:
            self.config[framework_name] = framework.get_default_config()
        
        logger.info(f"Registered framework: {framework_name}")
    
    def get_enabled_frameworks(self) -> List[str]:
        """
        Get list of enabled framework names.
        
        Returns:
            List of enabled framework names
        """
        enabled = []
        for name, config in self.config.items():
            if config.get('enabled', False) and name in self.frameworks:
                enabled.append(name)
        return enabled
    
    def get_framework(self, framework_name: str) -> Optional[BaseFrameworkDetector]:
        """
        Get framework detector by name.
        
        Args:
            framework_name: Name of the framework
            
        Returns:
            Framework detector instance or None if not found
        """
        return self.frameworks.get(framework_name)
    
    def is_framework_enabled(self, framework_name: str) -> bool:
        """
        Check if a framework is enabled.
        
        Args:
            framework_name: Name of the framework
            
        Returns:
            True if framework is enabled and registered
        """
        return (
            framework_name in self.frameworks and
            self.config.get(framework_name, {}).get('enabled', False)
        )
    
    def get_framework_config(self, framework_name: str) -> Dict:
        """
        Get configuration for a specific framework.
        
        Args:
            framework_name: Name of the framework
            
        Returns:
            Framework configuration dict
        """
        return self.config.get(framework_name, {})
    
    def update_framework_config(self, framework_name: str, config: Dict) -> None:
        """
        Update configuration for a specific framework.
        
        Args:
            framework_name: Name of the framework
            config: New configuration dict
        """
        if framework_name not in self.config:
            self.config[framework_name] = {}
        
        self.config[framework_name].update(config)
        logger.info(f"Updated config for framework: {framework_name}")
    
    def enable_framework(self, framework_name: str) -> bool:
        """
        Enable a framework.
        
        Args:
            framework_name: Name of the framework
            
        Returns:
            True if successfully enabled
        """
        if framework_name not in self.frameworks:
            logger.error(f"Cannot enable unregistered framework: {framework_name}")
            return False
        
        if framework_name not in self.config:
            self.config[framework_name] = self.frameworks[framework_name].get_default_config()
        
        self.config[framework_name]['enabled'] = True
        logger.info(f"Enabled framework: {framework_name}")
        return True
    
    def disable_framework(self, framework_name: str) -> bool:
        """
        Disable a framework.
        
        Args:
            framework_name: Name of the framework
            
        Returns:
            True if successfully disabled
        """
        if framework_name in self.config:
            self.config[framework_name]['enabled'] = False
            logger.info(f"Disabled framework: {framework_name}")
            return True
        
        logger.warning(f"Framework not found in config: {framework_name}")
        return False
    
    def get_all_frameworks(self) -> Dict[str, BaseFrameworkDetector]:
        """
        Get all registered frameworks.
        
        Returns:
            Dict mapping framework names to detector instances
        """
        return self.frameworks.copy()
    
    def should_analyze(self, framework_name: str, message_count: int) -> bool:
        """
        Determine if a framework should analyze based on its configuration.
        
        Args:
            framework_name: Name of the framework
            message_count: Current message count
            
        Returns:
            True if framework should analyze
        """
        if not self.is_framework_enabled(framework_name):
            return False
        
        config = self.get_framework_config(framework_name)
        interval = config.get('analysis_interval', 3)
        
        # Analyze if message count is a multiple of interval OR if it's been long enough
        # This ensures we don't miss analysis opportunities due to strict interval matching
        return message_count > 0 and (
            message_count % interval == 0 or  # Regular interval
            message_count >= interval  # At least minimum messages for analysis
        )
    
    def _get_default_config(self) -> Dict:
        """Get default configuration for all frameworks."""
        return {
            'ifs': {
                'enabled': True,
                'analysis_interval': 3,
                'confidence_threshold': 0.6,
                'window_size': 10
            },
            'cbt': {
                'enabled': True,
                'analysis_interval': 2,
                'confidence_threshold': 0.7,
                'window_size': 8
            },
            'jungian': {
                'enabled': True,
                'analysis_interval': 4,
                'confidence_threshold': 0.6,
                'window_size': 12
            },
            'narrative': {
                'enabled': True,
                'analysis_interval': 3,
                'confidence_threshold': 0.6,
                'window_size': 10
            },
            'attachment': {
                'enabled': True,
                'analysis_interval': 3,
                'confidence_threshold': 0.6,
                'window_size': 10
            }
        }