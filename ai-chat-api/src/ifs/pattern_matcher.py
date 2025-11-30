"""Fast pattern matching for IFS indicators (Stage 1).

Supports both English and Chinese languages for speed optimization.
"""

import re
from typing import List, Dict, Set
from collections import defaultdict


# Self-energy indicators (8 C's of Self)
SELF_PATTERNS_EN = {
    'curiosity': ['wonder', 'curious', 'interested', 'notice', 'exploring'],
    'compassion': ['understand', 'makes sense', 'appreciate', 'care about', 'empathize'],
    'calm': ['take time', 'breath', 'pause', 'moment', 'slow down', 'settle'],
    'clarity': ['i feel', 'i notice', 'i sense', 'aware that', 'i see'],
    'confidence': ['i know', 'i trust', 'i believe', 'confident'],
    'courage': ['brave', 'willing to', 'face', 'try'],
    'creativity': ['imagine', 'creative', 'new way', 'different approach'],
    'connectedness': ['connected', 'relate', 'together', 'we'],
}

SELF_PATTERNS_CN = {
    'curiosity': ['好奇', '想知道', '探索', '注意到', '发现'],
    'compassion': ['理解', '感同身受', '同情', '关心', '体谅'],
    'calm': ['平静', '冷静', '放松', '深呼吸', '慢下来'],
    'clarity': ['我感觉', '我注意到', '我意识到', '清楚', '明白'],
    'confidence': ['我知道', '我相信', '自信', '确定'],
    'courage': ['勇敢', '愿意', '面对', '尝试'],
    'creativity': ['想象', '创造', '新的方式', '不同的方法'],
    'connectedness': ['连接', '联系', '一起', '我们'],
}

# Manager parts - protective, controlling
MANAGER_PATTERNS_EN = {
    'control': ['should', 'must', 'have to', 'need to', 'supposed to', 'ought to'],
    'perfectionist': ['perfect', 'right way', 'mistake', 'failure', 'wrong', 'correct'],
    'caretaker': ['they need', 'help them', 'take care', 'worry about others'],
    'planner': ['what if', 'prepare', 'plan', 'think ahead', 'prevent'],
    'critic': ['stupid', 'idiot', 'not good enough', 'failure', 'useless'],
}

MANAGER_PATTERNS_CN = {
    'control': ['应该', '必须', '不得不', '需要', '应当', '得'],
    'perfectionist': ['完美', '正确', '错误', '失败', '不对'],
    'caretaker': ['照顾', '担心', '帮助他们', '为了别人'],
    'planner': ['万一', '准备', '计划', '提前', '防止'],
    'critic': ['笨', '傻', '不够好', '失败', '没用'],
}

# Firefighter parts - reactive, distracting
FIREFIGHTER_PATTERNS_EN = {
    'avoidance': ['don\'t want to talk', 'change subject', 'anyway', 'never mind', 'forget it'],
    'anger': ['angry', 'furious', 'hate', 'blame', 'rage', 'pissed'],
    'numbing': ['numb', 'nothing', 'don\'t care', 'whatever', 'doesn\'t matter'],
    'distraction': ['distract', 'escape', 'get away', 'avoid'],
}

FIREFIGHTER_PATTERNS_CN = {
    'avoidance': ['不想说', '换个话题', '算了', '没事', '忘了吧'],
    'anger': ['生气', '愤怒', '讨厌', '恨', '怪'],
    'numbing': ['麻木', '无所谓', '不在乎', '没感觉'],
    'distraction': ['分散', '逃避', '离开', '躲'],
}

# Exile parts - wounded, vulnerable
EXILE_PATTERNS_EN = {
    'shame': ['ashamed', 'embarrassed', 'worthless', 'not good enough', 'humiliated'],
    'fear': ['scared', 'afraid', 'terrified', 'anxious', 'worried', 'nervous'],
    'sadness': ['sad', 'lonely', 'abandoned', 'hurt', 'depressed', 'empty'],
    'unworthiness': ['not worthy', 'don\'t deserve', 'not enough', 'inadequate'],
}

EXILE_PATTERNS_CN = {
    'shame': ['羞愧', '尴尬', '没价值', '不够好', '丢脸'],
    'fear': ['害怕', '恐惧', '担心', '焦虑', '紧张'],
    'sadness': ['悲伤', '孤独', '被抛弃', '受伤', '抑郁', '空虚'],
    'unworthiness': ['不配', '不值得', '不够', '不足'],
}


class PatternMatcher:
    """Fast pattern-based IFS detection using keywords."""

    def __init__(self):
        # Compile patterns for faster matching
        self.self_patterns = self._compile_patterns(SELF_PATTERNS_EN, SELF_PATTERNS_CN)
        self.manager_patterns = self._compile_patterns(MANAGER_PATTERNS_EN, MANAGER_PATTERNS_CN)
        self.firefighter_patterns = self._compile_patterns(FIREFIGHTER_PATTERNS_EN, FIREFIGHTER_PATTERNS_CN)
        self.exile_patterns = self._compile_patterns(EXILE_PATTERNS_EN, EXILE_PATTERNS_CN)

    def _compile_patterns(self, en_dict: Dict, cn_dict: Dict) -> Dict[str, Set[str]]:
        """Combine English and Chinese patterns."""
        combined = defaultdict(set)
        for key, values in en_dict.items():
            combined[key].update(v.lower() for v in values)
        for key, values in cn_dict.items():
            combined[key].update(values)
        return dict(combined)

    def quick_scan(self, messages: List[Dict[str, str]]) -> Dict:
        """
        Fast pattern matching on recent messages.

        Returns:
            {
                'has_self': bool,
                'has_parts': bool,
                'self_indicators': {...},
                'manager_parts': {...},
                'firefighter_parts': {...},
                'exile_parts': {...}
            }
        """
        # Combine all message content
        text = ' '.join(msg.get('content', '').lower() for msg in messages if msg.get('role') == 'user')

        result = {
            'has_self': False,
            'has_parts': False,
            'self_indicators': {},
            'manager_parts': {},
            'firefighter_parts': {},
            'exile_parts': {},
        }

        # Check for Self indicators
        self_found = self._match_patterns(text, self.self_patterns)
        if self_found:
            result['has_self'] = True
            result['self_indicators'] = self_found

        # Check for Parts
        manager_found = self._match_patterns(text, self.manager_patterns)
        if manager_found:
            result['has_parts'] = True
            result['manager_parts'] = manager_found

        firefighter_found = self._match_patterns(text, self.firefighter_patterns)
        if firefighter_found:
            result['has_parts'] = True
            result['firefighter_parts'] = firefighter_found

        exile_found = self._match_patterns(text, self.exile_patterns)
        if exile_found:
            result['has_parts'] = True
            result['exile_parts'] = exile_found

        return result

    def _match_patterns(self, text: str, patterns: Dict[str, Set[str]]) -> Dict[str, List[str]]:
        """Match patterns in text and return findings."""
        findings = {}

        for category, keywords in patterns.items():
            matched = []
            for keyword in keywords:
                # Use word boundary for English, direct match for Chinese
                if any(c >= '\u4e00' and c <= '\u9fff' for c in keyword):
                    # Chinese - direct substring match
                    if keyword in text:
                        matched.append(keyword)
                else:
                    # English - word boundary match
                    pattern = r'\b' + re.escape(keyword) + r'\b'
                    if re.search(pattern, text, re.IGNORECASE):
                        matched.append(keyword)

            if matched:
                findings[category] = matched

        return findings
