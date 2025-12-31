from openai import OpenAI
from src.config.settings import OPENAI_API_KEY, AI_RESPONSE_LANGUAGE, AI_FORCE_LANGUAGE
from typing import List, Dict

client = OpenAI(api_key=OPENAI_API_KEY)


def get_system_prompt_for_language(language: str = "chinese") -> Dict[str, str]:
    """
    Get system prompt based on configured language
    
    Args:
        language: Target language for responses
        
    Returns:
        System prompt dictionary
    """
    if language.lower() == "chinese":
        return {
            "role": "system",
            "content": "你是一个AI助手。请始终用中文回复用户的所有问题和对话。无论用户使用什么语言提问，你都必须用中文回答。保持回答的准确性和有用性，但确保所有回复都是中文。"
        }
    elif language.lower() == "english":
        return {
            "role": "system", 
            "content": "You are an AI assistant. Please always respond in English to all user questions and conversations, regardless of what language the user uses to ask questions."
        }
    else:
        # Default to Chinese
        return {
            "role": "system",
            "content": "你是一个AI助手。请始终用中文回复用户的所有问题和对话。无论用户使用什么语言提问，你都必须用中文回答。保持回答的准确性和有用性，但确保所有回复都是中文。"
        }


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
        # Add system prompt to enforce configured language if enabled
        if AI_FORCE_LANGUAGE:
            system_prompt = get_system_prompt_for_language(AI_RESPONSE_LANGUAGE)
            
            # Insert system prompt at the beginning if not already present
            if not messages or messages[0].get("role") != "system":
                messages = [system_prompt] + messages
            else:
                # Replace existing system prompt with language enforcement
                messages[0] = system_prompt
        
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
        # Get system prompt based on configured language
        system_prompt = get_system_prompt_for_language(AI_RESPONSE_LANGUAGE)
        
        # Add language instruction to the prompt if force language is enabled
        if AI_FORCE_LANGUAGE and AI_RESPONSE_LANGUAGE.lower() == "chinese":
            chinese_instruction = "请用中文回答。"
            full_prompt = f"{chinese_instruction} {prompt}"
        else:
            full_prompt = prompt
        
        response = client.chat.completions.create(
            model=model,
            messages=[
                system_prompt,
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": full_prompt},
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
