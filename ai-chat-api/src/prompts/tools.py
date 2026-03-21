"""
ZeneWe OpenAI Function-Calling Tool Definitions

Defines the tools passed to the OpenAI API for module recommendation tracking
and inline psychological assessment question handling.
"""

from typing import List, Dict


def get_openai_tools() -> List[Dict]:
    """
    Return the list of OpenAI function-calling tool definitions.

    Tools:
    - recommend_module: Track module recommendations
    - request_assessment_question: Request inline psychological assessment questions
    - record_inline_answer: Record user answers to inline assessment questions
    """
    return [
        {
            "type": "function",
            "function": {
                "name": "recommend_module",
                "description": (
                    "REQUIRED: Call this function whenever you recommend, suggest, or mention "
                    "any of the 3 psychological support modules (emotional first aid, inner doodling, "
                    "quick assessment) in your response — even if you phrase it subtly or indirectly. "
                    "This is the ONLY way the system tracks module recommendations. Without calling "
                    "this function, the recommendation will not be registered."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "module_id": {
                            "type": "string",
                            "enum": [
                                "emotional_first_aid",
                                "inner_doodling",
                                "quick_assessment",
                            ],
                            "description": "The ID of the module being recommended.",
                        },
                        "reasoning": {
                            "type": "string",
                            "description": (
                                "Brief reasoning for why this module is being recommended "
                                "(for internal tracking)."
                            ),
                        },
                    },
                    "required": ["module_id", "reasoning"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "request_assessment_question",
                "description": (
                    "Call this function when the conversation touches on a psychological domain "
                    "and you want to naturally embed an assessment question. Use this to gradually "
                    "collect assessment data without making the user feel like they're taking a test."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "domain": {
                            "type": "string",
                            "enum": ["2.1", "2.2", "2.3", "2.4", "2.5"],
                            "description": "Major psychological domain",
                        },
                        "subcategory": {
                            "type": "string",
                            "description": (
                                "Optional subcategory code (e.g., '2.1.1', '2.2.1.1')"
                            ),
                        },
                        "reasoning": {
                            "type": "string",
                            "description": (
                                "Why this domain is relevant to current conversation"
                            ),
                        },
                    },
                    "required": ["domain", "reasoning"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "record_inline_answer",
                "description": (
                    "Call this function when the user provides an answer (1-5) to an inline "
                    "assessment question that was previously embedded in the conversation. "
                    "This records the answer for progress tracking and report generation."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "question_id": {
                            "type": "integer",
                            "description": "The ID of the assessment question being answered.",
                        },
                        "answer_value": {
                            "type": "integer",
                            "description": (
                                "The user's answer on a 1-5 scale."
                            ),
                        },
                        "reasoning": {
                            "type": "string",
                            "description": (
                                "Optional context about how the answer was interpreted "
                                "from the conversation."
                            ),
                        },
                    },
                    "required": ["question_id", "answer_value"],
                },
            },
        },
    ]
