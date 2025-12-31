"""Jungian Psychology Detector - Identifies Jungian elements in conversations."""

import json
import logging
from typing import List, Dict
from openai import OpenAI

from src.psychology.base_detector import BaseFrameworkDetector
from src.config.settings import OPENAI_API_KEY, JUNGIAN_LLM_MODEL

logger = logging.getLogger(__name__)
client = OpenAI(api_key=OPENAI_API_KEY)


class JungianDetector(BaseFrameworkDetector):
    """
    Jungian Psychology framework detector.
    
    Detects:
    - Archetypal content (shadow, anima/animus, persona, Self)
    - Dream content and symbolic elements
    - Individuation process indicators
    - Psychological complexes and projections
    - Active imagination and amplification techniques
    """
    
    def get_framework_name(self) -> str:
        return 'jungian'
    
    def get_patterns(self) -> Dict[str, Dict[str, List[str]]]:
        """Return Jungian pattern definitions in English and Chinese."""
        return {
            # Archetypal Content
            'shadow': {
                'en': [
                    'shadow', 'dark side', 'hidden part', 'rejected aspect',
                    'what I hate about', 'what I deny', 'my worst qualities',
                    'the part I hide', 'shameful part', 'unacceptable side'
                ],
                'cn': [
                    '阴影', '黑暗面', '隐藏部分', '被拒绝的方面',
                    '我讨厌的', '我否认的', '我最坏的品质',
                    '我隐藏的部分', '羞耻的部分', '不可接受的一面'
                ]
            },
            'anima_animus': {
                'en': [
                    'inner woman', 'inner man', 'feminine side', 'masculine side',
                    'opposite gender', 'contrasexual', 'anima', 'animus',
                    'my feminine', 'my masculine', 'inner opposite'
                ],
                'cn': [
                    '内在女性', '内在男性', '女性面', '男性面',
                    '异性', '对立性别', '阿尼玛', '阿尼姆斯',
                    '我的女性面', '我的男性面', '内在对立面'
                ]
            },
            'persona': {
                'en': [
                    'mask', 'public face', 'social role', 'how others see me',
                    'professional self', 'image', 'facade', 'persona',
                    'the role I play', 'social identity'
                ],
                'cn': [
                    '面具', '公众面孔', '社会角色', '别人如何看我',
                    '职业自我', '形象', '外表', '人格面具',
                    '我扮演的角色', '社会身份'
                ]
            },
            'self_archetype': {
                'en': [
                    'true self', 'authentic self', 'whole self', 'integrated self',
                    'Self with capital S', 'center of being', 'totality',
                    'wholeness', 'unity', 'integration'
                ],
                'cn': [
                    '真实自我', '真正的自我', '完整自我', '整合的自我',
                    '大写的自我', '存在中心', '整体性',
                    '完整性', '统一性', '整合'
                ]
            },
            
            # Dream Content and Symbols
            'dream_content': {
                'en': [
                    'dream', 'nightmare', 'recurring dream', 'vivid dream',
                    'dream symbol', 'dream image', 'in my dream',
                    'I dreamed', 'I had a dream', 'dream about'
                ],
                'cn': [
                    '梦', '噩梦', '重复的梦', '生动的梦',
                    '梦的象征', '梦的图像', '在我的梦里',
                    '我梦见', '我做了个梦', '梦到'
                ]
            },
            'symbolic_content': {
                'en': [
                    'symbol', 'symbolic', 'represents', 'stands for',
                    'metaphor', 'image', 'archetype', 'mythical',
                    'deeper meaning', 'symbolic meaning'
                ],
                'cn': [
                    '象征', '象征性的', '代表', '象征着',
                    '隐喻', '图像', '原型', '神话的',
                    '更深的意义', '象征意义'
                ]
            },
            'mythological_themes': {
                'en': [
                    'hero journey', 'quest', 'transformation', 'rebirth',
                    'death and rebirth', 'initiation', 'rite of passage',
                    'mythical', 'legendary', 'archetypal story'
                ],
                'cn': [
                    '英雄之旅', '探索', '转化', '重生',
                    '死亡与重生', '启蒙', '成人礼',
                    '神话的', '传奇的', '原型故事'
                ]
            },
            
            # Individuation Process
            'individuation': {
                'en': [
                    'individuation', 'becoming whole', 'self-realization',
                    'personal growth', 'psychological development',
                    'finding myself', 'becoming who I am', 'self-discovery'
                ],
                'cn': [
                    '个体化', '变得完整', '自我实现',
                    '个人成长', '心理发展',
                    '找到自己', '成为我自己', '自我发现'
                ]
            },
            'psychological_development': {
                'en': [
                    'growing up', 'maturing', 'evolving', 'developing',
                    'life stage', 'transition', 'transformation',
                    'psychological growth', 'inner development'
                ],
                'cn': [
                    '成长', '成熟', '进化', '发展',
                    '人生阶段', '转变', '转化',
                    '心理成长', '内在发展'
                ]
            },
            
            # Complexes and Projections
            'complexes': {
                'en': [
                    'complex', 'mother complex', 'father complex',
                    'emotional complex', 'psychological complex',
                    'triggered', 'activated', 'constellation'
                ],
                'cn': [
                    '情结', '母亲情结', '父亲情结',
                    '情感情结', '心理情结',
                    '被触发', '被激活', '星座'
                ]
            },
            'projection': {
                'en': [
                    'projection', 'projecting', 'seeing in others',
                    'what I see in them', 'they remind me of',
                    'I see myself in', 'mirror', 'reflection'
                ],
                'cn': [
                    '投射', '投射出', '在别人身上看到',
                    '我在他们身上看到的', '他们让我想起',
                    '我在其中看到自己', '镜子', '反射'
                ]
            },
            'compensation': {
                'en': [
                    'compensation', 'compensating', 'balance',
                    'opposite tendency', 'counterbalance',
                    'psychological balance', 'equilibrium'
                ],
                'cn': [
                    '补偿', '补偿性的', '平衡',
                    '相反倾向', '反平衡',
                    '心理平衡', '平衡状态'
                ]
            },
            
            # Active Imagination and Techniques
            'active_imagination': {
                'en': [
                    'active imagination', 'imagination', 'visualize',
                    'inner dialogue', 'talking to', 'imagining',
                    'fantasy', 'inner conversation', 'dialogue with'
                ],
                'cn': [
                    '积极想象', '想象', '可视化',
                    '内在对话', '与...交谈', '想象',
                    '幻想', '内心对话', '与...对话'
                ]
            },
            'amplification': {
                'en': [
                    'amplification', 'amplify', 'expand on',
                    'elaborate', 'explore deeper', 'go deeper',
                    'what does this remind you of', 'associations'
                ],
                'cn': [
                    '扩大', '放大', '扩展',
                    '详细说明', '深入探索', '更深入',
                    '这让你想起什么', '联想'
                ]
            },
            'synchronicity': {
                'en': [
                    'synchronicity', 'meaningful coincidence', 'coincidence',
                    'signs', 'meaningful connection', 'acausal connection',
                    'it feels like a sign', 'meaningful timing'
                ],
                'cn': [
                    '共时性', '有意义的巧合', '巧合',
                    '征象', '有意义的连接', '非因果连接',
                    '感觉像个征象', '有意义的时机'
                ]
            }
        }
    
    def analyze_with_llm(self, messages: List[Dict], patterns: Dict) -> Dict:
        """
        Perform LLM-based Jungian analysis.
        
        Args:
            messages: Recent conversation messages
            patterns: Detected patterns from quick_scan
            
        Returns:
            Jungian analysis results
        """
        try:
            prompt = self._build_jungian_prompt(messages, patterns)
            
            response = client.chat.completions.create(
                model=JUNGIAN_LLM_MODEL,
                messages=[
                    {"role": "system", "content": "You are a Jungian psychology expert. Analyze conversations for Jungian elements and return structured JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=800,
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content
            result = json.loads(result_text)
            
            return self._parse_jungian_result(result)
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Jungian LLM JSON response: {e}")
            return self._empty_result()
        except Exception as e:
            logger.error(f"Jungian LLM analysis error: {e}")
            return self._empty_result()
    
    def _build_jungian_prompt(self, messages: List[Dict], patterns: Dict) -> str:
        """Build Jungian-specific analysis prompt."""
        conversation = self._format_conversation(messages[-6:])
        
        detected_categories = list(patterns.get('patterns_found', {}).keys())
        focus_areas = ", ".join(detected_categories) if detected_categories else "all Jungian elements"
        
        prompt = f"""Analyze this conversation for Jungian psychology elements.

Focus on: {focus_areas}

Conversation:
{conversation}

Identify:
1. **Archetypal Content**: shadow, anima/animus, persona, Self archetype
2. **Dream Content**: dream symbols, symbolic elements, mythological themes
3. **Individuation Process**: psychological development, self-realization, transformation
4. **Complexes**: emotional complexes, projections, compensation
5. **Jungian Techniques**: active imagination, amplification, synchronicity

Return JSON:
{{
  "archetypal_content": [
    {{
      "type": "shadow|anima_animus|persona|self_archetype",
      "content": "description of archetypal material",
      "symbolic_content": "symbolic elements if present",
      "intensity": 0.0-1.0,
      "evidence": "quote from conversation",
      "confidence": 0.0-1.0
    }}
  ],
  "dream_content": [
    {{
      "type": "dream_symbol|mythological_theme|symbolic_content",
      "content": "description of dream or symbolic content",
      "archetypal_theme": "underlying archetypal theme",
      "intensity": 0.0-1.0,
      "evidence": "quote from conversation",
      "confidence": 0.0-1.0
    }}
  ],
  "individuation_markers": [
    {{
      "type": "individuation|psychological_development",
      "content": "description of individuation process",
      "individuation_stage": "stage of development if identifiable",
      "intensity": 0.0-1.0,
      "evidence": "quote from conversation",
      "confidence": 0.0-1.0
    }}
  ],
  "complexes_projections": [
    {{
      "type": "complex|projection|compensation",
      "content": "description of complex or projection",
      "intensity": 0.0-1.0,
      "evidence": "quote from conversation",
      "confidence": 0.0-1.0
    }}
  ],
  "jungian_techniques": [
    {{
      "type": "active_imagination|amplification|synchronicity",
      "content": "description of technique or phenomenon",
      "evidence": "quote from conversation",
      "confidence": 0.0-1.0
    }}
  ]
}}

Be specific and use evidence from the conversation. Support both English and Chinese."""
        
        return prompt
    
    def _parse_jungian_result(self, result: Dict) -> Dict:
        """Parse Jungian LLM response into standard format."""
        elements_detected = []
        
        # Parse archetypal content
        for archetype in result.get('archetypal_content', []):
            elements_detected.append({
                'id': f"jungian_archetype_{len(elements_detected)}",
                'type': 'archetype',
                'subtype': archetype.get('type', 'unknown'),
                'content': archetype.get('content', ''),
                'symbolic_content': archetype.get('symbolic_content'),
                'intensity': float(archetype.get('intensity', 0.5)),
                'evidence': archetype.get('evidence', ''),
                'confidence': float(archetype.get('confidence', 0.5))
            })
        
        # Parse dream content
        for dream in result.get('dream_content', []):
            elements_detected.append({
                'id': f"jungian_dream_{len(elements_detected)}",
                'type': 'dream_symbol',
                'subtype': dream.get('type', 'unknown'),
                'content': dream.get('content', ''),
                'archetypal_theme': dream.get('archetypal_theme'),
                'intensity': float(dream.get('intensity', 0.5)),
                'evidence': dream.get('evidence', ''),
                'confidence': float(dream.get('confidence', 0.5)),
                'dream_context': True
            })
        
        # Parse individuation markers
        for individuation in result.get('individuation_markers', []):
            elements_detected.append({
                'id': f"jungian_individuation_{len(elements_detected)}",
                'type': 'individuation_marker',
                'subtype': individuation.get('type', 'unknown'),
                'content': individuation.get('content', ''),
                'individuation_stage': individuation.get('individuation_stage'),
                'intensity': float(individuation.get('intensity', 0.5)),
                'evidence': individuation.get('evidence', ''),
                'confidence': float(individuation.get('confidence', 0.5))
            })
        
        # Parse complexes and projections
        for complex_item in result.get('complexes_projections', []):
            elements_detected.append({
                'id': f"jungian_complex_{len(elements_detected)}",
                'type': 'complex',
                'subtype': complex_item.get('type', 'unknown'),
                'content': complex_item.get('content', ''),
                'intensity': float(complex_item.get('intensity', 0.5)),
                'evidence': complex_item.get('evidence', ''),
                'confidence': float(complex_item.get('confidence', 0.5)),
                'projection_indicator': complex_item.get('type') == 'projection'
            })
        
        # Parse Jungian techniques
        for technique in result.get('jungian_techniques', []):
            elements_detected.append({
                'id': f"jungian_technique_{len(elements_detected)}",
                'type': 'jungian_technique',
                'subtype': technique.get('type', 'unknown'),
                'content': technique.get('content', ''),
                'intensity': 0.7,  # Techniques are significant when present
                'evidence': technique.get('evidence', ''),
                'confidence': float(technique.get('confidence', 0.5))
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