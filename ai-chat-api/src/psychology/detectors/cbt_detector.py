"""CBT (Cognitive Behavioral Therapy) Detector - Identifies CBT elements in conversations."""

import json
import logging
from typing import List, Dict
from openai import OpenAI

from src.psychology.base_detector import BaseFrameworkDetector
from src.config.settings import OPENAI_API_KEY, CBT_LLM_MODEL

logger = logging.getLogger(__name__)
client = OpenAI(api_key=OPENAI_API_KEY)


class CBTDetector(BaseFrameworkDetector):
    """
    CBT (Cognitive Behavioral Therapy) framework detector.
    
    Detects:
    - Cognitive distortions (catastrophizing, black-and-white thinking, mind reading, etc.)
    - Behavioral patterns (avoidance, behavioral activation, coping strategies)
    - Thought records (thoughts-feelings-behaviors connections)
    - CBT interventions and homework assignments
    """
    
    def get_framework_name(self) -> str:
        return 'cbt'
    
    def get_patterns(self) -> Dict[str, Dict[str, List[str]]]:
        """Return CBT pattern definitions in English and Chinese."""
        return {
            # Cognitive Distortions
            'catastrophizing': {
                'en': [
                    'worst case', 'disaster', 'terrible', 'awful', 'horrible',
                    'catastrophe', 'end of the world', 'ruined', 'doomed',
                    'everything will go wrong', 'complete failure'
                ],
                'cn': [
                    '最坏的情况', '灾难', '糟糕', '可怕', '恐怖',
                    '大灾难', '世界末日', '毁了', '完蛋了',
                    '一切都会出错', '彻底失败'
                ]
            },
            'all_or_nothing': {
                'en': [
                    'always', 'never', 'everything', 'nothing', 'completely',
                    'totally', 'perfect', 'failure', 'all the time', 'every time',
                    'black and white', 'either or'
                ],
                'cn': [
                    '总是', '从不', '一切', '什么都没有', '完全',
                    '彻底', '完美', '失败', '所有时间', '每次',
                    '非黑即白', '要么要么'
                ]
            },
            'mind_reading': {
                'en': [
                    'they think', 'he thinks', 'she thinks', 'they must think',
                    'they probably think', 'I know what they think',
                    'they are judging me', 'they hate me'
                ],
                'cn': [
                    '他们认为', '他认为', '她认为', '他们一定认为',
                    '他们可能认为', '我知道他们在想什么',
                    '他们在评判我', '他们讨厌我'
                ]
            },
            'fortune_telling': {
                'en': [
                    'will definitely', 'going to happen', 'I know it will',
                    'bound to fail', 'will never work', 'destined to',
                    'inevitable', 'certain to fail'
                ],
                'cn': [
                    '肯定会', '将要发生', '我知道会',
                    '注定失败', '永远不会成功', '注定要',
                    '不可避免', '肯定会失败'
                ]
            },
            'personalization': {
                'en': [
                    'my fault', 'I caused', 'because of me', 'I am responsible',
                    'I should have', 'if only I', 'I blame myself'
                ],
                'cn': [
                    '我的错', '我造成的', '因为我', '我负责',
                    '我应该', '如果我', '我责怪自己'
                ]
            },
            'emotional_reasoning': {
                'en': [
                    'I feel like', 'I feel that', 'since I feel',
                    'my feelings tell me', 'I feel so it must be'
                ],
                'cn': [
                    '我感觉像', '我感觉那', '既然我感觉',
                    '我的感觉告诉我', '我感觉所以一定是'
                ]
            },
            'should_statements': {
                'en': [
                    'should', 'must', 'ought to', 'have to', 'supposed to',
                    'need to', 'should not', 'must not'
                ],
                'cn': [
                    '应该', '必须', '应当', '不得不', '应该要',
                    '需要', '不应该', '不能'
                ]
            },
            'labeling': {
                'en': [
                    'I am stupid', 'I am worthless', 'I am a failure',
                    'I am useless', 'I am weak', 'I am bad'
                ],
                'cn': [
                    '我很愚蠢', '我没有价值', '我是个失败者',
                    '我没用', '我很弱', '我很坏'
                ]
            },
            
            # Behavioral Patterns
            'avoidance': {
                'en': [
                    'avoid', 'stay away', 'escape', 'run away', 'hide',
                    'procrastinate', 'put off', 'delay', 'cancel', 'skip'
                ],
                'cn': [
                    '避免', '远离', '逃避', '逃跑', '隐藏',
                    '拖延', '推迟', '延迟', '取消', '跳过'
                ]
            },
            'behavioral_activation': {
                'en': [
                    'schedule', 'plan activities', 'do something', 'take action',
                    'get moving', 'be active', 'engage in', 'participate'
                ],
                'cn': [
                    '安排', '计划活动', '做些什么', '采取行动',
                    '动起来', '积极', '参与', '参加'
                ]
            },
            'safety_behaviors': {
                'en': [
                    'just in case', 'to be safe', 'safety net', 'backup plan',
                    'double check', 'make sure', 'reassurance'
                ],
                'cn': [
                    '以防万一', '为了安全', '安全网', '备用计划',
                    '再次检查', '确保', '安慰'
                ]
            },
            
            # Thought Records and CBT Techniques
            'thought_record': {
                'en': [
                    'thought record', 'automatic thought', 'thinking pattern',
                    'thought diary', 'cognitive restructuring', 'challenge thoughts'
                ],
                'cn': [
                    '思维记录', '自动思维', '思维模式',
                    '思维日记', '认知重构', '挑战思维'
                ]
            },
            'thoughts_feelings_behaviors': {
                'en': [
                    'thoughts and feelings', 'think feel behave', 'cognitive triangle',
                    'thoughts affect feelings', 'feelings affect behavior'
                ],
                'cn': [
                    '思维和感受', '思考感受行为', '认知三角',
                    '思维影响感受', '感受影响行为'
                ]
            },
            'behavioral_experiments': {
                'en': [
                    'experiment', 'test out', 'try it', 'behavioral test',
                    'hypothesis', 'prediction', 'outcome'
                ],
                'cn': [
                    '实验', '测试', '试试看', '行为测试',
                    '假设', '预测', '结果'
                ]
            },
            'homework_assignments': {
                'en': [
                    'homework', 'assignment', 'practice', 'between sessions',
                    'daily log', 'monitoring', 'tracking'
                ],
                'cn': [
                    '作业', '任务', '练习', '会话之间',
                    '每日记录', '监控', '跟踪'
                ]
            },
            'coping_strategies': {
                'en': [
                    'coping', 'cope with', 'manage', 'deal with', 'handle',
                    'strategies', 'techniques', 'skills', 'tools'
                ],
                'cn': [
                    '应对', '处理', '管理', '应付', '处理',
                    '策略', '技巧', '技能', '工具'
                ]
            }
        }
    
    def analyze_with_llm(self, messages: List[Dict], patterns: Dict) -> Dict:
        """
        Perform LLM-based CBT analysis.
        
        Args:
            messages: Recent conversation messages
            patterns: Detected patterns from quick_scan
            
        Returns:
            CBT analysis results
        """
        try:
            prompt = self._build_cbt_prompt(messages, patterns)
            
            response = client.chat.completions.create(
                model=CBT_LLM_MODEL,
                messages=[
                    {"role": "system", "content": "You are a CBT (Cognitive Behavioral Therapy) expert. Analyze conversations for CBT elements and return structured JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=800,
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content
            result = json.loads(result_text)
            
            return self._parse_cbt_result(result)
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse CBT LLM JSON response: {e}")
            return self._empty_result()
        except Exception as e:
            logger.error(f"CBT LLM analysis error: {e}")
            return self._empty_result()
    
    def _build_cbt_prompt(self, messages: List[Dict], patterns: Dict) -> str:
        """Build CBT-specific analysis prompt."""
        conversation = self._format_conversation(messages[-6:])
        
        detected_categories = list(patterns.get('patterns_found', {}).keys())
        focus_areas = ", ".join(detected_categories) if detected_categories else "all CBT elements"
        
        prompt = f"""Analyze this conversation for CBT (Cognitive Behavioral Therapy) elements.

Focus on: {focus_areas}

Conversation:
{conversation}

Identify:
1. **Cognitive Distortions**: catastrophizing, all-or-nothing thinking, mind reading, fortune telling, personalization, emotional reasoning, should statements, labeling
2. **Behavioral Patterns**: avoidance, behavioral activation, safety behaviors, coping strategies
3. **Thought Records**: automatic thoughts, thought-feeling-behavior connections
4. **CBT Interventions**: behavioral experiments, homework assignments, cognitive restructuring

Return JSON:
{{
  "cognitive_distortions": [
    {{
      "type": "catastrophizing|all_or_nothing|mind_reading|...",
      "content": "specific text or thought",
      "intensity": 0.0-1.0,
      "evidence": "quote from conversation",
      "confidence": 0.0-1.0
    }}
  ],
  "behavioral_patterns": [
    {{
      "type": "avoidance|behavioral_activation|safety_behaviors|...",
      "content": "description of behavior",
      "intensity": 0.0-1.0,
      "evidence": "quote from conversation", 
      "confidence": 0.0-1.0
    }}
  ],
  "thought_records": [
    {{
      "thoughts": "identified thoughts",
      "feelings": "identified feelings",
      "behaviors": "identified behaviors",
      "evidence": "quote from conversation",
      "confidence": 0.0-1.0
    }}
  ],
  "cbt_interventions": [
    {{
      "type": "behavioral_experiment|homework|cognitive_restructuring|...",
      "content": "description of intervention",
      "evidence": "quote from conversation",
      "confidence": 0.0-1.0
    }}
  ]
}}

Be specific and use evidence from the conversation. Support both English and Chinese."""
        
        return prompt
    
    def _parse_cbt_result(self, result: Dict) -> Dict:
        """Parse CBT LLM response into standard format."""
        elements_detected = []
        
        # Parse cognitive distortions
        for distortion in result.get('cognitive_distortions', []):
            elements_detected.append({
                'id': f"cbt_distortion_{len(elements_detected)}",
                'type': 'cognitive_distortion',
                'subtype': distortion.get('type', 'unknown'),
                'content': distortion.get('content', ''),
                'intensity': float(distortion.get('intensity', 0.5)),
                'evidence': distortion.get('evidence', ''),
                'confidence': float(distortion.get('confidence', 0.5))
            })
        
        # Parse behavioral patterns
        for behavior in result.get('behavioral_patterns', []):
            elements_detected.append({
                'id': f"cbt_behavior_{len(elements_detected)}",
                'type': 'behavioral_pattern',
                'subtype': behavior.get('type', 'unknown'),
                'content': behavior.get('content', ''),
                'intensity': float(behavior.get('intensity', 0.5)),
                'evidence': behavior.get('evidence', ''),
                'confidence': float(behavior.get('confidence', 0.5))
            })
        
        # Parse thought records
        for thought_record in result.get('thought_records', []):
            elements_detected.append({
                'id': f"cbt_thought_record_{len(elements_detected)}",
                'type': 'thought_record',
                'subtype': 'thoughts_feelings_behaviors',
                'content': f"Thoughts: {thought_record.get('thoughts', '')}; Feelings: {thought_record.get('feelings', '')}; Behaviors: {thought_record.get('behaviors', '')}",
                'intensity': 0.8,  # Thought records are significant when present
                'evidence': thought_record.get('evidence', ''),
                'confidence': float(thought_record.get('confidence', 0.5)),
                'thoughts': thought_record.get('thoughts', ''),
                'feelings': thought_record.get('feelings', ''),
                'behaviors': thought_record.get('behaviors', '')
            })
        
        # Parse CBT interventions
        for intervention in result.get('cbt_interventions', []):
            elements_detected.append({
                'id': f"cbt_intervention_{len(elements_detected)}",
                'type': 'intervention',
                'subtype': intervention.get('type', 'unknown'),
                'content': intervention.get('content', ''),
                'intensity': 0.7,  # Interventions are important when present
                'evidence': intervention.get('evidence', ''),
                'confidence': float(intervention.get('confidence', 0.5))
            })
        
        # Calculate overall confidence
        confidence_score = 0.0
        if elements_detected:
            confidences = [elem.get('confidence', 0.5) for elem in elements_detected]
            confidence_score = sum(confidences) / len(confidences)
        
        return {
            'confidence_score': confidence_score,
            'elements_detected': elements_detected,
            'evidence': self._extract_evidence(elements_detected)
        }
    
    def _format_conversation(self, messages: List[Dict]) -> str:
        """Format messages for LLM analysis."""
        formatted = []
        for msg in messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            if len(content) > 300:
                content = content[:300] + "..."
            formatted.append(f"{role.capitalize()}: {content}")
        return "\n".join(formatted)
    
    def _extract_evidence(self, elements: List[Dict]) -> str:
        """Extract evidence text from detected elements."""
        evidence_parts = []
        for element in elements[:3]:  # Top 3 elements
            evidence = element.get('evidence', '')
            if evidence:
                element_type = element.get('subtype', element.get('type', 'Element'))
                evidence_parts.append(f"{element_type}: {evidence}")
        
        return "; ".join(evidence_parts) if evidence_parts else None
    
    def _empty_result(self) -> Dict:
        """Return empty result on error."""
        return {
            'confidence_score': 0.0,
            'elements_detected': [],
            'evidence': None
        }