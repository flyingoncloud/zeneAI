"""
LLM-based psychological state analyzer for module recommendations
"""

from typing import Dict, List, Any
from openai import OpenAI
from src.config.settings import OPENAI_API_KEY
import json
import logging

logger = logging.getLogger(__name__)
client = OpenAI(api_key=OPENAI_API_KEY)

class LLMAnalyzer:
    """
    Analyzes user's psychological state using a large language model.
    """

    def get_system_prompt(self) -> str:
        """
        Returns the system prompt for the LLM state recognition.
        """
        return """You are an expert psychological analyst. Your task is to analyze a user's message in the context of a conversation and identify their psychological state. Based on the user's message, classify their state across the following dimensions:

1.  **emotional_intensity**: How intense are the emotions being expressed?
    - \"high\": User is expressing overwhelming, intense emotions (e.g., \"I'm about to explode,\" \"I can't handle this,\" \"我要崩溃了,\" \"控制不住\").
    - \"medium\": User is expressing clear emotional distress, but it's not at a crisis level (e.g., \"I'm really upset,\" \"I feel so sad,\" \"我很沮丧,\" \"心里不舒服\").
    - \"low\": User is expressing mild emotions or is calm (e.g., \"I'm a bit annoyed,\" \"I'm feeling okay,\" \"有点烦,\" \"还可以\").

2.  **somatic_signals**: Is the user mentioning physical (somatic) sensations related to their emotions?
    - \"present\": User mentions physical symptoms like \"can't breathe,\" \"heart is racing,\" \"feel it in my stomach,\" \"喘不过气,\" \"心跳加快,\" \"胃里翻腾\".
    - \"absent\": User does not mention any physical symptoms.

3.  **expression_clarity**: How clear is the user about what they are feeling?
    - \"clear\": User can name their emotion (e.g., \"I'm angry,\" \"I feel so anxious,\" \"我很焦虑,\" \"我感到愤怒\").
    - \"vague\": User struggles to describe their feelings (e.g., \"I don't know how to describe it,\" \"it's a weird feeling,\" \"说不清,\" \"感觉怪怪的\").

4.  **exploration_willingness**: Is the user showing a desire to understand themselves better?
    - \"present\": User asks questions like \"Why do I always do this?\" or states \"I want to understand myself,\" \"为什么我总是这样,\" \"我想了解自己\".
    - \"absent\": User is focused on venting or describing events, with no stated desire for self-exploration.

5.  **conversation_end_signal**: Does the user's message indicate they might be disengaging or ending the conversation?
    - \"present\": User gives short, non-committal answers (e.g., \"ok,\" \"I don't know,\" \"nothing else,\" \"好吧,\" \"不知道,\" \"没什么了\") OR explicitly says goodbye/farewell (e.g., \"I need to go,\" \"talk later,\" \"goodbye,\" \"我先走了,\" \"我暂时先不聊了,\" \"下次再聊,\" \"再见\") that suggest they are ending the conversation.
    - \"absent\": User is actively participating in the conversation.

6.  **user_explicitly_rejected_modules**: Does the user explicitly state they don't want tools/tests/assessments/modules?
    - \"present\": User explicitly rejects interventions (e.g., \"I don't want any tests,\" \"don't recommend tools,\" \"我不想做什么快测,\" \"不需要测试,\" \"不想做工具,\" \"不要推荐\").
    - \"absent\": No explicit rejection of modules or tools.

7.  **user_wants_conversation_only**: Does the user explicitly state they just want to talk/chat?
    - \"present\": User explicitly wants conversation only (e.g., \"I just want to talk,\" \"just let me vent,\" \"我只想聊一聊,\" \"听我说说就好,\" \"就想跟你聊聊\").
    - \"absent\": No explicit conversation-only preference stated.

8.  **help_seeking_type**: What type of help is the user seeking?
    - \"immediate_practical\": User asks for immediate methods/solutions (e.g., \"What should I do?\", \"Any methods?\", \"怎么办\", \"有什么方法\", \"该怎么做\").
    - \"deep_exploration\": User wants to understand themselves deeply, pattern recognition (e.g., \"Why do I always...\", \"I want to understand myself\", \"为什么我总是\", \"我想了解自己\").
    - \"conversation_only\": User just wants to talk, vent, be heard - no tools or structured intervention.
    - \"none\": User is not explicitly seeking any particular type of help, just sharing or responding.

9.  **emotional_stability**: Is the user emotionally stable or unstable?
    - \"unstable\": User feels out of control, overwhelmed, very negative about themselves (e.g., \"I'm falling apart,\" \"I'm terrible,\" \"我很糟糕,\" \"控制不好,\" \"要崩溃了\").
    - \"stable\": User is in control, calm, reflective, able to think clearly about their situation.

Analyze the **last user message** in the provided conversation history. Respond with a JSON object containing your analysis for all nine dimensions.

Example response format:
{
  \"emotional_intensity\": \"high\",
  \"somatic_signals\": \"present\",
  \"expression_clarity\": \"vague\",
  \"exploration_willingness\": \"absent\",
  \"conversation_end_signal\": \"absent\",
  \"user_explicitly_rejected_modules\": \"absent\",
  \"user_wants_conversation_only\": \"absent\",
  \"help_seeking_type\": \"immediate_practical\",
  \"emotional_stability\": \"unstable\"
}
"""

    def analyze_state_with_llm(
        self,
        current_message: str,
        conversation_history: List[Dict[str, str]],
        turn_count: int = 0
    ) -> Dict[str, Any]:
        """
        Analyzes the user's state by calling an LLM.

        Args:
            current_message: The current user message to analyze
            conversation_history: Previous conversation messages
            turn_count: Number of conversation turns (for context awareness)

        Returns:
            Dictionary with psychological state analysis across 9 dimensions
        """
        system_prompt = self.get_system_prompt()

        # We only need the last few messages for context
        conversation_for_llm = conversation_history[-6:]
        conversation_for_llm.append({"role": "user", "content": current_message})

        # Add contextual hints based on conversation stage
        context_note = ""
        if turn_count <= 2:
            context_note = "\n\nNote: This is early in the conversation (first 1-2 turns). Users may still be building trust and opening up."
        elif turn_count >= 8:
            context_note = "\n\nNote: This conversation has been ongoing for a while. Consider if it might be naturally winding down."

        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo", # Cheaper and faster for this kind of analysis
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Here is the conversation history:\n{json.dumps(conversation_for_llm, ensure_ascii=False)}{context_note}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.0,
            )
            analysis_json = response.choices[0].message.content
            analysis = json.loads(analysis_json)
            return analysis
        except Exception as e:
            logger.error(f"Error analyzing state with LLM: {e}")
            # Fallback to a default state in case of error
            return {
                "emotional_intensity": "low",
                "somatic_signals": "absent",
                "expression_clarity": "clear",
                "exploration_willingness": "absent",
                "conversation_end_signal": "absent",
                "user_explicitly_rejected_modules": "absent",
                "user_wants_conversation_only": "absent",
                "help_seeking_type": "none",
                "emotional_stability": "stable"
            }
