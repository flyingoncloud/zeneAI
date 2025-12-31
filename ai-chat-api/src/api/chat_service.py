from openai import OpenAI
from src.config.settings import OPENAI_API_KEY, AI_RESPONSE_LANGUAGE, AI_FORCE_LANGUAGE
from typing import List, Dict, Optional

client = OpenAI(api_key=OPENAI_API_KEY)


def get_system_prompt_for_language(language: str = "chinese", psychology_context: Optional[str] = None) -> Dict[str, str]:
    """
    Get system prompt based on configured language and psychology context
    
    Args:
        language: Target language for responses
        psychology_context: Optional psychology framework context to inform responses
        
    Returns:
        System prompt dictionary
    """
    base_psychology_instruction = ""
    if psychology_context:
        base_psychology_instruction = f"\n\n心理学背景信息：{psychology_context}\n请在回应中适当考虑这些心理学洞察，但要自然地融入对话中，不要过于技术性或突兀。"
    
    if language.lower() == "chinese":
        return {
            "role": "system",
            "content": f"你是一个具有心理学背景的AI助手。请始终用中文回复用户的所有问题和对话。无论用户使用什么语言提问，你都必须用中文回答。保持回答的准确性和有用性，但确保所有回复都是中文。{base_psychology_instruction}"
        }
    elif language.lower() == "english":
        english_psychology_instruction = ""
        if psychology_context:
            # Translate psychology context to English for English responses
            english_psychology_instruction = f"\n\nPsychological context: {psychology_context}\nPlease consider these psychological insights in your response, but integrate them naturally into the conversation without being overly technical or abrupt."
        
        return {
            "role": "system", 
            "content": f"You are an AI assistant with psychological background. Please always respond in English to all user questions and conversations, regardless of what language the user uses to ask questions.{english_psychology_instruction}"
        }
    else:
        # Default to Chinese
        return {
            "role": "system",
            "content": f"你是一个具有心理学背景的AI助手。请始终用中文回复用户的所有问题和对话。无论用户使用什么语言提问，你都必须用中文回答。保持回答的准确性和有用性，但确保所有回复都是中文。{base_psychology_instruction}"
        }


def get_ai_response(messages: List[Dict[str, str]], model: str = "gpt-3.5-turbo", psychology_analysis: Optional[Dict] = None) -> str:
    """
    Get response from OpenAI API with optional psychology context

    Args:
        messages: List of message dictionaries with 'role' and 'content' keys
        model: OpenAI model to use
        psychology_analysis: Optional psychology analysis to inform response

    Returns:
        AI response content
    """
    try:
        # Generate psychology context if analysis is provided
        psychology_context = None
        if psychology_analysis:
            psychology_context = _generate_psychology_context(psychology_analysis)
        
        # Add system prompt to enforce configured language if enabled
        if AI_FORCE_LANGUAGE:
            system_prompt = get_system_prompt_for_language(AI_RESPONSE_LANGUAGE, psychology_context)
            
            # Insert system prompt at the beginning if not already present
            if not messages or messages[0].get("role") != "system":
                messages = [system_prompt] + messages
            else:
                # Replace existing system prompt with language enforcement and psychology context
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


def _generate_psychology_context(psychology_analysis: Dict) -> str:
    """
    Generate psychology context string from multi-framework analysis
    
    Args:
        psychology_analysis: Multi-framework psychology analysis results
        
    Returns:
        Formatted psychology context string
    """
    if not psychology_analysis or not psychology_analysis.get('frameworks'):
        return ""
    
    context_parts = []
    frameworks = psychology_analysis.get('frameworks', {})
    
    # Process each framework's findings
    for framework_name, analysis in frameworks.items():
        elements = analysis.get('elements_detected', [])
        if not elements:
            continue
            
        confidence = analysis.get('confidence_score', 0.0)
        if confidence < 0.3:  # Skip low-confidence detections
            continue
        
        framework_context = _get_framework_context(framework_name, elements, confidence)
        if framework_context:
            context_parts.append(framework_context)
    
    # Add cross-framework insights if available
    cross_insights = psychology_analysis.get('cross_framework_insights', {})
    if cross_insights.get('multiple_frameworks'):
        frameworks_detected = cross_insights['multiple_frameworks'].get('frameworks', [])
        if len(frameworks_detected) > 1:
            context_parts.append(f"检测到多个心理学框架的模式：{', '.join(frameworks_detected)}，表明复杂的心理呈现")
    
    return "；".join(context_parts) if context_parts else ""


