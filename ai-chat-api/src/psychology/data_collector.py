"""Data Collector - Comprehensive data collection and aggregation for multi-framework psychology analysis."""

import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from collections import defaultdict

logger = logging.getLogger(__name__)


class DataCollector:
    """
    Comprehensive data collection and aggregation across psychology frameworks.
    
    Handles:
    - Framework-specific data storage
    - Conversation-level data aggregation
    - Cross-framework insight generation
    - Historical data preservation
    - Research data export
    """
    
    def __init__(self):
        # In-memory storage for current session (could be extended to database)
        self.conversation_data: Dict[int, Dict] = {}
        self.framework_metrics: Dict[str, Dict] = defaultdict(lambda: {
            'total_analyses': 0,
            'total_detections': 0,
            'average_confidence': 0.0,
            'detection_frequency': 0.0
        })
    
    def collect_framework_data(
        self, 
        framework: str, 
        analysis: Dict, 
        conversation_id: int,
        message_id: int
    ) -> None:
        """
        Collect data from a framework analysis.
        
        Args:
            framework: Name of the framework
            analysis: Analysis results from the framework
            conversation_id: ID of the conversation
            message_id: ID of the current message
        """
        try:
            # Initialize conversation data if not exists
            if conversation_id not in self.conversation_data:
                self.conversation_data[conversation_id] = {
                    'conversation_id': conversation_id,
                    'frameworks': {},
                    'cross_framework_insights': {},
                    'analysis_history': [],
                    'created_at': datetime.utcnow().isoformat(),
                    'last_updated': datetime.utcnow().isoformat()
                }
            
            # Store framework-specific data
            self.conversation_data[conversation_id]['frameworks'][framework] = {
                'latest_analysis': analysis,
                'message_id': message_id,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Add to analysis history
            self.conversation_data[conversation_id]['analysis_history'].append({
                'framework': framework,
                'message_id': message_id,
                'analysis': analysis,
                'timestamp': datetime.utcnow().isoformat()
            })
            
            # Update conversation metadata
            self.conversation_data[conversation_id]['last_updated'] = datetime.utcnow().isoformat()
            
            # Update framework metrics
            self._update_framework_metrics(framework, analysis)
            
            logger.debug(f"Collected data for framework {framework} in conversation {conversation_id}")
            
        except Exception as e:
            logger.error(f"Failed to collect framework data: {e}")
    
    def aggregate_conversation_data(self, conversation_id: int) -> Dict:
        """
        Aggregate data for a specific conversation across all frameworks.
        
        Args:
            conversation_id: ID of the conversation
            
        Returns:
            Aggregated conversation data
        """
        if conversation_id not in self.conversation_data:
            return {}
        
        conversation = self.conversation_data[conversation_id]
        
        # Generate aggregated metrics
        aggregated = {
            'conversation_id': conversation_id,
            'frameworks_analyzed': list(conversation['frameworks'].keys()),
            'total_frameworks': len(conversation['frameworks']),
            'frameworks_with_detections': [],
            'total_elements_detected': 0,
            'average_confidence': 0.0,
            'complexity_score': 0.0,
            'primary_themes': [],
            'cross_framework_insights': self._generate_cross_framework_insights(conversation),
            'analysis_summary': {},
            'created_at': conversation['created_at'],
            'last_updated': conversation['last_updated']
        }
        
        # Calculate aggregated metrics
        total_confidence = 0.0
        confidence_count = 0
        
        for framework, data in conversation['frameworks'].items():
            analysis = data['latest_analysis']
            elements = analysis.get('elements_detected', [])
            confidence = analysis.get('confidence_score', 0.0)
            
            if elements:
                aggregated['frameworks_with_detections'].append(framework)
                aggregated['total_elements_detected'] += len(elements)
            
            if confidence > 0:
                total_confidence += confidence
                confidence_count += 1
        
        # Calculate averages
        if confidence_count > 0:
            aggregated['average_confidence'] = total_confidence / confidence_count
        
        # Calculate complexity score (more frameworks with detections = higher complexity)
        if aggregated['total_frameworks'] > 0:
            aggregated['complexity_score'] = len(aggregated['frameworks_with_detections']) / aggregated['total_frameworks']
        
        # Extract primary themes
        aggregated['primary_themes'] = self._extract_primary_themes(conversation)
        
        # Create analysis summary
        aggregated['analysis_summary'] = self._create_analysis_summary(conversation)
        
        return aggregated
    
    def export_research_data(self, filters: Optional[Dict] = None) -> Dict:
        """
        Export data in structured format for research analysis.
        
        Args:
            filters: Optional filters for data export
            
        Returns:
            Structured research data
        """
        try:
            export_data = {
                'export_timestamp': datetime.utcnow().isoformat(),
                'total_conversations': len(self.conversation_data),
                'framework_metrics': dict(self.framework_metrics),
                'conversations': [],
                'aggregated_insights': self._generate_aggregated_insights()
            }
            
            # Apply filters if provided
            conversations_to_export = self.conversation_data.values()
            if filters:
                conversations_to_export = self._apply_filters(conversations_to_export, filters)
            
            # Export conversation data
            for conversation in conversations_to_export:
                export_data['conversations'].append(self.aggregate_conversation_data(conversation['conversation_id']))
            
            return export_data
            
        except Exception as e:
            logger.error(f"Failed to export research data: {e}")
            return {}
    
    def get_framework_metrics(self, framework: str) -> Dict:
        """Get metrics for a specific framework."""
        return self.framework_metrics.get(framework, {})
    
    def get_conversation_data(self, conversation_id: int) -> Optional[Dict]:
        """Get data for a specific conversation."""
        return self.conversation_data.get(conversation_id)
    
    def _update_framework_metrics(self, framework: str, analysis: Dict) -> None:
        """Update metrics for a framework."""
        metrics = self.framework_metrics[framework]
        
        metrics['total_analyses'] += 1
        
        elements = analysis.get('elements_detected', [])
        if elements:
            metrics['total_detections'] += len(elements)
        
        confidence = analysis.get('confidence_score', 0.0)
        if confidence > 0:
            # Update running average
            current_avg = metrics['average_confidence']
            total_analyses = metrics['total_analyses']
            metrics['average_confidence'] = ((current_avg * (total_analyses - 1)) + confidence) / total_analyses
        
        # Calculate detection frequency
        if metrics['total_analyses'] > 0:
            metrics['detection_frequency'] = (
                metrics['total_detections'] / metrics['total_analyses']
            )
    
    def _generate_cross_framework_insights(self, conversation: Dict) -> Dict:
        """Generate insights from multiple framework detections."""
        insights = {}
        frameworks = conversation['frameworks']
        
        # Find frameworks with detections
        frameworks_with_detections = []
        for framework, data in frameworks.items():
            if data['latest_analysis'].get('elements_detected', []):
                frameworks_with_detections.append(framework)
        
        if len(frameworks_with_detections) > 1:
            insights['multiple_frameworks'] = {
                'frameworks': frameworks_with_detections,
                'count': len(frameworks_with_detections),
                'description': f"Multiple therapeutic frameworks detected: {', '.join(frameworks_with_detections)}",
                'therapeutic_relevance': 'Complex psychological presentation requiring multi-modal approach'
            }
            
            # Analyze framework combinations
            insights['framework_combinations'] = self._analyze_framework_combinations(frameworks_with_detections)
        
        # Look for overlapping themes
        insights['overlapping_themes'] = self._find_overlapping_themes(frameworks)
        
        return insights
    
    def _extract_primary_themes(self, conversation: Dict) -> List[str]:
        """Extract primary therapeutic themes from conversation."""
        themes = []
        
        for framework, data in conversation['frameworks'].items():
            elements = data['latest_analysis'].get('elements_detected', [])
            for element in elements:
                theme = element.get('subtype', element.get('type', ''))
                if theme and theme not in themes:
                    themes.append(theme)
        
        # Return top themes (limit to avoid clutter)
        return themes[:10]
    
    def _create_analysis_summary(self, conversation: Dict) -> Dict:
        """Create summary of conversation analysis."""
        frameworks = conversation['frameworks']
        
        summary = {
            'total_frameworks_analyzed': len(frameworks),
            'frameworks_with_detections': [],
            'highest_confidence_framework': None,
            'total_elements': 0,
            'dominant_themes': []
        }
        
        highest_confidence = 0.0
        theme_counts = defaultdict(int)
        
        for framework, data in frameworks.items():
            analysis = data['latest_analysis']
            elements = analysis.get('elements_detected', [])
            confidence = analysis.get('confidence_score', 0.0)
            
            if elements:
                summary['frameworks_with_detections'].append(framework)
                summary['total_elements'] += len(elements)
                
                # Count themes
                for element in elements:
                    theme = element.get('subtype', element.get('type', ''))
                    if theme:
                        theme_counts[theme] += 1
            
            if confidence > highest_confidence:
                highest_confidence = confidence
                summary['highest_confidence_framework'] = framework
        
        # Get dominant themes (top 5)
        summary['dominant_themes'] = [
            theme for theme, count in sorted(theme_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        ]
        
        return summary
    
    def _analyze_framework_combinations(self, frameworks: List[str]) -> Dict:
        """Analyze specific combinations of frameworks."""
        combinations = {}
        
        # Common therapeutic combinations
        if 'ifs' in frameworks and 'attachment' in frameworks:
            combinations['ifs_attachment'] = {
                'description': 'IFS and Attachment Theory combination suggests focus on parts work within relational context',
                'therapeutic_approach': 'Integrate parts work with attachment-informed interventions'
            }
        
        if 'cbt' in frameworks and 'attachment' in frameworks:
            combinations['cbt_attachment'] = {
                'description': 'CBT and Attachment Theory combination suggests cognitive work within relational framework',
                'therapeutic_approach': 'Address cognitive distortions while considering attachment patterns'
            }
        
        if 'narrative' in frameworks and 'ifs' in frameworks:
            combinations['narrative_ifs'] = {
                'description': 'Narrative and IFS combination suggests story work with parts integration',
                'therapeutic_approach': 'Re-author stories while honoring different parts'
            }
        
        return combinations
    
    def _find_overlapping_themes(self, frameworks: Dict) -> List[str]:
        """Find themes that appear across multiple frameworks."""
        theme_frameworks = defaultdict(list)
        
        for framework, data in frameworks.items():
            elements = data['latest_analysis'].get('elements_detected', [])
            for element in elements:
                theme = element.get('subtype', element.get('type', ''))
                if theme:
                    theme_frameworks[theme].append(framework)
        
        # Return themes that appear in multiple frameworks
        overlapping = []
        for theme, framework_list in theme_frameworks.items():
            if len(framework_list) > 1:
                overlapping.append(theme)
        
        return overlapping
    
    def _generate_aggregated_insights(self) -> Dict:
        """Generate insights across all conversations."""
        insights = {
            'most_common_frameworks': {},
            'framework_co_occurrence': {},
            'average_complexity': 0.0,
            'common_themes': {}
        }
        
        if not self.conversation_data:
            return insights
        
        # Analyze framework usage
        framework_counts = defaultdict(int)
        complexity_scores = []
        theme_counts = defaultdict(int)
        
        for conversation in self.conversation_data.values():
            aggregated = self.aggregate_conversation_data(conversation['conversation_id'])
            
            # Count frameworks
            for framework in aggregated.get('frameworks_analyzed', []):
                framework_counts[framework] += 1
            
            # Collect complexity scores
            complexity_scores.append(aggregated.get('complexity_score', 0.0))
            
            # Count themes
            for theme in aggregated.get('primary_themes', []):
                theme_counts[theme] += 1
        
        # Most common frameworks
        insights['most_common_frameworks'] = dict(
            sorted(framework_counts.items(), key=lambda x: x[1], reverse=True)
        )
        
        # Average complexity
        if complexity_scores:
            insights['average_complexity'] = sum(complexity_scores) / len(complexity_scores)
        
        # Common themes
        insights['common_themes'] = dict(
            sorted(theme_counts.items(), key=lambda x: x[1], reverse=True)[:20]
        )
        
        return insights
    
    def _apply_filters(self, conversations: List[Dict], filters: Dict) -> List[Dict]:
        """Apply filters to conversation data."""
        filtered = []
        
        for conversation in conversations:
            include = True
            
            # Framework filter
            if 'frameworks' in filters:
                required_frameworks = filters['frameworks']
                conversation_frameworks = list(conversation['frameworks'].keys())
                if not any(fw in conversation_frameworks for fw in required_frameworks):
                    include = False
            
            # Date range filter
            if 'date_from' in filters or 'date_to' in filters:
                conversation_date = datetime.fromisoformat(conversation['created_at'].replace('Z', '+00:00'))
                
                if 'date_from' in filters:
                    date_from = datetime.fromisoformat(filters['date_from'])
                    if conversation_date < date_from:
                        include = False
                
                if 'date_to' in filters:
                    date_to = datetime.fromisoformat(filters['date_to'])
                    if conversation_date > date_to:
                        include = False
            
            if include:
                filtered.append(conversation)
        
        return filtered