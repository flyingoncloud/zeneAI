"""OpenJung API integration for MBTI personality assessment."""
from typing import Dict, List, Optional
import httpx
import logging

logger = logging.getLogger(__name__)

BASE_URL = 'https://openjung.org/api'


class MBTIQuestion:
    def __init__(self, id: int, dimension: str, leftTrait: str, rightTrait: str, **kwargs):
        self.id = id
        self.dimension = dimension
        self.left_trait = leftTrait
        self.right_trait = rightTrait


class MBTIResult:
    def __init__(self, data: dict):
        self.type = data['type']
        self.scores = data['scores']
        self.percentages = data['percentages']
        self.type_info = data['typeInfo']
        self.share_url = data['shareUrl']


def fetch_mbti_questions_sync(locale: str = 'zh') -> List[MBTIQuestion]:
    """Fetch all 32 test questions (sync)."""
    try:
        with httpx.Client(timeout=10) as client:
            response = client.get(f'{BASE_URL}/questions', params={'locale': locale})
            response.raise_for_status()
            data = response.json()
            return [MBTIQuestion(**q) for q in data['questions']]
    except Exception as e:
        logger.error(f"Failed to fetch MBTI questions: {e}")
        return []


def calculate_mbti_result_sync(answers: Dict[str, int], locale: str = 'zh') -> Optional[MBTIResult]:
    """Calculate personality type from answers (sync)."""
    try:
        with httpx.Client(timeout=10) as client:
            response = client.post(
                f'{BASE_URL}/calculate',
                json={'answers': answers, 'locale': locale, 'save': False}
            )
            response.raise_for_status()
            data = response.json()
            return MBTIResult(data['result'])
    except Exception as e:
        logger.error(f"Failed to calculate MBTI result: {e}")
        return None


async def fetch_mbti_questions(locale: str = 'zh') -> List[MBTIQuestion]:
    """Fetch all 32 test questions."""
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(f'{BASE_URL}/questions', params={'locale': locale})
        response.raise_for_status()
        data = response.json()
        return [MBTIQuestion(**q) for q in data['questions']]


async def fetch_mbti_question(question_id: int, locale: str = 'zh') -> Optional[MBTIQuestion]:
    """Fetch a single question by ID."""
    questions = await fetch_mbti_questions(locale)
    return next((q for q in questions if q.id == question_id), None)


async def calculate_mbti_result(answers: Dict[str, int], locale: str = 'zh') -> Optional[MBTIResult]:
    """Calculate personality type from answers."""
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            f'{BASE_URL}/calculate',
            json={'answers': answers, 'locale': locale, 'save': False}
        )
        response.raise_for_status()
        data = response.json()
        return MBTIResult(data['result'])


def extract_mbti_answers(progress_answers: dict, questions: list) -> Optional[Dict[str, int]]:
    """
    Extract MBTI answers from progress, keyed by original MBTI question ID.
    Returns dict like {"1": 3, "2": 4, ...} ready for OpenJung /api/calculate.
    """
    mbti_answers = {}
    for q in questions:
        if not hasattr(q, 'template_settings') and not isinstance(q, dict):
            continue
        settings = q.template_settings if hasattr(q, 'template_settings') else q.get('template_settings', {})
        if not settings or 'mbtiQuestionId' not in (settings or {}):
            continue
        mbti_qid = str(settings['mbtiQuestionId'])
        q_num = str(q.question_number if hasattr(q, 'question_number') else q.get('question_number'))
        if q_num in progress_answers:
            mbti_answers[mbti_qid] = progress_answers[q_num]

    if len(mbti_answers) == 32:
        return mbti_answers
    return None