def _get_framework_context(framework_name: str, elements: List[Dict], confidence: float) -> str:
    """
    Generate context string for a specific framework
    
    Args:
        framework_name: Name of the psychology framework
        elements: Detected elements from the framework
        confidence: Confidence score for the framework
        
    Returns:
        Framework-specific context string
    """
    if not elements:
        return ""
    
    # Get top elements by confidence
    top_elements = sorted(elements, key=lambda x: x.get('confidence', 0.0), reverse=True)[:3]
    
    if framework_name == 'ifs':
        return _get_ifs_context(top_elements)
    elif framework_name == 'cbt':
        return _get_cbt_context(top_elements)
    elif framework_name == 'jungian':
        return _get_jungian_context(top_elements)
    elif framework_name == 'narrative':
        return _get_narrative_context(top_elements)
    elif framework_name == 'attachment':
        return _get_attachment_context(top_elements)
    
    return ""


def _get_ifs_context(elements: List[Dict]) -> str:
    """Generate IFS-specific context"""
    parts = [elem for elem in elements if elem.get('type') in ['ifs_part', 'manager', 'firefighter', 'exile']]
    self_presence = [elem for elem in elements if elem.get('type') == 'ifs_self']
    
    context_parts = []
    if parts:
        part_types = [elem.get('subtype', elem.get('type', '')) for elem in parts[:2]]
        context_parts.append(f"IFS部分活跃：{', '.join(part_types)}")
    
    if self_presence:
        context_parts.append("检测到自我能量存在")
    
    return "；".join(context_parts)


def _get_cbt_context(elements: List[Dict]) -> str:
    """Generate CBT-specific context"""
    distortions = [elem for elem in elements if elem.get('type') == 'cognitive_distortion']
    behaviors = [elem for elem in elements if elem.get('type') == 'behavioral_pattern']
    
    context_parts = []
    if distortions:
        distortion_types = [elem.get('subtype', '') for elem in distortions[:2]]
        context_parts.append(f"认知扭曲模式：{', '.join(distortion_types)}")
    
    if behaviors:
        behavior_types = [elem.get('subtype', '') for elem in behaviors[:2]]
        context_parts.append(f"行为模式：{', '.join(behavior_types)}")
    
    return "；".join(context_parts)


def _get_jungian_context(elements: List[Dict]) -> str:
    """Generate Jungian-specific context"""
    archetypes = [elem for elem in elements if elem.get('type') == 'archetype']
    dreams = [elem for elem in elements if elem.get('type') == 'dream_symbol']
    individuation = [elem for elem in elements if elem.get('type') == 'individuation_marker']
    
    context_parts = []
    if archetypes:
        archetype_types = [elem.get('subtype', '') for elem in archetypes[:2]]
        context_parts.append(f"原型内容：{', '.join(archetype_types)}")
    
    if dreams:
        context_parts.append("梦境或象征性内容")
    
    if individuation:
        context_parts.append("个体化过程指标")
    
    return "；".join(context_parts)


def _get_narrative_context(elements: List[Dict]) -> str:
    """Generate Narrative therapy-specific context"""
    externalization = [elem for elem in elements if elem.get('type') == 'externalization']
    reauthoring = [elem for elem in elements if elem.get('type') == 'preferred_identity']
    unique_outcomes = [elem for elem in elements if elem.get('type') == 'unique_outcome']
    
    context_parts = []
    if externalization:
        context_parts.append("问题外化语言")
    
    if reauthoring:
        context_parts.append("重新创作身份")
    
    if unique_outcomes:
        context_parts.append("独特结果或例外")
    
    return "；".join(context_parts)


def _get_attachment_context(elements: List[Dict]) -> str:
    """Generate Attachment theory-specific context"""
    styles = [elem for elem in elements if elem.get('type') == 'attachment_style']
    regulation = [elem for elem in elements if elem.get('type') == 'emotional_regulation']
    relational = [elem for elem in elements if elem.get('type') == 'relational_pattern']
    
    context_parts = []
    if styles:
        style_types = [elem.get('attachment_style', elem.get('subtype', '')) for elem in styles[:2]]
        context_parts.append(f"依恋模式：{', '.join(style_types)}")
    
    if regulation:
        context_parts.append("情绪调节模式")
    
    if relational:
        context_parts.append("关系动态模式")
    
    return "；".join(context_parts)


def build_message_history(db_messages) -> List[Dict[str, str]]:
    """
    Build message history for OpenAI API from database messages

    Args:
        db_messages: List of Message objects from database

    Returns:
        List of message dictionaries
    """
    return [{"role": msg.role, "content": msg.content} for msg in db_messages]
