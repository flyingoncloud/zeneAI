"""LLM-based IFS analysis (Stage 2).

Speed-optimized with focused prompts and efficient parsing.
"""

import json
import logging
from typing import List, Dict, Optional
from openai import OpenAI
from src.config.settings import OPENAI_API_KEY, IFS_LLM_MODEL
from src.ifs.prompts import build_analysis_prompt, build_focused_prompt
from src.ifs.models import Part, SelfPresence

logger = logging.getLogger(__name__)

client = OpenAI(api_key=OPENAI_API_KEY)


class LLMAnalyzer:
    """LLM-based IFS analysis with speed optimization."""

    def __init__(self, model: str = None):
        self.model = model or IFS_LLM_MODEL

    def analyze(self, messages: List[Dict], detected_patterns: Dict) -> Dict:
        """
        Perform LLM analysis of conversation for IFS elements.

        Only called when pattern_matcher found indicators.
        Uses focused prompts based on detected patterns for speed.

        Args:
            messages: Recent conversation messages
            detected_patterns: Results from pattern matcher

        Returns:
            Dict with self_presence and parts_detected
        """
        try:
            # Build optimized prompt based on what was detected
            prompt = build_analysis_prompt(messages, detected_patterns)

            # Call OpenAI with compact settings for speed
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an IFS therapy expert. Return concise JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,  # Lower for consistency and speed
                max_tokens=800,   # Limit for faster response
                response_format={"type": "json_object"}  # Ensure JSON output
            )

            # Parse response
            result_text = response.choices[0].message.content
            result = json.loads(result_text)

            # Convert to our models
            return self._parse_llm_result(result, messages)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {e}")
            return self._empty_result()
        except Exception as e:
            logger.error(f"LLM analysis error: {e}")
            return self._empty_result()

    def analyze_focused(self, messages: List[Dict], part_types: List[str]) -> Dict:
        """
        Ultra-focused analysis for specific part types only.
        Even faster for simple cases.

        Args:
            messages: Recent conversation messages
            part_types: Specific part types to analyze

        Returns:
            Dict with parts_detected only
        """
        try:
            prompt = build_focused_prompt(messages, part_types)

            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "IFS expert. Return JSON with parts only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500,  # Even shorter
                response_format={"type": "json_object"}
            )

            result_text = response.choices[0].message.content
            result = json.loads(result_text)

            return {
                'self_presence': SelfPresence().dict(),
                'parts_detected': self._parse_parts(result.get('parts', []))
            }

        except Exception as e:
            logger.error(f"Focused LLM analysis error: {e}")
            return self._empty_result()

    def _parse_llm_result(self, result: Dict, messages: List[Dict]) -> Dict:
        """Parse LLM JSON response into our format."""
        # Parse Self presence
        self_data = result.get('self_presence', {})
        self_presence = SelfPresence(
            detected=self_data.get('detected', False),
            score=float(self_data.get('score', 0.0)),
            indicators=self_data.get('indicators', []),
            evidence=self_data.get('evidence')
        )

        # Parse Parts
        parts_detected = self._parse_parts(result.get('parts', []))

        return {
            'self_presence': self_presence.dict(),
            'parts_detected': parts_detected
        }

    def _parse_parts(self, parts_list: List[Dict]) -> List[Dict]:
        """Parse parts from LLM response."""
        parsed_parts = []

        for i, part_data in enumerate(parts_list):
            try:
                part = Part(
                    id=f"part_{i+1}",
                    type=part_data.get('type', 'manager'),
                    subtype=part_data.get('subtype'),
                    name=part_data.get('name'),
                    intensity=float(part_data.get('intensity', 0.5)),
                    emotions=part_data.get('emotions', []),
                    triggers=part_data.get('triggers', []),
                    needs=part_data.get('needs', []),
                    evidence=part_data.get('evidence'),
                    confidence=float(part_data.get('confidence', 0.5))
                )
                parsed_parts.append(part.dict())
            except Exception as e:
                logger.warning(f"Failed to parse part {i}: {e}")
                continue

        return parsed_parts

    def _empty_result(self) -> Dict:
        """Return empty result on error."""
        return {
            'self_presence': SelfPresence().dict(),
            'parts_detected': []
        }
