"""Attachment Theory Detector - Identifies Attachment Theory elements in conversations."""

import json
import logging
from typing import List, Dict
from openai import OpenAI

from src.psychology.base_detector import BaseFrameworkDetector
from src.config.settings import OPENAI_API_KEY, ATTACHMENT_LLM_MODEL

logger = logging.getLogger(__name__)
client = OpenAI(api_key=OPENAI_API_KEY)


class AttachmentDetector(BaseFrameworkDetector):
    """
    Attachment Theory framework detector.
    
    Detects:
    - Attachment styles (secure, anxious, avoidant, disorganized)
    - Relational patterns and attachment behaviors
    - Emotional regulation patterns and co-regulation
    - Attachment triggers, fears, and needs
    - Repair attempts and relationship maintenance behaviors
    """
    
    def get_framework_name(self) -> str:
        return 'attachment'
    
    def get_patterns(self) -> Dict[str, Dict[str, List[str]]]:
        """Return Attachment Theory pattern definitions in English and Chinese."""
        return {
            # Secure Attachment Patterns
            'secure_attachment': {
                'en': [
                    'feel safe', 'trust', 'secure', 'comfortable with closeness',
                    'can depend on', 'reliable', 'consistent', 'stable relationship',
                    'open communication', 'express needs', 'ask for help'
                ],
                'cn': [
                    '感到安全', '信任', '安全的', '对亲密感到舒适',
                    '可以依靠', '可靠的', '一致的', '稳定的关系',
                    '开放沟通', '表达需求', '寻求帮助'
                ]
            },
            'secure_behaviors': {
                'en': [
                    'communicate openly', 'express feelings', 'seek support',
                    'comfortable with intimacy', 'healthy boundaries',
                    'resolve conflicts', 'work together', 'mutual respect'
                ],
                'cn': [
                    '开放沟通', '表达感受', '寻求支持',
                    '对亲密感到舒适', '健康边界',
                    '解决冲突', '一起努力', '相互尊重'
                ]
            },
            
            # Anxious Attachment Patterns
            'anxious_attachment': {
                'en': [
                    'fear of abandonment', 'need reassurance', 'clingy', 'needy',
                    'worry about relationship', 'fear of being left', 'insecure',
                    'constantly checking', 'need validation', 'fear rejection'
                ],
                'cn': [
                    '害怕被抛弃', '需要安慰', '粘人', '需要的',
                    '担心关系', '害怕被离开', '不安全',
                    '不断检查', '需要验证', '害怕拒绝'
                ]
            },
            'anxious_behaviors': {
                'en': [
                    'protest behavior', 'pursue', 'chase', 'demand attention',
                    'emotional outbursts', 'jealousy', 'possessive',
                    'hypervigilant', 'overthinking', 'catastrophizing'
                ],
                'cn': [
                    '抗议行为', '追求', '追逐', '要求关注',
                    '情绪爆发', '嫉妒', '占有欲',
                    '过度警觉', '过度思考', '灾难化'
                ]
            },
            
            # Avoidant Attachment Patterns
            'avoidant_attachment': {
                'en': [
                    'independent', 'self-reliant', 'don\'t need anyone',
                    'uncomfortable with closeness', 'keep distance',
                    'avoid intimacy', 'suppress emotions', 'detached'
                ],
                'cn': [
                    '独立的', '自力更生', '不需要任何人',
                    '对亲密感到不舒服', '保持距离',
                    '避免亲密', '压抑情感', '疏离'
                ]
            },
            'avoidant_behaviors': {
                'en': [
                    'withdraw', 'shut down', 'stonewalling', 'minimize feelings',
                    'avoid conflict', 'change subject', 'dismiss emotions',
                    'focus on tasks', 'intellectualize', 'compartmentalize'
                ],
                'cn': [
                    '退缩', '关闭', '冷战', '最小化感受',
                    '避免冲突', '转移话题', '忽视情感',
                    '专注任务', '理智化', '分割'
                ]
            },
            
            # Disorganized Attachment Patterns
            'disorganized_attachment': {
                'en': [
                    'chaotic relationships', 'unpredictable', 'hot and cold',
                    'approach and avoid', 'conflicted', 'confused',
                    'fear and need', 'want closeness but scared', 'unstable'
                ],
                'cn': [
                    '混乱的关系', '不可预测', '忽冷忽热',
                    '接近又回避', '矛盾的', '困惑的',
                    '恐惧和需要', '想要亲密但害怕', '不稳定'
                ]
            },
            'disorganized_behaviors': {
                'en': [
                    'inconsistent behavior', 'mood swings', 'erratic',
                    'push-pull dynamic', 'self-sabotage', 'contradictory',
                    'freeze response', 'dissociate', 'overwhelmed'
                ],
                'cn': [
                    '不一致的行为', '情绪波动', '不稳定',
                    '推拉动态', '自我破坏', '矛盾的',
                    '冻结反应', '分离', '不知所措'
                ]
            },
            
            # Emotional Regulation Patterns
            'emotional_regulation': {
                'en': [
                    'regulate emotions', 'calm down', 'self-soothe',
                    'manage feelings', 'cope with stress', 'emotional control',
                    'breathing', 'grounding', 'mindfulness'
                ],
                'cn': [
                    '调节情绪', '冷静下来', '自我安慰',
                    '管理感受', '应对压力', '情绪控制',
                    '呼吸', '接地', '正念'
                ]
            },
            'co_regulation': {
                'en': [
                    'co-regulate', 'help me calm', 'soothe each other',
                    'regulate together', 'mutual support', 'comfort each other',
                    'presence helps', 'feel better with you', 'calming influence'
                ],
                'cn': [
                    '共同调节', '帮我冷静', '互相安慰',
                    '一起调节', '相互支持', '互相安慰',
                    '存在有帮助', '和你在一起感觉更好', '平静的影响'
                ]
            },
            'dysregulation': {
                'en': [
                    'overwhelmed', 'out of control', 'can\'t cope',
                    'emotional flooding', 'triggered', 'reactive',
                    'shut down', 'numb', 'disconnected'
                ],
                'cn': [
                    '不知所措', '失控', '无法应对',
                    '情绪泛滥', '被触发', '反应性',
                    '关闭', '麻木', '断开连接'
                ]
            },
            
            # Attachment Triggers and Fears
            'abandonment_fears': {
                'en': [
                    'fear of abandonment', 'being left alone', 'rejected',
                    'not good enough', 'will leave me', 'don\'t want me',
                    'everyone leaves', 'temporary', 'won\'t last'
                ],
                'cn': [
                    '害怕被抛弃', '被独自留下', '被拒绝',
                    '不够好', '会离开我', '不想要我',
                    '每个人都离开', '暂时的', '不会持续'
                ]
            },
            'intimacy_fears': {
                'en': [
                    'fear of intimacy', 'too close', 'suffocating',
                    'lose myself', 'engulfed', 'trapped',
                    'need space', 'overwhelming', 'too much'
                ],
                'cn': [
                    '害怕亲密', '太近', '窒息',
                    '失去自己', '被吞没', '被困',
                    '需要空间', '压倒性', '太多'
                ]
            },
            'attachment_triggers': {
                'en': [
                    'triggered by', 'reminds me of', 'brings up',
                    'activated', 'old wounds', 'past hurt',
                    'childhood', 'family patterns', 'learned behavior'
                ],
                'cn': [
                    '被触发', '让我想起', '带来',
                    '激活', '旧伤', '过去的伤害',
                    '童年', '家庭模式', '学习行为'
                ]
            },
            
            # Relationship Dynamics
            'pursuit_distance': {
                'en': [
                    'pursue', 'chase', 'distance', 'withdraw',
                    'pursuer', 'distancer', 'push-pull', 'cycle',
                    'the more I', 'the more they', 'dance'
                ],
                'cn': [
                    '追求', '追逐', '距离', '退缩',
                    '追求者', '疏远者', '推拉', '循环',
                    '我越', '他们越', '舞蹈'
                ]
            },
            'repair_attempts': {
                'en': [
                    'repair', 'make up', 'apologize', 'reconnect',
                    'reach out', 'bridge', 'heal', 'restore',
                    'come back together', 'work it out', 'fix'
                ],
                'cn': [
                    '修复', '和好', '道歉', '重新连接',
                    '伸出手', '桥梁', '治愈', '恢复',
                    '重新在一起', '解决', '修复'
                ]
            },
            'relationship_maintenance': {
                'en': [
                    'maintain relationship', 'keep connection', 'nurture',
                    'invest in', 'work on relationship', 'strengthen bond',
                    'quality time', 'check in', 'stay connected'
                ],
                'cn': [
                    '维持关系', '保持连接', '培养',
                    '投资于', '努力经营关系', '加强纽带',
                    '优质时间', '检查', '保持连接'
                ]
            },
            
            # Attachment Needs
            'security_needs': {
                'en': [
                    'need security', 'feel safe', 'stability', 'predictability',
                    'consistency', 'reliability', 'trust', 'dependable',
                    'safe haven', 'secure base', 'protection'
                ],
                'cn': [
                    '需要安全', '感到安全', '稳定性', '可预测性',
                    '一致性', '可靠性', '信任', '可依赖',
                    '安全港', '安全基地', '保护'
                ]
            },
            'connection_needs': {
                'en': [
                    'need connection', 'belong', 'closeness', 'intimacy',
                    'bonding', 'attachment', 'togetherness', 'unity',
                    'feel loved', 'accepted', 'valued'
                ],
                'cn': [
                    '需要连接', '归属', '亲密', '亲密关系',
                    '结合', '依恋', '在一起', '统一',
                    '感到被爱', '被接受', '被重视'
                ]
            },
            'autonomy_needs': {
                'en': [
                    'need autonomy', 'independence', 'freedom', 'space',
                    'individuality', 'self-determination', 'choice',
                    'own person', 'separate', 'individual'
                ],
                'cn': [
                    '需要自主', '独立', '自由', '空间',
                    '个性', '自我决定', '选择',
                    '自己的人', '分离', '个体'
                ]
            }
        }
    
    def analyze_with_llm(self, messages: List[Dict], patterns: Dict) -> Dict:
        """
        Perform LLM-based Attachment Theory analysis.
        
        Args:
            messages: Recent conversation messages
            patterns: Detected patterns from quick_scan
            
        Returns:
            Attachment Theory analysis results
        """
        try:
            prompt = self._build_attachment_prompt(messages, patterns)
            
            response = client.chat.completions.create(
                model=ATTACHMENT_LLM_MODEL,
                messages=[
                    {"role": "system", "content": "You are an Attachment Theory expert. Analyze conversations for attachment patterns and return structured JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=800,
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content
            result = json.loads(result_text)
            
            return self._parse_attachment_result(result)
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Attachment LLM JSON response: {e}")
            return self._empty_result()
        except Exception as e:
            logger.error(f"Attachment LLM analysis error: {e}")
            return self._empty_result()
    
    def _build_attachment_prompt(self, messages: List[Dict], patterns: Dict) -> str:
        """Build Attachment Theory-specific analysis prompt."""
        conversation = self._format_conversation(messages[-6:])
        
        detected_categories = list(patterns.get('patterns_found', {}).keys())
        focus_areas = ", ".join(detected_categories) if detected_categories else "all Attachment Theory elements"
        
        prompt = f"""Analyze this conversation for Attachment Theory elements.

Focus on: {focus_areas}

Conversation:
{conversation}

Identify:
1. **Attachment Styles**: secure, anxious, avoidant, disorganized attachment patterns
2. **Relational Patterns**: pursuit-distance dynamics, relationship behaviors
3. **Emotional Regulation**: regulation strategies, co-regulation, dysregulation
4. **Attachment Triggers**: abandonment fears, intimacy fears, triggers
5. **Attachment Needs**: security, connection, autonomy needs

Return JSON:
{{
  "attachment_styles": [
    {{
      "type": "secure|anxious|avoidant|disorganized",
      "content": "description of attachment pattern",
      "attachment_style": "specific style identified",
      "intensity": 0.0-1.0,
      "evidence": "quote from conversation",
      "confidence": 0.0-1.0
    }}
  ],
  "relational_patterns": [
    {{
      "type": "pursuit_distance|repair_attempt|relationship_maintenance",
      "content": "description of relational pattern",
      "relational_behavior": "specific behavior identified",
      "intensity": 0.0-1.0,
      "evidence": "quote from conversation",
      "confidence": 0.0-1.0
    }}
  ],
  "emotional_regulation": [
    {{
      "type": "emotional_regulation|co_regulation|dysregulation",
      "content": "description of regulation pattern",
      "regulation_strategy": "specific strategy if identified",
      "intensity": 0.0-1.0,
      "evidence": "quote from conversation",
      "confidence": 0.0-1.0
    }}
  ],
  "attachment_triggers": [
    {{
      "type": "abandonment_fear|intimacy_fear|attachment_trigger",
      "content": "description of trigger or fear",
      "attachment_trigger": "specific trigger identified",
      "intensity": 0.0-1.0,
      "evidence": "quote from conversation",
      "confidence": 0.0-1.0
    }}
  ],
  "attachment_needs": [
    {{
      "type": "security_need|connection_need|autonomy_need",
      "content": "description of attachment need",
      "intensity": 0.0-1.0,
      "evidence": "quote from conversation",
      "confidence": 0.0-1.0
    }}
  ]
}}

Be specific and use evidence from the conversation. Support both English and Chinese."""
        
        return prompt
    
    def _parse_attachment_result(self, result: Dict) -> Dict:
        """Parse Attachment Theory LLM response into standard format."""
        elements_detected = []
        
        # Parse attachment styles
        for style in result.get('attachment_styles', []):
            elements_detected.append({
                'id': f"attachment_style_{len(elements_detected)}",
                'type': 'attachment_style',
                'subtype': style.get('type', 'unknown'),
                'content': style.get('content', ''),
                'attachment_style': style.get('attachment_style'),
                'intensity': float(style.get('intensity', 0.5)),
                'evidence': style.get('evidence', ''),
                'confidence': float(style.get('confidence', 0.5))
            })
        
        # Parse relational patterns
        for pattern in result.get('relational_patterns', []):
            elements_detected.append({
                'id': f"attachment_relational_{len(elements_detected)}",
                'type': 'relational_pattern',
                'subtype': pattern.get('type', 'unknown'),
                'content': pattern.get('content', ''),
                'relational_behavior': pattern.get('relational_behavior'),
                'intensity': float(pattern.get('intensity', 0.5)),
                'evidence': pattern.get('evidence', ''),
                'confidence': float(pattern.get('confidence', 0.5)),
                'repair_attempt': pattern.get('type') == 'repair_attempt'
            })
        
        # Parse emotional regulation
        for regulation in result.get('emotional_regulation', []):
            elements_detected.append({
                'id': f"attachment_regulation_{len(elements_detected)}",
                'type': 'emotional_regulation',
                'subtype': regulation.get('type', 'unknown'),
                'content': regulation.get('content', ''),
                'regulation_strategy': regulation.get('regulation_strategy'),
                'intensity': float(regulation.get('intensity', 0.5)),
                'evidence': regulation.get('evidence', ''),
                'confidence': float(regulation.get('confidence', 0.5))
            })
        
        # Parse attachment triggers
        for trigger in result.get('attachment_triggers', []):
            elements_detected.append({
                'id': f"attachment_trigger_{len(elements_detected)}",
                'type': 'attachment_need',
                'subtype': trigger.get('type', 'unknown'),
                'content': trigger.get('content', ''),
                'attachment_trigger': trigger.get('attachment_trigger'),
                'intensity': float(trigger.get('intensity', 0.5)),
                'evidence': trigger.get('evidence', ''),
                'confidence': float(trigger.get('confidence', 0.5))
            })
        
        # Parse attachment needs
        for need in result.get('attachment_needs', []):
            elements_detected.append({
                'id': f"attachment_need_{len(elements_detected)}",
                'type': 'attachment_need',
                'subtype': need.get('type', 'unknown'),
                'content': need.get('content', ''),
                'intensity': float(need.get('intensity', 0.5)),
                'evidence': need.get('evidence', ''),
                'confidence': float(need.get('confidence', 0.5))
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