"""
Trigger detection for module recommendations based on LLM analysis.
"""

from typing import Dict, List

class TriggerDetector:
    """Detects module recommendation triggers based on LLM-analyzed psychological state."""

    def detect_triggers(self, psychological_state: Dict, turn_count: int = 0) -> Dict[str, Dict]:
        """
        Detect which modules to recommend based on the psychological state.

        Args:
            psychological_state: Output from LLMAnalyzer with 9 dimensions.
            turn_count: Number of conversation turns (for early conversation blocking)

        Returns:
            Dictionary of module_id -> trigger details.
        """
        triggers = {}
        state = psychological_state

        # ============= BLOCKING RULES (Check First) =============

        # BLOCK 1: User explicitly rejected modules
        if state.get("user_explicitly_rejected_modules") == "present":
            return {}  # Return empty - no recommendations

        # BLOCK 2: User wants conversation only
        if state.get("user_wants_conversation_only") == "present":
            return {}  # Return empty - no recommendations

        # BLOCK 3: User is saying goodbye (conversation_end_signal present)
        # Exception: Allow quick_assessment ONLY if it's a natural closure after long conversation
        if state.get("conversation_end_signal") == "present":
            # Natural closure scenario: 8+ turns, stable, low intensity
            # In this case, quick_assessment can be offered as a summary tool
            if (turn_count >= 8 and
                state.get("emotional_stability") == "stable" and
                state.get("emotional_intensity") in ["low", "medium"]):
                # Allow quick_assessment only
                triggers = {}
                triggers["quick_assessment"] = {
                    "triggered": True,
                    "reasons": ["conversation_natural_closure"],
                    "priority": 4
                }
                return triggers
            else:
                # All other goodbye scenarios: block everything
                return {}

        # BLOCK 4: Too early in conversation (first 1-2 turns)
        # Don't rush to recommend tools before building rapport
        if turn_count <= 2:
            # Exception: Only allow breathing exercise if very high intensity
            if state.get("emotional_intensity") == "high" and state.get("somatic_signals") == "present":
                triggers["breathing_exercise"] = {
                    "triggered": True,
                    "reasons": ["emergency_high_intensity_with_somatic"],
                    "priority": 1
                }
            return triggers  # Return only breathing if triggered, otherwise empty

        # ============= POSITIVE TRIGGERS =============

        # Breathing Exercise: High intensity OR somatic signals
        if state.get("emotional_intensity") == "high" or state.get("somatic_signals") == "present":
            triggers["breathing_exercise"] = {
                "triggered": True,
                "reasons": ["high_intensity_or_somatic"],
                "priority": 1
            }

        # Emotion Labeling: Multiple trigger conditions
        emotion_labeling_triggered = False
        emotion_labeling_reasons = []

        # Trigger 1: Vague expression (but NOT if they just want conversation)
        if (state.get("expression_clarity") == "vague" and
            state.get("help_seeking_type") != "conversation_only"):
            emotion_labeling_triggered = True
            emotion_labeling_reasons.append("vague_expression")

        # Trigger 2: User asks for immediate practical help with emotions
        if (state.get("help_seeking_type") == "immediate_practical" and
            state.get("emotional_intensity") in ["medium", "high"]):
            emotion_labeling_triggered = True
            emotion_labeling_reasons.append("immediate_help_request")

        if emotion_labeling_triggered:
            triggers["emotion_labeling"] = {
                "triggered": True,
                "reasons": emotion_labeling_reasons,
                "priority": 2
            }

        # Inner Doodling: Vague expression (alternative to labeling)
        if (state.get("expression_clarity") == "vague" and
            state.get("help_seeking_type") != "conversation_only"):
            triggers["inner_doodling"] = {
                "triggered": True,
                "reasons": ["vague_expression_for_creative"],
                "priority": 3
            }

        # Quick Assessment: ONLY trigger if ALL conditions met (very strict)
        # - Deep exploration desire (not immediate help, not conversation only)
        # - Emotionally stable (not in distress)
        # - Low or medium intensity (not crisis)
        # - Clear expression (can articulate well)
        # Note: Natural closure scenario (conversation_end_signal + 8+ turns) is handled in blocking section
        quick_assessment_triggered = False
        quick_assessment_reasons = []

        # Stable exploration desire
        if (state.get("help_seeking_type") == "deep_exploration" and
            state.get("emotional_stability") == "stable" and
            state.get("emotional_intensity") in ["low", "medium"] and
            state.get("expression_clarity") == "clear"):
            quick_assessment_triggered = True
            quick_assessment_reasons.append("stable_exploration_desire")

        if quick_assessment_triggered:
            triggers["quick_assessment"] = {
                "triggered": True,
                "reasons": quick_assessment_reasons,
                "priority": 4
            }

        return triggers

    def get_top_recommendations(
        self,
        triggers: Dict[str, Dict],
        max_recommendations: int = 1, # Default to 1 recommendation for now
        psychological_state: Dict = None
    ) -> List[Dict]:
        """
        Get top module recommendations sorted by priority.
        """
        if not triggers:
            return []

        recommendations = [
            {"module_id": mod_id, **data}
            for mod_id, data in triggers.items()
            if data["triggered"]
        ]

        # Simple conflict resolution: if both labeling and doodling are triggered,
        # choose one randomly to provide variety.
        has_labeling = any(r["module_id"] == "emotion_labeling" for r in recommendations)
        has_doodling = any(r["module_id"] == "inner_doodling" for r in recommendations)

        if has_labeling and has_doodling:
            import random
            if random.choice([True, False]):
                recommendations = [r for r in recommendations if r["module_id"] != "inner_doodling"]
            else:
                recommendations = [r for r in recommendations if r["module_id"] != "emotion_labeling"]


        # Sort by priority
        recommendations.sort(key=lambda x: x["priority"])

        return recommendations[:max_recommendations]
