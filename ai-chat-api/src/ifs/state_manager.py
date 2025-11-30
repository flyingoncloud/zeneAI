"""Manage cumulative IFS state across conversation.

Efficiently merges new analysis with existing state.
"""

from typing import Dict, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class StateManager:
    """Manage and merge IFS state efficiently."""

    def merge_analysis(
        self,
        existing_state: Optional[Dict],
        new_analysis: Dict,
        current_message_id: int
    ) -> Dict:
        """
        Merge new IFS analysis with existing cumulative state.

        Args:
            existing_state: Previous IFS state from conversation metadata
            new_analysis: New analysis results
            current_message_id: ID of current message

        Returns:
            Updated IFS state
        """
        if not existing_state:
            # First analysis
            return {
                **new_analysis,
                'last_analyzed_message_id': current_message_id,
                'analysis_count': 1,
                'timestamp': datetime.utcnow().isoformat()
            }

        # Merge Self presence
        merged_self = self._merge_self_presence(
            existing_state.get('self_presence', {}),
            new_analysis.get('self_presence', {})
        )

        # Merge Parts
        merged_parts = self._merge_parts(
            existing_state.get('parts_detected', []),
            new_analysis.get('parts_detected', []),
            current_message_id
        )

        return {
            'analyzed': True,
            'llm_used': new_analysis.get('llm_used', False),
            'analysis_type': new_analysis.get('analysis_type', 'hybrid'),
            'self_presence': merged_self,
            'parts_detected': merged_parts,
            'last_analyzed_message_id': current_message_id,
            'analysis_count': existing_state.get('analysis_count', 0) + 1,
            'timestamp': datetime.utcnow().isoformat()
        }

    def _merge_self_presence(self, existing: Dict, new: Dict) -> Dict:
        """Merge Self presence - use weighted average."""
        if not existing.get('detected'):
            return new

        if not new.get('detected'):
            return existing

        # Take weighted average (favor recent)
        merged_score = (existing.get('score', 0.5) * 0.4 + new.get('score', 0.5) * 0.6)

        # Combine indicators (unique)
        merged_indicators = list(set(
            existing.get('indicators', []) + new.get('indicators', [])
        ))

        return {
            'detected': True,
            'score': round(merged_score, 2),
            'indicators': merged_indicators,
            'evidence': new.get('evidence', existing.get('evidence'))  # Keep latest
        }

    def _merge_parts(
        self,
        existing_parts: List[Dict],
        new_parts: List[Dict],
        current_message_id: int
    ) -> List[Dict]:
        """
        Merge parts lists intelligently.

        Strategy:
        - Match parts by type and subtype
        - Update intensity for existing parts
        - Add new parts
        - Keep parts active if seen recently
        """
        # Create lookup for existing parts
        parts_map = {}
        for part in existing_parts:
            key = f"{part.get('type')}_{part.get('subtype')}"
            parts_map[key] = part

        # Process new parts
        for new_part in new_parts:
            key = f"{new_part.get('type')}_{new_part.get('subtype')}"

            if key in parts_map:
                # Update existing part
                existing = parts_map[key]
                # Weighted average of intensity (favor recent)
                merged_intensity = (
                    existing.get('intensity', 0.5) * 0.4 +
                    new_part.get('intensity', 0.5) * 0.6
                )

                parts_map[key] = {
                    **existing,
                    'intensity': round(merged_intensity, 2),
                    'emotions': list(set(existing.get('emotions', []) + new_part.get('emotions', []))),
                    'triggers': list(set(existing.get('triggers', []) + new_part.get('triggers', []))),
                    'evidence': new_part.get('evidence', existing.get('evidence')),
                    'confidence': new_part.get('confidence', existing.get('confidence')),
                }
            else:
                # New part
                new_part['first_detected_message'] = current_message_id
                parts_map[key] = new_part

        # Return merged list (limit to top 10 by intensity for efficiency)
        merged_list = list(parts_map.values())
        merged_list.sort(key=lambda x: x.get('intensity', 0), reverse=True)
        return merged_list[:10]  # Keep top 10 most intense parts

    def get_summary(self, state: Dict) -> str:
        """
        Get human-readable summary of IFS state.
        (Optional utility method)
        """
        if not state:
            return "No IFS analysis yet"

        parts_count = len(state.get('parts_detected', []))
        self_score = state.get('self_presence', {}).get('score', 0)

        summary = f"IFS Analysis: {parts_count} parts detected, Self presence: {self_score:.0%}"

        return summary
