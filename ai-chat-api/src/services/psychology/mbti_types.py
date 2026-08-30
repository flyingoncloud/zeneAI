"""
MBTI 16 Types Dataset

Static dataset with Chinese descriptions, strengths, growth areas,
compatible types, and cognitive functions for all 16 MBTI personality types.

Based on Jungian psychology and OEJTS (Open Extended Jungian Type Scales).
"""

MBTI_TYPES = {
    "INTJ": {
        "type": "INTJ",
        "name_zh": "建筑师",
        "name_en": "Architect",
        "tagline": "战略家",
        "cognitive_functions": "Ni-Te",
        "description": "INTJ以Ni为核心驱动力，拥有深远的战略眼光和系统性思维。他们善于构建复杂的内在模型来理解世界，并通过Te将愿景转化为高效的执行计划。独立、果断、追求卓越，他们是天生的系统设计者。",
        "strengths": [
            "卓越的战略规划和系统思维能力",
            "独立思考，不受外界干扰",
            "高度自律和目标导向",
            "善于发现模式和预测趋势",
            "追求知识和持续自我提升"
        ],
        "growth_areas": [
            "可能忽视他人的情感需求",
            "对自己和他人要求过高",
            "可能显得冷漠或难以接近",
            "不善于处理即时的感官体验",
            "需要学习更灵活地适应变化"
        ],
        "compatible_types": ["ENFP", "ENTP", "INFJ"],
    },
    "INTP": {
        "type": "INTP",
        "name_zh": "逻辑学家",
        "name_en": "Logician",
        "tagline": "思想家",
        "cognitive_functions": "Ti-Ne",
        "description": "INTP以Ti为核心，追求逻辑的纯粹性和理论的完美。他们的思维如同精密的分析引擎，不断解构和重建概念框架。Ne赋予他们无限的好奇心和创造力，使他们成为出色的问题解决者和创新者。",
        "strengths": [
            "卓越的逻辑分析和抽象思维",
            "强烈的求知欲和学习能力",
            "创造性地解决复杂问题",
            "客观公正，不受偏见影响",
            "善于发现系统中的漏洞和矛盾"
        ],
        "growth_areas": [
            "可能过度分析而延迟行动",
            "社交互动中可能显得笨拙",
            "容易忽视实际细节和日常事务",
            "表达情感时可能感到困难",
            "需要学习将想法转化为行动"
        ],
        "compatible_types": ["ENTJ", "ENFJ", "INFJ"],
    },
    "ENTJ": {
        "type": "ENTJ",
        "name_zh": "指挥官",
        "name_en": "Commander",
        "tagline": "执行者",
        "cognitive_functions": "Te-Ni",
        "description": "ENTJ以Te为驱动力组织外部世界以实现最高效率，同时Ni提供战略远见和长期愿景。他们是天生的执行者，将系统视为需要优化的拼图，将挑战视为展示能力的机会。果断而直接，他们调动资源和人员朝着宏大目标前进。",
        "strengths": [
            "卓越的组织和战略规划能力",
            "天生的领导力和调动团队的能力",
            "果断行动和高效解决问题",
            "长期愿景与务实执行的结合",
            "高度自信和压力下的韧性"
        ],
        "growth_areas": [
            "可能忽视自己和他人的情感需求",
            "可能显得专横或不敏感",
            "对低效行为缺乏耐心",
            "倾向于将结果置于关系之上",
            "难以承认个人脆弱性"
        ],
        "compatible_types": ["INTP", "INFP", "ISTP"],
    },
    "ENTP": {
        "type": "ENTP",
        "name_zh": "辩论家",
        "name_en": "Debater",
        "tagline": "创新者",
        "cognitive_functions": "Ne-Ti",
        "description": "ENTP以Ne为核心，不断探索新的可能性和创意连接。他们的思维敏捷而跳跃，善于从不同角度审视问题。Ti赋予他们严密的逻辑能力，使他们成为出色的辩论者和创新推动者。",
        "strengths": [
            "思维敏捷，善于即兴发挥",
            "强大的创新和头脑风暴能力",
            "善于从多角度分析问题",
            "适应力强，享受变化和挑战",
            "富有魅力的沟通和说服能力"
        ],
        "growth_areas": [
            "可能难以坚持完成长期项目",
            "容易对常规和细节感到厌倦",
            "辩论时可能伤害他人感受",
            "需要学习更好地管理时间和精力",
            "可能回避深层的情感问题"
        ],
        "compatible_types": ["INTJ", "INFJ", "INTP"],
    },
    "INFJ": {
        "type": "INFJ",
        "name_zh": "提倡者",
        "name_en": "Advocate",
        "tagline": "理想主义者",
        "cognitive_functions": "Ni-Fe",
        "description": "INFJ以Ni为核心，拥有深刻的洞察力和对人性的理解。Fe使他们天生关注他人的情感需求和社会和谐。他们是理想主义者，致力于帮助他人实现潜能，同时追求有意义的人生目标。",
        "strengths": [
            "深刻的洞察力和直觉判断",
            "强烈的同理心和关怀他人的能力",
            "坚定的价值观和使命感",
            "创造性地解决人际问题",
            "善于激励和引导他人成长"
        ],
        "growth_areas": [
            "可能过度理想化他人和关系",
            "容易因他人的痛苦而情感耗竭",
            "可能回避冲突而压抑自己的需求",
            "对批评过于敏感",
            "需要学习设定健康的边界"
        ],
        "compatible_types": ["ENTP", "ENFP", "INTJ"],
    },
    "INFP": {
        "type": "INFP",
        "name_zh": "调停者",
        "name_en": "Mediator",
        "tagline": "治愈者",
        "cognitive_functions": "Fi-Ne",
        "description": "INFP以Fi为核心，拥有丰富的内在情感世界和坚定的个人价值观。Ne赋予他们无限的想象力和对可能性的探索。他们是温柔的理想主义者，追求真实和有意义的生活，善于通过创造性表达传递深层情感。",
        "strengths": [
            "丰富的想象力和创造力",
            "深刻的同理心和理解他人的能力",
            "坚定的个人价值观和真实性",
            "善于通过艺术和文字表达情感",
            "对他人的痛苦有天然的敏感和关怀"
        ],
        "growth_areas": [
            "可能过于理想化而脱离现实",
            "容易陷入自我怀疑和完美主义",
            "可能回避冲突和困难的对话",
            "需要学习更好地管理日常事务",
            "可能过度关注内在世界而忽视外部需求"
        ],
        "compatible_types": ["ENTJ", "ENFJ", "INTJ"],
    },
    "ENFJ": {
        "type": "ENFJ",
        "name_zh": "主人公",
        "name_en": "Protagonist",
        "tagline": "引导者",
        "cognitive_functions": "Fe-Ni",
        "description": "ENFJ以Fe为核心，天生关注他人的需求和群体的和谐。Ni赋予他们对人性的深刻理解和对未来的远见。他们是天生的领导者和激励者，善于发现他人的潜能并帮助其实现。",
        "strengths": [
            "卓越的人际沟通和领导能力",
            "强烈的同理心和关怀他人的热情",
            "善于激励和引导团队",
            "对人际动态有敏锐的洞察",
            "坚定的价值观和使命感"
        ],
        "growth_areas": [
            "可能过度关注他人而忽视自己",
            "容易因他人的问题而情感耗竭",
            "可能过于在意他人的评价",
            "需要学习接受不完美",
            "可能回避必要的冲突和批评"
        ],
        "compatible_types": ["INTP", "INFP", "ISFP"],
    },
    "ENFP": {
        "type": "ENFP",
        "name_zh": "竞选者",
        "name_en": "Campaigner",
        "tagline": "探索者",
        "cognitive_functions": "Ne-Fi",
        "description": "ENFP以Ne为核心，充满热情地探索生活中的无限可能。Fi赋予他们深刻的个人价值观和对真实性的追求。他们是充满活力的创意者，善于连接人与想法，用热情感染周围的人。",
        "strengths": [
            "充满热情和感染力",
            "卓越的创造力和想象力",
            "善于建立人际连接和激励他人",
            "适应力强，享受新体验",
            "对人性有深刻的理解和同理心"
        ],
        "growth_areas": [
            "可能难以坚持完成长期项目",
            "容易分散注意力，追逐新鲜事物",
            "可能过度承诺而无法兑现",
            "需要学习更好地管理时间和优先级",
            "可能回避必要的常规和结构"
        ],
        "compatible_types": ["INTJ", "INFJ", "INTP"],
    },
    "ISTJ": {
        "type": "ISTJ",
        "name_zh": "物流师",
        "name_en": "Logistician",
        "tagline": "守护者",
        "cognitive_functions": "Si-Te",
        "description": "ISTJ以Si为核心，重视传统、秩序和可靠性。Te赋予他们高效的组织和执行能力。他们是社会的基石，以责任感和勤勉著称，确保系统和流程的稳定运行。",
        "strengths": [
            "高度可靠和负责任",
            "出色的组织和执行能力",
            "注重细节和准确性",
            "坚定的职业道德和毅力",
            "善于建立和维护稳定的系统"
        ],
        "growth_areas": [
            "可能过于固守传统和规则",
            "对变化和新方法可能抵触",
            "表达情感时可能感到困难",
            "可能对他人的不同做法缺乏耐心",
            "需要学习更灵活地适应新情境"
        ],
        "compatible_types": ["ESFP", "ESTP", "ISFJ"],
    },
    "ISFJ": {
        "type": "ISFJ",
        "name_zh": "守卫者",
        "name_en": "Defender",
        "tagline": "保护者",
        "cognitive_functions": "Si-Fe",
        "description": "ISFJ以Si为核心，珍视传统和稳定，同时Fe使他们天生关注他人的需求。他们是温暖而可靠的守护者，默默地为他人提供支持和关怀，确保周围人的舒适和安全。",
        "strengths": [
            "温暖、体贴、善于照顾他人",
            "高度可靠和负责任",
            "出色的记忆力和对细节的关注",
            "忠诚和奉献精神",
            "善于创造温馨和谐的环境"
        ],
        "growth_areas": [
            "可能过度牺牲自己满足他人",
            "难以拒绝他人的请求",
            "可能回避冲突而积累不满",
            "对变化可能感到不安",
            "需要学习表达自己的需求"
        ],
        "compatible_types": ["ESTP", "ESFP", "ISTJ"],
    },
    "ESTJ": {
        "type": "ESTJ",
        "name_zh": "总经理",
        "name_en": "Executive",
        "tagline": "管理者",
        "cognitive_functions": "Te-Si",
        "description": "ESTJ以Te为核心，追求效率和秩序。Si赋予他们对传统和经验的尊重。他们是天生的管理者，善于建立规则和流程，确保团队和组织的高效运转。",
        "strengths": [
            "卓越的组织和管理能力",
            "果断、高效、注重结果",
            "强烈的责任感和职业道德",
            "善于建立和执行规则",
            "可靠的领导力和决策能力"
        ],
        "growth_areas": [
            "可能过于固执和控制",
            "对他人的情感需求可能不够敏感",
            "可能难以接受不同的做事方式",
            "需要学习更多的灵活性和耐心",
            "可能忽视创新和变革的需要"
        ],
        "compatible_types": ["ISTP", "ISFP", "INTP"],
    },
    "ESFJ": {
        "type": "ESFJ",
        "name_zh": "执政官",
        "name_en": "Consul",
        "tagline": "关怀者",
        "cognitive_functions": "Fe-Si",
        "description": "ESFJ以Fe为核心，天生关注他人的需求和社会和谐。Si赋予他们对传统和稳定的重视。他们是社交的纽带，善于创造温暖的社区氛围，确保每个人都感到被关心和包容。",
        "strengths": [
            "出色的社交能力和人际关怀",
            "善于创造和谐的团队氛围",
            "高度可靠和负责任",
            "对他人的需求有敏锐的觉察",
            "忠诚、热情、乐于助人"
        ],
        "growth_areas": [
            "可能过于在意他人的评价",
            "难以处理冲突和批评",
            "可能过度牺牲自己满足他人",
            "对变化和不确定性可能感到焦虑",
            "需要学习更独立地做决定"
        ],
        "compatible_types": ["ISTP", "ISFP", "ESTP"],
    },
    "ISTP": {
        "type": "ISTP",
        "name_zh": "鉴赏家",
        "name_en": "Virtuoso",
        "tagline": "工匠",
        "cognitive_functions": "Ti-Se",
        "description": "ISTP以Ti为核心，善于分析和理解事物的运作原理。Se赋予他们对当下体验的敏锐感知和动手能力。他们是冷静的问题解决者，在危机中保持镇定，善于用最少的资源找到最有效的解决方案。",
        "strengths": [
            "出色的问题解决和动手能力",
            "冷静、理性、善于分析",
            "适应力强，善于应对危机",
            "独立自主，不依赖他人",
            "对机械和技术有天然的理解力"
        ],
        "growth_areas": [
            "可能显得冷漠或难以接近",
            "表达情感时可能感到困难",
            "可能回避长期承诺和计划",
            "对常规和规则可能缺乏耐心",
            "需要学习更好地沟通自己的需求"
        ],
        "compatible_types": ["ESTJ", "ENTJ", "ESFJ"],
    },
    "ISFP": {
        "type": "ISFP",
        "name_zh": "探险家",
        "name_en": "Adventurer",
        "tagline": "艺术家",
        "cognitive_functions": "Fi-Se",
        "description": "ISFP以Fi为核心，拥有丰富的内在情感世界和坚定的个人价值观。Se赋予他们对美和感官体验的敏锐感知。他们是温柔的艺术家，通过行动和创造表达内心深处的情感。",
        "strengths": [
            "丰富的审美感和创造力",
            "温柔、体贴、善于关怀他人",
            "活在当下，享受感官体验",
            "坚定的个人价值观和真实性",
            "适应力强，灵活应对变化"
        ],
        "growth_areas": [
            "可能回避冲突和困难的对话",
            "难以进行长期规划",
            "可能过于敏感而容易受伤",
            "需要学习更好地表达自己的需求",
            "可能低估自己的能力和价值"
        ],
        "compatible_types": ["ENFJ", "ESFJ", "ESTJ"],
    },
    "ESTP": {
        "type": "ESTP",
        "name_zh": "企业家",
        "name_en": "Entrepreneur",
        "tagline": "行动者",
        "cognitive_functions": "Se-Ti",
        "description": "ESTP以Se为核心，活在当下，善于捕捉机会和应对挑战。Ti赋予他们快速分析和决策的能力。他们是天生的行动者，在高压环境中表现出色，善于用实际行动解决问题。",
        "strengths": [
            "出色的行动力和执行力",
            "善于捕捉机会和应对危机",
            "社交能力强，富有魅力",
            "务实、灵活、适应力强",
            "善于在压力下保持冷静"
        ],
        "growth_areas": [
            "可能忽视长期后果和规划",
            "容易感到无聊和不耐烦",
            "可能冲动行事而不考虑后果",
            "对他人的情感需求可能不够敏感",
            "需要学习更多的耐心和坚持"
        ],
        "compatible_types": ["ISFJ", "ISTJ", "INFJ"],
    },
    "ESFP": {
        "type": "ESFP",
        "name_zh": "表演者",
        "name_en": "Entertainer",
        "tagline": "表演家",
        "cognitive_functions": "Se-Fi",
        "description": "ESFP以Se为核心，热爱生活中的每一刻体验。Fi赋予他们真实的情感表达和对他人的关怀。他们是天生的表演者，用热情和活力感染周围的人，善于创造欢乐和温暖的氛围。",
        "strengths": [
            "充满活力和感染力",
            "善于创造欢乐的氛围",
            "出色的社交能力和亲和力",
            "活在当下，享受生活",
            "对他人的情感有天然的敏感"
        ],
        "growth_areas": [
            "可能难以进行长期规划",
            "容易分散注意力",
            "可能回避严肃和深层的话题",
            "需要学习更好地管理财务和时间",
            "可能过于追求即时满足"
        ],
        "compatible_types": ["ISTJ", "ISFJ", "INTJ"],
    },
}


def get_mbti_type_info(mbti_type: str) -> dict:
    """
    Get full type info for a given MBTI type code.

    Args:
        mbti_type: 4-letter MBTI code (e.g., 'INFP')

    Returns:
        Type info dict, or a default dict if type not found
    """
    return MBTI_TYPES.get(mbti_type.upper(), {
        "type": mbti_type,
        "name_zh": "未知类型",
        "name_en": "Unknown Type",
        "tagline": "",
        "cognitive_functions": "",
        "description": "无法识别的MBTI类型。",
        "strengths": [],
        "growth_areas": [],
        "compatible_types": [],
    })
