"""
ZeneWe OpenAI Function-Calling Tool Definitions

Defines the tools passed to the OpenAI API for module recommendation tracking.
"""

from typing import List, Dict


def get_openai_tools() -> List[Dict]:
    """
    Return the list of OpenAI function-calling tool definitions.

    The single tool 'recommend_module' is called by the AI whenever it
    recommends one of the three ZeneWe psychological support modules.
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
        }
    ]
