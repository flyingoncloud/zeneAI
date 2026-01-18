"""
ZENE Psychology Report Generator

Generates comprehensive psychology analysis reports in PDF format
when conversations contain sufficient psychological information.
"""

import os
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import black, blue, darkblue, grey
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

logger = logging.getLogger(__name__)


class ZENEReportGenerator:
    """
    Generates professional psychology analysis reports in PDF format.
    
    Creates comprehensive reports including:
    - Executive summary
    - Framework analysis
    - Therapeutic recommendations
    - Conversation insights
    """
    
    def __init__(self, output_dir: str = "reports"):
        self.output_dir = output_dir
        self.ensure_output_directory()
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def ensure_output_directory(self):
        """Ensure the output directory exists"""
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
    
    def _setup_custom_styles(self):
        """Set up custom styles for the PDF document"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='ZENETitle',
            parent=self.styles['Title'],
            fontSize=18,
            spaceAfter=12,
            alignment=TA_CENTER,
            textColor=darkblue
        ))
        
        # Heading style
        self.styles.add(ParagraphStyle(
            name='ZENEHeading',
            parent=self.styles['Heading1'],
            fontSize=14,
            spaceBefore=12,
            spaceAfter=6,
            textColor=darkblue
        ))
        
        # Subheading style
        self.styles.add(ParagraphStyle(
            name='ZENESubheading',
            parent=self.styles['Heading2'],
            fontSize=12,
            spaceBefore=8,
            spaceAfter=4,
            textColor=blue
        ))
        
        # Body style
        self.styles.add(ParagraphStyle(
            name='ZENEBody',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=6,
            alignment=TA_JUSTIFY
        ))
        
        # Bullet style
        self.styles.add(ParagraphStyle(
            name='ZENEBullet',
            parent=self.styles['Normal'],
            fontSize=11,
            leftIndent=20,
            spaceAfter=3
        ))
    
    def should_generate_report(self, conversation_data: Dict) -> Tuple[bool, str]:
        """
        Determine if a conversation has enough information to generate a report.
        
        Args:
            conversation_data: Complete conversation data with psychology analysis
            
        Returns:
            Tuple of (should_generate, reason)
        """
        messages = conversation_data.get('messages', [])
        psychology_analyses = []
        
        # Collect all psychology analyses from messages
        for message in messages:
            if message.get('psychology_analysis', {}).get('analyzed', False):
                psychology_analyses.append(message['psychology_analysis'])
        
        if not psychology_analyses:
            return False, "No psychology analysis found in conversation"
        
        # Check for minimum conversation length
        if len(messages) < 6:
            return False, f"Conversation too short ({len(messages)} messages, minimum 6 required)"
        
        # Check for framework diversity
        all_frameworks = set()
        total_confidence = 0
        analysis_count = 0
        
        for analysis in psychology_analyses:
            frameworks = analysis.get('frameworks', {})
            for framework_name, framework_data in frameworks.items():
                confidence = framework_data.get('confidence_score', 0.0)
                elements = framework_data.get('elements_detected', [])
                
                if confidence >= 0.5 or len(elements) >= 2:
                    all_frameworks.add(framework_name)
                    total_confidence += confidence
                    analysis_count += 1
        
        # Require at least 2 frameworks detected
        if len(all_frameworks) < 2:
            return False, f"Insufficient framework diversity ({len(all_frameworks)} frameworks, minimum 2 required)"
        
        # Require minimum average confidence
        avg_confidence = total_confidence / max(analysis_count, 1)
        if avg_confidence < 0.6:
            return False, f"Low confidence scores (average {avg_confidence:.2f}, minimum 0.6 required)"
        
        return True, f"Report criteria met: {len(all_frameworks)} frameworks, {avg_confidence:.2f} avg confidence"
    
    def generate_report(self, conversation_data: Dict, user_info: Optional[Dict] = None) -> str:
        """
        Generate a comprehensive psychology report.
        
        Args:
            conversation_data: Complete conversation data
            user_info: Optional user information
            
        Returns:
            Path to generated report file
        """
        # Generate filename
        timestamp = datetime.now().strftime("%d%b%Y")
        filename = f"ZENE_Report_Pro_Edited_{timestamp}.pdf"
        filepath = os.path.join(self.output_dir, filename)
        
        # Create PDF document
        doc = SimpleDocTemplate(
            filepath,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        
        # Build story (content)
        story = []
        
        # Generate report content
        self._add_header(story, conversation_data, user_info)
        self._add_executive_summary(story, conversation_data)
        self._add_conversation_overview(story, conversation_data)
        self._add_framework_analysis(story, conversation_data)
        self._add_therapeutic_insights(story, conversation_data)
        self._add_recommendations(story, conversation_data)
        self._add_appendix(story, conversation_data)
        
        # Build PDF
        doc.build(story)
        logger.info(f"Generated psychology report: {filepath}")
        
        return filepath
    
    def _add_header(self, story: List, conversation_data: Dict, user_info: Optional[Dict]):
        """Add report header with title and metadata"""
        # Title
        story.append(Paragraph("ZENE Psychology Analysis Report", self.styles['ZENETitle']))
        story.append(Spacer(1, 12))
        
        # Subtitle
        story.append(Paragraph("Multi-Framework Therapeutic Assessment", self.styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Metadata table
        metadata = [
            ["Report Date", datetime.now().strftime("%B %d, %Y")],
            ["Analysis System", "ZENE Multi-Framework Psychology Detection"],
            ["Conversation ID", str(conversation_data.get('id', 'N/A'))],
            ["Total Messages", str(len(conversation_data.get('messages', [])))],
            ["Analysis Version", "v2.0 - Multi-Framework Integration"]
        ]
        
        table = Table(metadata, colWidths=[2*inch, 3*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), grey),
            ('TEXTCOLOR', (0, 0), (-1, -1), black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (1, 0), (1, -1), 'white'),
            ('GRID', (0, 0), (-1, -1), 1, black)
        ]))
        
        story.append(table)
        story.append(PageBreak())
    
    def _add_executive_summary(self, story: List, conversation_data: Dict):
        """Add executive summary section"""
        story.append(Paragraph("Executive Summary", self.styles['ZENEHeading']))
        story.append(Spacer(1, 12))
        
        # Analyze conversation for summary
        messages = conversation_data.get('messages', [])
        psychology_analyses = [msg.get('psychology_analysis') for msg in messages 
                             if msg.get('psychology_analysis', {}).get('analyzed', False)]
        
        if not psychology_analyses:
            story.append(Paragraph("No psychology analysis data available.", self.styles['ZENEBody']))
            story.append(Spacer(1, 12))
            return
        
        # Framework summary
        all_frameworks = {}
        for analysis in psychology_analyses:
            frameworks = analysis.get('frameworks', {})
            for name, data in frameworks.items():
                if name not in all_frameworks:
                    all_frameworks[name] = {
                        'detections': 0,
                        'total_confidence': 0,
                        'elements': []
                    }
                
                confidence = data.get('confidence_score', 0.0)
                elements = data.get('elements_detected', [])
                
                if confidence > 0.3 or elements:
                    all_frameworks[name]['detections'] += 1
                    all_frameworks[name]['total_confidence'] += confidence
                    all_frameworks[name]['elements'].extend(elements)
        
        # Generate summary text
        summary_parts = []
        
        if all_frameworks:
            detected_frameworks = [name for name, data in all_frameworks.items() 
                                 if data['detections'] > 0]
            summary_parts.append(f"This conversation analysis detected patterns from {len(detected_frameworks)} psychological frameworks: {', '.join(detected_frameworks).upper()}.")
        
        # Primary framework
        if all_frameworks:
            primary_framework = max(all_frameworks.items(), 
                                  key=lambda x: x[1]['total_confidence'] / max(x[1]['detections'], 1))
            avg_confidence = primary_framework[1]['total_confidence'] / max(primary_framework[1]['detections'], 1)
            summary_parts.append(f"The primary therapeutic framework identified was {primary_framework[0].upper()} with an average confidence of {avg_confidence:.2f}.")
        
        # Conversation characteristics
        user_messages = [msg for msg in messages if msg.get('role') == 'user']
        if user_messages:
            summary_parts.append(f"The conversation consisted of {len(user_messages)} user messages spanning multiple therapeutic domains.")
        
        summary_parts.append("This report provides detailed analysis of detected psychological patterns, therapeutic insights, and recommendations for continued support.")
        
        summary_text = " ".join(summary_parts)
        story.append(Paragraph(summary_text, self.styles['ZENEBody']))
        story.append(Spacer(1, 20))
    
    def _add_conversation_overview(self, story: List, conversation_data: Dict):
        """Add conversation overview section"""
        story.append(Paragraph("Conversation Overview", self.styles['ZENEHeading']))
        story.append(Spacer(1, 12))
        
        messages = conversation_data.get('messages', [])
        user_messages = [msg for msg in messages if msg.get('role') == 'user']
        ai_messages = [msg for msg in messages if msg.get('role') == 'assistant']
        
        # Basic statistics
        stats_text = f"""
        <b>Conversation Statistics:</b><br/>
        • Total Messages: {len(messages)}<br/>
        • User Messages: {len(user_messages)}<br/>
        • AI Responses: {len(ai_messages)}<br/>
        """
        
        if messages:
            start_time = messages[0].get('timestamp', 'Unknown')
            end_time = messages[-1].get('timestamp', 'Unknown')
            stats_text += f"• Conversation Period: {start_time} to {end_time}<br/>"
        
        story.append(Paragraph(stats_text, self.styles['ZENEBody']))
        story.append(Spacer(1, 12))
        
        # Key themes (first few user messages)
        if user_messages:
            themes_text = "<b>Key Themes Discussed:</b><br/>"
            
            for i, msg in enumerate(user_messages[:3], 1):
                content = msg.get('content', '')[:100]
                if len(msg.get('content', '')) > 100:
                    content += "..."
                themes_text += f"{i}. {content}<br/>"
            
            story.append(Paragraph(themes_text, self.styles['ZENEBody']))
        
        story.append(Spacer(1, 20))
    
    def _add_framework_analysis(self, story: List, conversation_data: Dict):
        """Add detailed framework analysis section"""
        story.append(Paragraph("Psychological Framework Analysis", self.styles['ZENEHeading']))
        story.append(Spacer(1, 12))
        
        messages = conversation_data.get('messages', [])
        psychology_analyses = [msg.get('psychology_analysis') for msg in messages 
                             if msg.get('psychology_analysis', {}).get('analyzed', False)]
        
        if not psychology_analyses:
            story.append(Paragraph("No framework analysis data available.", self.styles['ZENEBody']))
            story.append(Spacer(1, 20))
            return
        
        # Aggregate framework data
        framework_summary = {}
        for analysis in psychology_analyses:
            frameworks = analysis.get('frameworks', {})
            for name, data in frameworks.items():
                if name not in framework_summary:
                    framework_summary[name] = {
                        'total_confidence': 0,
                        'detection_count': 0,
                        'all_elements': [],
                        'highest_confidence': 0
                    }
                
                confidence = data.get('confidence_score', 0.0)
                elements = data.get('elements_detected', [])
                
                if confidence > 0.3 or elements:
                    framework_summary[name]['total_confidence'] += confidence
                    framework_summary[name]['detection_count'] += 1
                    framework_summary[name]['all_elements'].extend(elements)
                    framework_summary[name]['highest_confidence'] = max(
                        framework_summary[name]['highest_confidence'], confidence
                    )
        
        # Sort frameworks by average confidence
        sorted_frameworks = sorted(
            framework_summary.items(),
            key=lambda x: x[1]['total_confidence'] / max(x[1]['detection_count'], 1),
            reverse=True
        )
        
        for framework_name, data in sorted_frameworks:
            if data['detection_count'] == 0:
                continue
                
            avg_confidence = data['total_confidence'] / data['detection_count']
            
            # Framework heading
            story.append(Paragraph(f"{framework_name.upper()} Framework Analysis", self.styles['ZENESubheading']))
            story.append(Spacer(1, 8))
            
            # Framework details
            details_text = f"""
            Detection Frequency: {data['detection_count']} instances<br/>
            Average Confidence: {avg_confidence:.2f}<br/>
            Peak Confidence: {data['highest_confidence']:.2f}<br/>
            """
            story.append(Paragraph(details_text, self.styles['ZENEBody']))
            
            # Elements detected
            if data['all_elements']:
                story.append(Paragraph("<b>Key Elements Detected:</b>", self.styles['ZENEBody']))
                
                # Group elements by type
                element_types = {}
                for element in data['all_elements']:
                    elem_type = element.get('type', 'unknown')
                    if elem_type not in element_types:
                        element_types[elem_type] = []
                    element_types[elem_type].append(element)
                
                for elem_type, elements in element_types.items():
                    subtypes = [elem.get('subtype', elem_type) for elem in elements[:3]]
                    story.append(Paragraph(f"• {elem_type}: {', '.join(set(subtypes))}", self.styles['ZENEBullet']))
            
            # Framework interpretation
            interpretation = self._get_framework_interpretation(framework_name, data)
            if interpretation:
                story.append(Paragraph(f"<b>Clinical Interpretation:</b> {interpretation}", self.styles['ZENEBody']))
            
            story.append(Spacer(1, 12))
    
    def _add_therapeutic_insights(self, story: List, conversation_data: Dict):
        """Add therapeutic insights section"""
        story.append(Paragraph("Therapeutic Insights", self.styles['ZENEHeading']))
        story.append(Spacer(1, 12))
        
        messages = conversation_data.get('messages', [])
        psychology_analyses = [msg.get('psychology_analysis') for msg in messages 
                             if msg.get('psychology_analysis', {}).get('analyzed', False)]
        
        insights = []
        
        # Cross-framework insights
        for analysis in psychology_analyses:
            cross_insights = analysis.get('cross_framework_insights', {})
            if cross_insights.get('multiple_frameworks_detected'):
                frameworks = cross_insights['multiple_frameworks_detected'].get('frameworks', [])
                if len(frameworks) > 1:
                    insights.append(f"Multi-modal presentation detected across {', '.join(frameworks)} frameworks, indicating complex psychological dynamics requiring integrated therapeutic approach.")
        
        # Framework-specific insights
        framework_insights = {
            'ifs': "Internal Family Systems patterns suggest active internal parts requiring Self-leadership and parts integration work.",
            'cbt': "Cognitive-behavioral patterns indicate opportunities for cognitive restructuring and behavioral interventions.",
            'jungian': "Jungian elements suggest rich symbolic content and individuation processes worthy of exploration.",
            'narrative': "Narrative therapy patterns indicate potential for externalization and story re-authoring approaches.",
            'attachment': "Attachment patterns suggest relational dynamics that may benefit from attachment-informed interventions."
        }
        
        # Add framework-specific insights based on detections
        detected_frameworks = set()
        for analysis in psychology_analyses:
            frameworks = analysis.get('frameworks', {})
            for name, data in frameworks.items():
                if data.get('confidence_score', 0) > 0.5 or data.get('elements_detected', []):
                    detected_frameworks.add(name)
        
        for framework in detected_frameworks:
            if framework in framework_insights:
                insights.append(framework_insights[framework])
        
        # Add insights to document
        if insights:
            for i, insight in enumerate(insights, 1):
                story.append(Paragraph(f"{i}. {insight}", self.styles['ZENEBody']))
        else:
            story.append(Paragraph("No specific therapeutic insights generated from this conversation.", self.styles['ZENEBody']))
        
        story.append(Spacer(1, 20))
    
    def _add_recommendations(self, story: List, conversation_data: Dict):
        """Add therapeutic recommendations section"""
        story.append(Paragraph("Therapeutic Recommendations", self.styles['ZENEHeading']))
        story.append(Spacer(1, 12))
        
        messages = conversation_data.get('messages', [])
        psychology_analyses = [msg.get('psychology_analysis') for msg in messages 
                             if msg.get('psychology_analysis', {}).get('analyzed', False)]
        
        # Analyze detected frameworks for recommendations
        detected_frameworks = {}
        for analysis in psychology_analyses:
            frameworks = analysis.get('frameworks', {})
            for name, data in frameworks.items():
                confidence = data.get('confidence_score', 0)
                elements = data.get('elements_detected', [])
                if confidence > 0.5 or len(elements) >= 2:
                    if name not in detected_frameworks:
                        detected_frameworks[name] = 0
                    detected_frameworks[name] += confidence
        
        # Generate recommendations based on strongest frameworks
        recommendations = []
        
        if 'ifs' in detected_frameworks:
            recommendations.append("Consider Internal Family Systems (IFS) therapy to explore and integrate internal parts, fostering Self-leadership and internal harmony.")
        
        if 'cbt' in detected_frameworks:
            recommendations.append("Cognitive Behavioral Therapy (CBT) interventions may help address identified cognitive distortions and develop more balanced thinking patterns.")
        
        if 'attachment' in detected_frameworks:
            recommendations.append("Attachment-focused therapy could address relational patterns and support the development of secure attachment strategies.")
        
        if 'narrative' in detected_frameworks:
            recommendations.append("Narrative therapy approaches may help externalize problems and support the re-authoring of preferred life stories.")
        
        if 'jungian' in detected_frameworks:
            recommendations.append("Jungian analytical approaches could explore symbolic content, archetypal patterns, and support individuation processes.")
        
        # General recommendations
        if len(detected_frameworks) > 1:
            recommendations.append("Given the multi-framework presentation, an integrative therapeutic approach drawing from multiple modalities may be most beneficial.")
        
        recommendations.append("Regular assessment and monitoring of therapeutic progress using validated psychological measures.")
        recommendations.append("Consider collaborative treatment planning to ensure interventions align with client goals and preferences.")
        
        # Add recommendations to document
        for i, rec in enumerate(recommendations, 1):
            story.append(Paragraph(f"{i}. {rec}", self.styles['ZENEBody']))
        
        story.append(Spacer(1, 20))
    
    def _add_appendix(self, story: List, conversation_data: Dict):
        """Add appendix with technical details"""
        story.append(Paragraph("Technical Appendix", self.styles['ZENEHeading']))
        story.append(Spacer(1, 12))
        
        # Analysis methodology
        method_text = """
        <b>Analysis Methodology:</b><br/>
        This report was generated using ZENE's Multi-Framework Psychology Detection System, which employs a two-stage hybrid approach:<br/>
        1. Pattern Matching: Initial screening using linguistic and semantic patterns<br/>
        2. LLM Analysis: Deep analysis using large language models for psychological element detection<br/>
        3. Confidence Scoring: Statistical confidence measures for each detected element<br/>
        4. Cross-Framework Integration: Analysis of interactions between multiple therapeutic frameworks<br/>
        """
        story.append(Paragraph(method_text, self.styles['ZENEBody']))
        story.append(Spacer(1, 12))
        
        # Framework details
        frameworks_text = """
        <b>Supported Frameworks:</b><br/>
        • IFS (Internal Family Systems): Parts work and Self-leadership<br/>
        • CBT (Cognitive Behavioral Therapy): Cognitive distortions and behavioral patterns<br/>
        • Jungian Psychology: Archetypes, dreams, and individuation<br/>
        • Narrative Therapy: Externalization and story re-authoring<br/>
        • Attachment Theory: Relational patterns and emotional regulation<br/>
        """
        story.append(Paragraph(frameworks_text, self.styles['ZENEBody']))
        story.append(Spacer(1, 12))
        
        # Disclaimer
        disclaimer_text = """
        <b>Disclaimer:</b> This report is generated by an AI system for informational purposes only. 
        It should not replace professional psychological assessment or clinical judgment. 
        All therapeutic decisions should be made in consultation with qualified mental health professionals.
        """
        story.append(Paragraph(disclaimer_text, self.styles['ZENEBody']))
    
    def _get_framework_interpretation(self, framework_name: str, data: Dict) -> str:
        """Get clinical interpretation for a framework"""
        interpretations = {
            'ifs': "The presence of IFS patterns suggests active internal parts that may benefit from Self-leadership development and parts integration work.",
            'cbt': "CBT patterns indicate cognitive and behavioral elements that may respond well to structured cognitive restructuring interventions.",
            'jungian': "Jungian elements suggest rich unconscious material and archetypal content that could support individuation and personal growth.",
            'narrative': "Narrative patterns indicate opportunities for problem externalization and the development of preferred identity stories.",
            'attachment': "Attachment patterns suggest relational dynamics rooted in early attachment experiences that may benefit from attachment-focused interventions."
        }
        
        return interpretations.get(framework_name, "")


def generate_conversation_report(conversation_data: Dict, user_info: Optional[Dict] = None, output_dir: str = "reports") -> Optional[str]:
    """
    Convenience function to generate a report for a conversation.
    
    Args:
        conversation_data: Complete conversation data
        user_info: Optional user information
        output_dir: Output directory for reports
        
    Returns:
        Path to generated report file, or None if criteria not met
    """
    generator = ZENEReportGenerator(output_dir)
    
    should_generate, reason = generator.should_generate_report(conversation_data)
    
    if not should_generate:
        logger.info(f"Report not generated: {reason}")
        return None
    
    logger.info(f"Generating report: {reason}")
    return generator.generate_report(conversation_data, user_info)