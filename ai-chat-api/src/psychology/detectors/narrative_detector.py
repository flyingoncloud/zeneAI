"""Narrative Therapy Detector - Identifies Narrative Therapy elements in conversations."""

import json
import logging
from typing import List, Dict
from openai import OpenAI

from src.psychology.base_detector import BaseFrameworkDetector
from src.config.settings import OPENAI_API_KEY, NARRATIVE_LLM_MODEL

logger = logging.getLogger(__name__)
client = OpenAI(api_key=OPENAI_API_KEY)


class NarrativeDetector(BaseFrameworkDetector):
    """
    Narrative Therapy framework detector.
    
    Detects:
    - Problem externalization (separation between person and problem)
    - Unique outcomes and exceptions
    - Re-authoring conversations and preferred identity claims
    - Deconstruction of dominant cultural narratives
    - Audience and witnessing practices
    """
    
    def get_framework_name(self) -> str:
        return 'narrative'
    
    def get_patterns(self) -> Dict[str, Dict[str, List[str]]]:
        """Return Narrative Therapy pattern definitions in English and Chinese."""
        return {
            # Problem Externalization
            'externalization': {
                'en': [
                    'the problem', 'this problem', 'the issue', 'the difficulty',
                    'problem is separate', 'problem is not me', 'I am not the problem',
                    'the problem tries to', 'problem wants me to', 'problem tells me'
                ],
                'cn': [
                    '这个问题', '这个困难', '这个议题', '这个难题',
                    '问题是分离的', '问题不是我', '我不是问题',
                    '问题试图', '问题想让我', '问题告诉我'
                ]
            },
            'problem_separation': {
                'en': [
                    'separate from', 'not part of me', 'outside of me',
                    'the problem has', 'problem does', 'problem makes me',
                    'fighting against', 'resisting', 'standing up to'
                ],
                'cn': [
                    '与...分离', '不是我的一部分', '在我之外',
                    '问题有', '问题做', '问题让我',
                    '对抗', '抵抗', '站起来反对'
                ]
            },
            'problem_influence': {
                'en': [
                    'problem influences', 'problem affects', 'problem controls',
                    'under the influence of', 'problem has power over',
                    'problem convinces me', 'problem tricks me'
                ],
                'cn': [
                    '问题影响', '问题影响', '问题控制',
                    '在...影响下', '问题有权力',
                    '问题说服我', '问题欺骗我'
                ]
            },
            
            # Unique Outcomes and Exceptions
            'unique_outcomes': {
                'en': [
                    'exception', 'different time', 'when it was different',
                    'time when', 'moment when', 'occasion when',
                    'unique outcome', 'sparkling moment', 'breakthrough'
                ],
                'cn': [
                    '例外', '不同的时候', '当它不同时',
                    '当...时候', '那一刻', '那个场合',
                    '独特结果', '闪光时刻', '突破'
                ]
            },
            'alternative_story': {
                'en': [
                    'alternative story', 'different story', 'new story',
                    'preferred story', 'another version', 'different narrative',
                    'rewrite', 'new chapter', 'different ending'
                ],
                'cn': [
                    '替代故事', '不同的故事', '新故事',
                    '偏好的故事', '另一个版本', '不同的叙述',
                    '重写', '新章节', '不同的结局'
                ]
            },
            'exceptions_exploration': {
                'en': [
                    'tell me about a time', 'when was different', 'exception to',
                    'times when you', 'moments when you', 'occasions when'
                ],
                'cn': [
                    '告诉我一个时候', '什么时候不同', '例外于',
                    '当你...的时候', '你...的时刻', '你...的场合'
                ]
            },
            
            # Re-authoring and Preferred Identity
            'preferred_identity': {
                'en': [
                    'who I really am', 'true self', 'preferred identity',
                    'the person I want to be', 'my values', 'what matters to me',
                    'authentic self', 'real me', 'who I choose to be'
                ],
                'cn': [
                    '我真正是谁', '真实的自我', '偏好的身份',
                    '我想成为的人', '我的价值观', '对我重要的',
                    '真实的自我', '真正的我', '我选择成为的人'
                ]
            },
            're_authoring': {
                'en': [
                    're-author', 'rewrite', 'new story', 'different story',
                    'author of my life', 'write my story', 'create my narrative',
                    'story I want to tell', 'preferred narrative'
                ],
                'cn': [
                    '重新创作', '重写', '新故事', '不同的故事',
                    '我生活的作者', '写我的故事', '创造我的叙述',
                    '我想讲的故事', '偏好的叙述'
                ]
            },
            'identity_claims': {
                'en': [
                    'I am someone who', 'I see myself as', 'I identify as',
                    'this shows I am', 'this means I am', 'I am the kind of person',
                    'my identity', 'who I am'
                ],
                'cn': [
                    '我是一个...的人', '我把自己看作', '我认同为',
                    '这表明我是', '这意味着我是', '我是那种人',
                    '我的身份', '我是谁'
                ]
            },
            
            # Deconstruction of Dominant Narratives
            'dominant_narratives': {
                'en': [
                    'society says', 'culture tells us', 'expected to',
                    'supposed to be', 'normal is', 'should be',
                    'dominant story', 'cultural narrative', 'social expectation'
                ],
                'cn': [
                    '社会说', '文化告诉我们', '期望',
                    '应该是', '正常是', '应该',
                    '主导故事', '文化叙述', '社会期望'
                ]
            },
            'deconstruction': {
                'en': [
                    'question', 'challenge', 'examine', 'deconstruct',
                    'whose voice', 'where does this come from', 'who benefits',
                    'taken for granted', 'assumed', 'unquestioned'
                ],
                'cn': [
                    '质疑', '挑战', '检查', '解构',
                    '谁的声音', '这来自哪里', '谁受益',
                    '理所当然', '假设', '不被质疑'
                ]
            },
            'cultural_critique': {
                'en': [
                    'cultural pressure', 'social pressure', 'expectations',
                    'gender roles', 'stereotypes', 'cultural norms',
                    'power structures', 'marginalized', 'oppression'
                ],
                'cn': [
                    '文化压力', '社会压力', '期望',
                    '性别角色', '刻板印象', '文化规范',
                    '权力结构', '边缘化', '压迫'
                ]
            },
            
            # Audience and Witnessing
            'audience': {
                'en': [
                    'audience', 'witness', 'witnesses', 'people who know',
                    'those who see', 'supporters', 'community',
                    'who would not be surprised', 'who knows this about you'
                ],
                'cn': [
                    '观众', '见证者', '见证人', '知道的人',
                    '那些看到的人', '支持者', '社区',
                    '谁不会惊讶', '谁知道你这一点'
                ]
            },
            'witnessing': {
                'en': [
                    'witnessing', 'bear witness', 'acknowledge',
                    'recognize', 'see', 'honor', 'validate',
                    'testimony', 'story telling', 'sharing story'
                ],
                'cn': [
                    '见证', '作证', '承认',
                    '认识', '看到', '尊重', '验证',
                    '证词', '讲故事', '分享故事'
                ]
            },
            'community_support': {
                'en': [
                    'community', 'support network', 'allies', 'supporters',
                    'people who care', 'those who understand',
                    'solidarity', 'collective', 'together'
                ],
                'cn': [
                    '社区', '支持网络', '盟友', '支持者',
                    '关心的人', '理解的人',
                    '团结', '集体', '一起'
                ]
            },
            
            # Narrative Techniques
            'story_development': {
                'en': [
                    'story', 'narrative', 'plot', 'chapter', 'beginning',
                    'middle', 'end', 'turning point', 'climax',
                    'character', 'protagonist', 'hero'
                ],
                'cn': [
                    '故事', '叙述', '情节', '章节', '开始',
                    '中间', '结束', '转折点', '高潮',
                    '角色', '主角', '英雄'
                ]
            },
            'meaning_making': {
                'en': [
                    'meaning', 'significance', 'what this means',
                    'interpretation', 'understanding', 'sense making',
                    'purpose', 'why this matters', 'importance'
                ],
                'cn': [
                    '意义', '重要性', '这意味着什么',
                    '解释', '理解', '意义建构',
                    '目的', '为什么重要', '重要性'
                ]
            }
        }
    
    def analyze_with_llm(self, messages: List[Dict], patterns: Dict) -> Dict:
        """
        Perform LLM-based Narrative Therapy analysis.
        
        Args:
            messages: Recent conversation messages
            patterns: Detected patterns from quick_scan
            
        Returns:
            Narrative Therapy analysis results
        """
        try:
            prompt = self._build_narrative_prompt(messages, patterns)
            
            response = client.chat.completions.create(
                model=NARRATIVE_LLM_MODEL,
                messages=[
                    {"role": "system", "content": "You are a Narrative Therapy expert. Analyze conversations for Narrative Therapy elements and return structured JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=800,
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content
            result = json.loads(result_text)
            
            return self._parse_narrative_result(result)
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Narrative LLM JSON response: {e}")
            return self._empty_result()
        except Exception as e:
            logger.error(f"Narrative LLM analysis error: {e}")
            return self._empty_result()
    
    def _build_narrative_prompt(self, messages: List[Dict], patterns: Dict) -> str:
        """Build Narrative Therapy-specific analysis prompt."""
        conversation = self._format_conversation(messages[-6:])
        
        detected_categories = list(patterns.get('patterns_found', {}).keys())
        focus_areas = ", ".join(detected_categories) if detected_categories else "all Narrative Therapy elements"
        
        prompt = f"""Analyze this conversation for Narrative Therapy elements.

Focus on: {focus_areas}

Conversation:
{conversation}

Identify:
1. **Problem Externalization**: separation between person and problem, problem influence
2. **Unique Outcomes**: exceptions, alternative stories, different experiences
3. **Re-authoring**: preferred identity, identity claims, new narratives
4. **Deconstruction**: challenging dominant narratives, cultural critique
5. **Witnessing**: audience, community support, story sharing

Return JSON:
{{
  "externalization": [
    {{
      "type": "externalization|problem_separation|problem_influence",
      "content": "description of externalization",
      "problem_separation": true/false,
      "intensity": 0.0-1.0,
      "evidence": "quote from conversation",
      "confidence": 0.0-1.0
    }}
  ],
  "unique_outcomes": [
    {{
      "type": "unique_outcome|exception|alternative_story",
      "content": "description of unique outcome or exception",
      "story_development": "how story is developing differently",
      "intensity": 0.0-1.0,
      "evidence": "quote from conversation",
      "confidence": 0.0-1.0
    }}
  ],
  "re_authoring": [
    {{
      "type": "preferred_identity|identity_claim|re_authoring",
      "content": "description of re-authoring process",
      "identity_claim": "specific identity claim if present",
      "narrative_shift": "description of narrative shift",
      "intensity": 0.0-1.0,
      "evidence": "quote from conversation",
      "confidence": 0.0-1.0
    }}
  ],
  "deconstruction": [
    {{
      "type": "dominant_narrative|cultural_critique|deconstruction",
      "content": "description of deconstruction process",
      "intensity": 0.0-1.0,
      "evidence": "quote from conversation",
      "confidence": 0.0-1.0
    }}
  ],
  "witnessing": [
    {{
      "type": "audience|witnessing|community_support",
      "content": "description of witnessing or audience",
      "intensity": 0.0-1.0,
      "evidence": "quote from conversation",
      "confidence": 0.0-1.0
    }}
  ]
}}

Be specific and use evidence from the conversation. Support both English and Chinese."""
        
        return prompt
    
    def _parse_narrative_result(self, result: Dict) -> Dict:
        """Parse Narrative Therapy LLM response into standard format."""
        elements_detected = []
        
        # Parse externalization
        for externalization in result.get('externalization', []):
            elements_detected.append({
                'id': f"narrative_externalization_{len(elements_detected)}",
                'type': 'externalization',
                'subtype': externalization.get('type', 'unknown'),
                'content': externalization.get('content', ''),
                'problem_separation': externalization.get('problem_separation'),
                'intensity': float(externalization.get('intensity', 0.5)),
                'evidence': externalization.get('evidence', ''),
                'confidence': float(externalization.get('confidence', 0.5)),
                'externalization_language': True
            })
        
        # Parse unique outcomes
        for outcome in result.get('unique_outcomes', []):
            elements_detected.append({
                'id': f"narrative_outcome_{len(elements_detected)}",
                'type': 'unique_outcome',
                'subtype': outcome.get('type', 'unknown'),
                'content': outcome.get('content', ''),
                'story_development': outcome.get('story_development'),
                'intensity': float(outcome.get('intensity', 0.5)),
                'evidence': outcome.get('evidence', ''),
                'confidence': float(outcome.get('confidence', 0.5))
            })
        
        # Parse re-authoring
        for reauthor in result.get('re_authoring', []):
            elements_detected.append({
                'id': f"narrative_reauthor_{len(elements_detected)}",
                'type': 'preferred_identity',
                'subtype': reauthor.get('type', 'unknown'),
                'content': reauthor.get('content', ''),
                'identity_claim': reauthor.get('identity_claim'),
                'narrative_shift': reauthor.get('narrative_shift'),
                'intensity': float(reauthor.get('intensity', 0.5)),
                'evidence': reauthor.get('evidence', ''),
                'confidence': float(reauthor.get('confidence', 0.5)),
                're_authoring_indicator': True
            })
        
        # Parse deconstruction
        for deconstruct in result.get('deconstruction', []):
            elements_detected.append({
                'id': f"narrative_deconstruct_{len(elements_detected)}",
                'type': 'alternative_story',
                'subtype': deconstruct.get('type', 'unknown'),
                'content': deconstruct.get('content', ''),
                'intensity': float(deconstruct.get('intensity', 0.5)),
                'evidence': deconstruct.get('evidence', ''),
                'confidence': float(deconstruct.get('confidence', 0.5))
            })
        
        # Parse witnessing
        for witness in result.get('witnessing', []):
            elements_detected.append({
                'id': f"narrative_witness_{len(elements_detected)}",
                'type': 'witnessing',
                'subtype': witness.get('type', 'unknown'),
                'content': witness.get('content', ''),
                'intensity': float(witness.get('intensity', 0.5)),
                'evidence': witness.get('evidence', ''),
                'confidence': float(witness.get('confidence', 0.5))
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