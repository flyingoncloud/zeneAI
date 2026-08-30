"""
MBTI Calculator

Calculates MBTI personality type from F9 template answers.
Each F9 question maps to one of 4 dimensions (EI, SN, TF, JP)
using a 1-5 spectrum scale.

Scale interpretation:
  1 = strongly left trait
  3 = neutral
  5 = strongly right trait

Dimension mapping (from templateSettings.dimension):
  EI: 1=E (Extraversion), 5=I (Introversion)
  SN: 1=S (Sensing), 5=N (Intuition)
  TF: 1=T (Thinking), 5=F (Feeling)
  JP: 1=J (Judging), 5=P (Perceiving)
"""

import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

# Dimension labels
DIMENSIONS = {
    'EI': {'left': 'E', 'right': 'I', 'left_zh': '外向', 'right_zh': '内向'},
    'SN': {'left': 'S', 'right': 'N', 'left_zh': '感觉', 'right_zh': '直觉'},
    'TF': {'left': 'T', 'right': 'F', 'left_zh': '思考', 'right_zh': '情感'},
    'JP': {'left': 'J', 'right': 'P', 'left_zh': '判断', 'right_zh': '感知'},
}

# Placeholder used when a dimension's preference cannot be determined, either
# because no F9 question was answered for it or because the answers are exactly
# balanced. A type containing this letter (e.g. 'INFX', 'XXXX') is not a real
# MBTI type and must not be presented as one.
INDETERMINATE_LETTER = 'X'


def calculate_mbti(
    answers: Dict[str, int],
    questions: List[Any],
) -> Dict[str, Any]:
    """
    Calculate MBTI type from F9 template answers.

    Args:
        answers: Dict of question_number (str) -> answer_value (int, 1-5)
        questions: List of question objects with template, question_number,
                   and template_settings fields

    Returns:
        {
            'type': str,           # e.g. 'INFP'
            'type_zh': str,        # e.g. '内向-直觉-情感-感知'
            'dimensions': {
                'EI': {'score': float, 'percentage': int, 'letter': str, 'label_zh': str},
                'SN': {...},
                'TF': {...},
                'JP': {...},
            },
            'raw_scores': {dim: [values]},
            'confidence': float,   # 0-1, based on how far from neutral
            'is_determinate': bool,  # False if any dimension letter is 'X'
        }

    A dimension with no answered F9 questions, or with answers averaging exactly
    neutral, yields the letter 'X' and sets 'is_determinate' to False. Callers
    must check 'is_determinate' before presenting the type as a real MBTI type.
    """
    # Collect F9 answers grouped by dimension
    dim_scores: Dict[str, List[int]] = {'EI': [], 'SN': [], 'TF': [], 'JP': []}

    for q in questions:
        template = getattr(q, 'template', None) or (q.get('template') if isinstance(q, dict) else None)
        if template != 'F9':
            continue

        q_num = str(getattr(q, 'question_number', None) or (q.get('question_number') if isinstance(q, dict) else None))
        if q_num not in answers:
            continue

        # Get dimension from templateSettings
        ts = getattr(q, 'template_settings', None) or (q.get('templateSettings') if isinstance(q, dict) else None) or {}
        dimension = ts.get('dimension', '')

        if dimension in dim_scores:
            dim_scores[dimension].append(answers[q_num])
        else:
            logger.warning(f"F9 question {q_num} has unknown dimension: {dimension}")

    logger.info(f"MBTI raw scores by dimension: {dim_scores}")

    # Calculate per-dimension results
    dimensions = {}
    type_letters = []
    total_confidence = 0.0
    is_determinate = True

    for dim_code, meta in DIMENSIONS.items():
        scores = dim_scores.get(dim_code, [])

        if not scores:
            # No answered F9 question maps to this dimension. Falling back to a
            # neutral score would invent a preference out of missing data, so
            # report the dimension as unmeasured instead.
            logger.warning(f"MBTI dimension {dim_code} has no answers — marking indeterminate")
            dimensions[dim_code] = _dimension_result(meta, avg=None, letter=INDETERMINATE_LETTER,
                                                    label_zh='未测定', answered_count=0)
            type_letters.append(INDETERMINATE_LETTER)
            is_determinate = False
            continue

        avg = sum(scores) / len(scores)

        # Convert 1-5 scale to percentage (0-100)
        # 1 → 0% (strongly left), 3 → 50% (neutral), 5 → 100% (strongly right)
        pct = round((avg - 1) / 4 * 100)

        if pct < 50:
            letter, label_zh = meta['left'], meta['left_zh']
        elif pct > 50:
            letter, label_zh = meta['right'], meta['right_zh']
        else:
            # Exactly balanced. Assigning either side would report a preference
            # the answers do not show, which is easy to hit when a dimension has
            # only one or two questions.
            letter, label_zh = INDETERMINATE_LETTER, '均衡'
            is_determinate = False

        dimensions[dim_code] = _dimension_result(meta, avg=avg, letter=letter,
                                                 label_zh=label_zh, answered_count=len(scores))
        type_letters.append(letter)

        # Confidence: how far from 50% (neutral)
        total_confidence += abs(pct - 50) / 50  # 0 = neutral, 1 = extreme

    mbti_type = ''.join(type_letters)
    type_zh = '-'.join(dimensions[d]['label_zh'] for d in ['EI', 'SN', 'TF', 'JP'])
    avg_confidence = total_confidence / len(DIMENSIONS)

    result = {
        'type': mbti_type,
        'type_zh': type_zh,
        'is_determinate': is_determinate,
        'dimensions': dimensions,
        'raw_scores': {k: v for k, v in dim_scores.items()},
        'confidence': round(avg_confidence, 2),
    }

    logger.info(
        f"MBTI result: {mbti_type} ({type_zh}), "
        f"confidence={avg_confidence:.2f}, determinate={is_determinate}"
    )
    return result


def _dimension_result(
    meta: Dict[str, str],
    avg: float | None,
    letter: str,
    label_zh: str,
    answered_count: int,
) -> Dict[str, Any]:
    """Build the per-dimension payload. `avg` is None when the dimension is unmeasured."""
    return {
        'score': round(avg, 2) if avg is not None else None,
        'percentage': round((avg - 1) / 4 * 100) if avg is not None else None,
        'letter': letter,
        'label_zh': label_zh,
        'left': meta['left'],
        'right': meta['right'],
        'left_zh': meta['left_zh'],
        'right_zh': meta['right_zh'],
        'answered_count': answered_count,
    }
