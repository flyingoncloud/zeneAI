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


def get_ai_response_with_image(prompt: str, image_data: str, model: str = "gpt-4o") -> str:
    """
    Get response from OpenAI Vision API with image

    Args:
        prompt: Text prompt for analysis
        image_data: Base64 encoded image data
        model: OpenAI model to use (must support vision)

    Returns:
        AI response content
    """
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}}
                    ]
                }
            ],
            max_tokens=300
        )
        return response.choices[0].message.content
    except Exception as e:
        raise Exception(f"Error getting AI response with image: {str(e)}")


def build_message_history(db_messages) -> List[Dict[str, str]]:
    """
    Build message history for OpenAI API from database messages

    Args:
        db_messages: List of Message objects from database

    Returns:
        List of message dictionaries
    """
    return [{"role": msg.role, "content": msg.content} for msg in db_messages]
