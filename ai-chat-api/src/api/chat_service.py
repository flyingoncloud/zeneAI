from openai import OpenAI
from src.config.settings import OPENAI_API_KEY
from typing import List, Dict

client = OpenAI(api_key=OPENAI_API_KEY)


def get_ai_response(messages: List[Dict[str, str]], model: str = "gpt-3.5-turbo") -> str:
    """
    Get response from OpenAI API

    Args:
        messages: List of message dictionaries with 'role' and 'content' keys
        model: OpenAI model to use

    Returns:
        AI response content
    """
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages
        )
        return response.choices[0].message.content
    except Exception as e:
        raise Exception(f"Error getting AI response: {str(e)}")


def build_message_history(db_messages) -> List[Dict[str, str]]:
    """
    Build message history for OpenAI API from database messages

    Args:
        db_messages: List of Message objects from database

    Returns:
        List of message dictionaries
    """
    return [{"role": msg.role, "content": msg.content} for msg in db_messages]
