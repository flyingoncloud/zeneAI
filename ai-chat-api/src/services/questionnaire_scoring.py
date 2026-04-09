"""
Questionnaire scoring service
Calculates scores based on marking criteria for each questionnaire
"""
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)


class QuestionnaireScorer:
    """Calculate scores for questionnaire responses"""

    @staticmethod
    def calculate_score(
        questionnaire_id: str,
        marking_criteria: Dict[str, Any],
        answers: Dict[int, int],
        questions: List[Any]
    ) -> Dict[str, Any]:
        """
        Calculate scores based on questionnaire type and marking criteria

        Args:
            questionnaire_id: ID of the questionnaire
            marking_criteria: Scoring rules from questionnaire
            answers: Dict mapping question_number -> answer_value
            questions: List of Question objects

        Returns:
            Dict containing scores, interpretation, and category breakdowns
        """
        try:
            if questionnaire_id == "questionnaire_2_1":
                return QuestionnaireScorer._score_2_1(marking_criteria, answers)
            elif questionnaire_id == "questionnaire_2_2":
                return QuestionnaireScorer._score_2_2(marking_criteria, answers, questions)
            elif questionnaire_id == "questionnaire_2_3":
                return QuestionnaireScorer._score_2_3(marking_criteria, answers, questions)
            elif questionnaire_id == "questionnaire_2_5":
                return QuestionnaireScorer._score_2_5(marking_criteria, answers)
            elif questionnaire_id.startswith("admin_created"):
                # Handle admin-created questionnaires
                return QuestionnaireScorer._score_admin_created(answers, questions)
            else:
                logger.warning(f"No scoring logic for {questionnaire_id}, using simple sum")
                return {
                    "total_score": sum(answers.values()),
                    "interpretation": None,
                    "category_scores": None
                }

        except Exception as e:
            logger.error(f"Error calculating score for {questionnaire_id}: {e}")
            raise

    @staticmethod
    def _score_2_1(criteria: Dict[str, Any], answers: Dict[int, int]) -> Dict[str, Any]:
        """
        Score questionnaire 2.1 - Emotional Insight Analysis
        Simple sum of all answers (1-5 scale)
        """
        total_score = sum(answers.values())

        # Find interpretation level
        interpretation = None
        if criteria and "interpretation" in criteria:
            for level in criteria["interpretation"]:
                min_score, max_score = level["range"]
                if min_score <= total_score <= max_score:
                    interpretation = {
                        "level": level["level"],
                        "description": level["description"],
                        "score_range": level["range"]
                    }
                    break

        return {
            "total_score": total_score,
            "interpretation": interpretation,
            "category_scores": None
        }

    @staticmethod
    def _score_2_2(criteria: Dict[str, Any], answers: Dict[int, int], questions: List[Any]) -> Dict[str, Any]:
        """
        Score questionnaire 2.2 - Cognitive Insight Analysis
        Complex scoring with multiple sub-sections and categories
        """
        category_scores = {}

        # Group questions by sub_section and category
        for question in questions:
            if question.question_number not in answers:
                continue

            answer_value = answers[question.question_number]
            sub_section = question.sub_section or "general"
            category = question.category or "general"

            key = f"{sub_section}_{category}"
            if key not in category_scores:
                category_scores[key] = {
                    "sub_section": sub_section,
                    "category": category,
                    "score": 0,
                    "count": 0
                }

            category_scores[key]["score"] += answer_value
            category_scores[key]["count"] += 1

        # Calculate total score
        total_score = sum(answers.values())

        # Build comprehensive interpretation
        interpretation = {}

        # Add interpretation for 2.2.1 subcategories (IFS parts)
        ifs_interpretation = QuestionnaireScorer._interpret_2_2_1_parts(category_scores)
        if ifs_interpretation:
            interpretation["ifs_parts"] = ifs_interpretation

        # Add interpretation for 2.2.2 subcategories (Cognitive Distortions)
        cd_interpretation = QuestionnaireScorer._interpret_2_2_2_cognitive_distortions(category_scores)
        if cd_interpretation:
            interpretation["cognitive_distortions"] = cd_interpretation

        return {
            "total_score": total_score,
            "interpretation": interpretation if interpretation else None,
            "category_scores": category_scores
        }

    @staticmethod
    def _interpret_2_2_1_parts(category_scores: Dict[str, Any]) -> Dict[str, Any]:
        """
        Interpret scores for 2.2.1 subcategories (IFS parts)

        Score ranges (assuming 5 questions per part, 1-5 scale):
        - 5-11: 低活跃 (Low Activity)
        - 12-18: 中度活跃 (Moderate Activity)
        - 19-25: 高度活跃 (High Activity)
        """
        ifs_parts = {
            "2.2.1.1": "管理者 (Managers)",
            "2.2.1.2": "消防员 (Firefighters)",
            "2.2.1.3": "流亡者 (Exiles)",
            "2.2.1.4": "自性 (Self)"
        }

        interpretations = {}

        for part_code, part_name in ifs_parts.items():
            # Find the category score for this part
            key = f"2.2.1_{part_code}"
            if key in category_scores:
                score = category_scores[key]["score"]

                # Determine activity level
                if 5 <= score <= 11:
                    level = "低活跃"
                    level_en = "Low Activity"
                    description = "该类型部件当前不太主导系统"
                    description_en = "This part is not currently dominant in the system"
                elif 12 <= score <= 18:
                    level = "中度活跃"
                    level_en = "Moderate Activity"
                    description = "正常存在，功能较平衡"
                    description_en = "Normal presence, relatively balanced function"
                elif 19 <= score <= 25:
                    level = "高度活跃"
                    level_en = "High Activity"
                    description = "该部件在系统中高度活跃，可能主导行为模式"
                    description_en = "This part is highly active in the system and may dominate behavior patterns"
                else:
                    level = "未知"
                    level_en = "Unknown"
                    description = "分数超出预期范围"
                    description_en = "Score outside expected range"

                interpretations[part_code] = {
                    "part_name": part_name,
                    "score": score,
                    "level": level,
                    "level_en": level_en,
                    "description": description,
                    "description_en": description_en,
                    "score_range": [5, 25]
                }

        # Only return interpretation if we have IFS part scores
        if not interpretations:
            return None

        # Analyze combination patterns
        part_scores = {code: interp["score"] for code, interp in interpretations.items()}
        patterns = QuestionnaireScorer._analyze_ifs_patterns(part_scores)

        return {
            "type": "ifs_parts_analysis",
            "parts": interpretations,
            "patterns": patterns
        }

    @staticmethod
    def _analyze_ifs_patterns(part_scores: Dict[str, int]) -> List[Dict[str, Any]]:
        """
        Analyze combination patterns of IFS parts

        Patterns:
        1. 管理者高 + 消防员高 → 高压力/高警戒系统
        2. 消防员高 + 流亡者高 → 未处理的情绪痛点
        3. 管理者高 + 自性低 → 过度控制，缺乏觉察
        4. 自性高 (≥18) → 良好的自我工作基础
        """
        patterns = []

        # Get scores (default to 0 if not present)
        manager_score = part_scores.get("2.2.1.1", 0)
        firefighter_score = part_scores.get("2.2.1.2", 0)
        exile_score = part_scores.get("2.2.1.3", 0)
        self_score = part_scores.get("2.2.1.4", 0)

        # Define "high" threshold (≥19)
        HIGH_THRESHOLD = 19
        # Define "low" threshold (≤11)
        LOW_THRESHOLD = 11

        # Pattern 1: 管理者高 + 消防员高
        if manager_score >= HIGH_THRESHOLD and firefighter_score >= HIGH_THRESHOLD:
            patterns.append({
                "pattern": "manager_firefighter_high",
                "name": "高压力/高警戒系统",
                "name_en": "High Stress / High Alert System",
                "description": "系统长期处于高压力 / 高警戒",
                "description_en": "System is chronically in high stress / high alert state",
                "common_in": "高责任感、完美主义、慢性焦虑",
                "common_in_en": "High responsibility, perfectionism, chronic anxiety",
                "icon": "⚠️",
                "severity": "high",
                "recommendation": "需要学习放松和自我关怀技巧，降低系统警戒水平",
                "recommendation_en": "Need to learn relaxation and self-care techniques to reduce system alert level"
            })

        # Pattern 2: 消防员高 + 流亡者高
        if firefighter_score >= HIGH_THRESHOLD and exile_score >= HIGH_THRESHOLD:
            patterns.append({
                "pattern": "firefighter_exile_high",
                "name": "未处理的情绪痛点",
                "name_en": "Unprocessed Emotional Pain Points",
                "description": "说明系统中有未被安全接触的情绪痛点",
                "description_en": "Indicates unprocessed emotional pain points in the system",
                "common_in": "创伤反应、情绪回避、冲动行为",
                "common_in_en": "Trauma responses, emotional avoidance, impulsive behaviors",
                "icon": "🔥",
                "severity": "high",
                "recommendation": "IFS 中需先稳定，而非直接回忆创伤。建议寻求专业支持",
                "recommendation_en": "In IFS, need to stabilize first rather than directly recalling trauma. Professional support recommended"
            })

        # Pattern 3: 管理者高 + 自性低
        if manager_score >= HIGH_THRESHOLD and self_score <= LOW_THRESHOLD:
            patterns.append({
                "pattern": "manager_high_self_low",
                "name": "过度控制，缺乏觉察",
                "name_en": "Over-Control, Lack of Awareness",
                "description": "内在控制多于觉察",
                "description_en": "Internal control exceeds awareness",
                "common_in": "自责、疲惫、失去弹性",
                "common_in_en": "Self-blame, exhaustion, loss of flexibility",
                "icon": "🧱",
                "severity": "medium",
                "recommendation": "需要培养自我觉察和自我同情，减少过度控制",
                "recommendation_en": "Need to cultivate self-awareness and self-compassion, reduce over-control"
            })

        # Pattern 4: 自性高 (≥18)
        if self_score >= 18:
            patterns.append({
                "pattern": "self_high",
                "name": "良好的自我工作基础",
                "name_en": "Good Foundation for Self-Work",
                "description": "具备良好的IFS 自我工作基础",
                "description_en": "Has a good foundation for IFS self-work",
                "common_in": "自我觉察、情绪调节、内在平衡",
                "common_in_en": "Self-awareness, emotional regulation, internal balance",
                "icon": "🌱",
                "severity": "positive",
                "recommendation": "可以深入探索内在系统，进行更深层的自我疗愈工作",
                "recommendation_en": "Can explore internal system deeply and engage in deeper self-healing work"
            })

        return patterns

    @staticmethod
    def _score_2_3(criteria: Dict[str, Any], answers: Dict[int, int], questions: List[Any]) -> Dict[str, Any]:
        """
        Score questionnaire 2.3 - Relational Insight
        Scores by attachment patterns and dimensions
        """
        category_scores = {}

        # Group by category (attachment patterns)
        for question in questions:
            if question.question_number not in answers:
                continue

            answer_value = answers[question.question_number]
            category = question.category or "general"
            sub_section = question.sub_section or "general"

            key = f"{sub_section}_{category}"
            if key not in category_scores:
                category_scores[key] = {
                    "sub_section": sub_section,
                    "category": category,
                    "score": 0,
                    "count": 0
                }

            category_scores[key]["score"] += answer_value
            category_scores[key]["count"] += 1

        # Calculate total score
        total_score = sum(answers.values())

        # Determine dominant attachment pattern (highest score in 2.3.1)
        attachment_scores = {k: v for k, v in category_scores.items() if "2.3.1" in k}
        dominant_pattern = None
        if attachment_scores:
            dominant_key = max(attachment_scores, key=lambda k: attachment_scores[k]["score"])
            dominant_pattern = attachment_scores[dominant_key]["category"]

        return {
            "total_score": total_score,
            "interpretation": {"dominant_attachment_pattern": dominant_pattern} if dominant_pattern else None,
            "category_scores": category_scores
        }

    @staticmethod
    def _score_2_5(criteria: Dict[str, Any], answers: Dict[int, int]) -> Dict[str, Any]:
        """
        Score questionnaire 2.5 - Growth & Transformation Potential
        Uses option scores (A=1, B=3, C=5) and standardization formula
        """
        # For questionnaire 2.5, answers are already numeric (1, 3, or 5)
        # based on option selection (A, B, C)
        total_score = sum(answers.values())

        # Apply standardization formula if specified
        standardized_score = None
        if criteria and "standardization_formula" in criteria:
            # Formula: (Q1 + Q2) / 10 * 100
            # Assuming we have at least 2 questions
            if len(answers) >= 2:
                q_values = list(answers.values())
                standardized_score = (q_values[0] + q_values[1]) / 10 * 100

        return {
            "total_score": total_score,
            "standardized_score": standardized_score,
            "interpretation": None,
            "category_scores": None
        }

    @staticmethod
    def _score_admin_created(answers: Dict[int, int], questions: List[Any]) -> Dict[str, Any]:
        """
        Score admin_created questionnaire - Groups by category/sub_category

        For each answer:
        1. Look up the question
        2. Find the selected option by matching answer_value
        3. If that option has sub_category, use it; otherwise use question.category

        This handles questions like F4 where each option maps to a different subcategory.
        """
        category_scores = {}
        total_score = 0

        # Build a map of question_number -> question for quick lookup
        question_map = {q.question_number: q for q in questions}

        # Calculate scores by category
        for question_number, answer_value in answers.items():
            question = question_map.get(question_number)
            if not question:
                logger.warning(f"Question {question_number} not found in questions list")
                continue

            # Determine scoring category:
            # 1. Check if the selected option has a sub_category
            # 2. Fall back to question-level category
            scoring_category = question.category
            options = question.options or []
            for opt in options:
                if isinstance(opt, dict) and opt.get('value') == answer_value:
                    if opt.get('sub_category'):
                        scoring_category = opt['sub_category']
                        break

            if not scoring_category:
                logger.warning(f"Question {question_number} has no category, skipping")
                continue

            # Initialize category if not exists
            if scoring_category not in category_scores:
                category_scores[scoring_category] = {
                    "score": 0,
                    "count": 0,
                    "questions": []
                }

            # Add to category score
            category_scores[scoring_category]["score"] += answer_value
            category_scores[scoring_category]["count"] += 1
            category_scores[scoring_category]["questions"].append(question_number)
            total_score += answer_value

        logger.info(f"Admin questionnaire scoring: total={total_score}, categories={list(category_scores.keys())}")

        return {
            "total_score": total_score,
            "category_scores": category_scores,
            "interpretation": None
        }

    @staticmethod
    def _interpret_2_2_2_cognitive_distortions(category_scores: Dict[str, Any]) -> Dict[str, Any]:
        """
        Interpret scores for 2.2.2 subcategories (Cognitive Distortions)

        Scoring method:
        - Primary choice (必选): +2 points
        - Secondary choice (可选): +1 point
        - 5 questions total
        - Max score per distortion: 10 points (all primary) or 5 points (all secondary)

        Score interpretation per distortion:
        - 8-10: 显著偏向 (Significant bias)
        - 5-7: 中度偏向 (Moderate bias)
        - 3-4: 轻度偏向 (Mild bias)
        - 0-2: 低偏向 (Low bias)
        """
        cognitive_distortions = {
            "2.2.2.1": "过度概括 (Overgeneralization)",
            "2.2.2.2": "非黑即白 (All-or-Nothing Thinking)",
            "2.2.2.3": "灾难化 (Catastrophizing)",
            "2.2.2.4": "应该/必须 (Should/Must Statements)",
            "2.2.2.5": "自我责备 (Self-Blame)"
        }

        interpretations = {}
        distortion_scores = {}

        # Calculate scores for each cognitive distortion
        for distortion_code, distortion_name in cognitive_distortions.items():
            key = f"2.2.2_{distortion_code}"
            if key in category_scores:
                score = category_scores[key]["score"]
                distortion_scores[distortion_code] = score

                # Determine bias level
                if 8 <= score <= 10:
                    level = "显著偏向"
                    level_en = "Significant Bias"
                    description = "该自动思维模式在高压或不确定情境下极易被激活"
                    description_en = "This automatic thought pattern is highly likely to be activated under stress or uncertainty"
                    severity = "high"
                elif 5 <= score <= 7:
                    level = "中度偏向"
                    level_en = "Moderate Bias"
                    description = "在部分关键情境中易出现，建议针对性练习"
                    description_en = "Tends to appear in certain key situations, targeted practice recommended"
                    severity = "medium"
                elif 3 <= score <= 4:
                    level = "轻度偏向"
                    level_en = "Mild Bias"
                    description = "偶发；可作为自我觉察提示"
                    description_en = "Occasional; can serve as self-awareness cue"
                    severity = "low"
                else:  # 0-2
                    level = "低偏向"
                    level_en = "Low Bias"
                    description = "较少作为默认反应"
                    description_en = "Rarely used as default response"
                    severity = "minimal"

                # Get recommendation based on distortion type
                recommendation = QuestionnaireScorer._get_cd_recommendation(distortion_code)

                interpretations[distortion_code] = {
                    "distortion_name": distortion_name,
                    "score": score,
                    "level": level,
                    "level_en": level_en,
                    "description": description,
                    "description_en": description_en,
                    "severity": severity,
                    "recommendation": recommendation,
                    "score_range": [0, 10]
                }

        if not interpretations:
            return None

        # Check for tied highest scores (compound bias)
        if distortion_scores:
            max_score = max(distortion_scores.values())
            highest_distortions = [code for code, score in distortion_scores.items() if score == max_score]

            compound_bias = None
            if len(highest_distortions) > 1 and max_score >= 5:
                compound_bias = {
                    "detected": True,
                    "distortions": [cognitive_distortions[code] for code in highest_distortions],
                    "description": "存在复合偏向，建议在后续干预中优先处理影响面最广或情绪激活最强的模式",
                    "description_en": "Compound bias detected. Prioritize addressing the pattern with broadest impact or strongest emotional activation"
                }

            return {
                "type": "cognitive_distortions_analysis",
                "distortions": interpretations,
                "compound_bias": compound_bias,
                "total_questions": 5,
                "scoring_method": "主选+2分, 次选+1分"
            }

        return None

    @staticmethod
    def _get_cd_recommendation(distortion_code: str) -> Dict[str, str]:
        """Get intervention recommendation for each cognitive distortion type"""
        recommendations = {
            "2.2.2.1": {
                "zh": "证据检视：寻找反例和例外情况",
                "en": "Evidence examination: Look for counter-examples and exceptions"
            },
            "2.2.2.2": {
                "zh": "灰度思维训练：使用0-100的连续量表评估",
                "en": "Gray-scale thinking: Use 0-100 continuous scale for evaluation"
            },
            "2.2.2.3": {
                "zh": "概率估计：评估最坏情况的实际发生概率",
                "en": "Probability estimation: Assess actual likelihood of worst-case scenario"
            },
            "2.2.2.4": {
                "zh": "灵活语言替换：将'应该'改为'希望'或'可以'",
                "en": "Flexible language replacement: Replace 'should' with 'prefer' or 'could'"
            },
            "2.2.2.5": {
                "zh": "归因平衡：考虑情境因素和他人责任",
                "en": "Attribution balance: Consider situational factors and others' responsibility"
            }
        }

        return recommendations.get(distortion_code, {
            "zh": "认知重构练习",
            "en": "Cognitive restructuring practice"
        })
