// 沙具元数据。symbolism 是 AI 分析的主要输入；rot0 / yaw0 修正个别模型的导出朝向（度）；ver 为模型版本号。

import type { FigureCategory } from "@/types/sandtray"

export type FigureMeta = {
  id: string
  name: string
  category: FigureCategory
  symbolism: string[]
  // 英文界面用；英文报告的 prompt 必须用英文象征词
  nameEn: string
  symbolismEn: string[]
  // 目标高度（沙盘单位，人 = 1.8）。按压缩后的真实比例，小物件设下限，否则难以拖拽
  size: number
  // 宽度上限：彩虹、花园这类宽而矮的沙具，按高度缩放会铺满整个沙盘
  maxWidth?: number
  glb: string
  thumb?: string
  rot0?: [number, number, number]
  yaw0?: number
  ver: number
}

export const figures: FigureMeta[] = [
  {
    "id": "m_52e5b29b5fe4",
    "name": "工人",
    "category": "人物",
    "symbolism": [
      "劳动",
      "务实",
      "动手能力",
      "脚踏实地",
      "坚韧"
    ],
    "nameEn": "Worker",
    "symbolismEn": [
      "Labour",
      "Pragmatism",
      "Hands-on ability",
      "Down-to-earth",
      "Resilience"
    ],
    "size": 1.8,
    "glb": "/figures/models/m_52e5b29b5fe4.glb",
    "thumb": "/figures/thumbs/m_52e5b29b5fe4.webp",
    "ver": 1
  },
  {
    "id": "m_52e5b29b5fe5",
    "name": "大象",
    "category": "动物",
    "symbolism": [
      "力量",
      "稳重",
      "记忆",
      "守护与家族",
      "负重前行"
    ],
    "nameEn": "Elephant",
    "symbolismEn": [
      "Strength",
      "Steadiness",
      "Memory",
      "Protection & family",
      "Carrying burdens onward"
    ],
    "size": 2.3,
    "glb": "/figures/models/m_52e5b29b5fe5.glb",
    "thumb": "/figures/thumbs/m_52e5b29b5fe5.webp",
    "ver": 2
  },
  {
    "id": "m_52e5b29b5fe5t",
    "name": "指南针",
    "category": "工具",
    "symbolism": [
      "方向",
      "定位",
      "寻路",
      "自我导航"
    ],
    "nameEn": "Compass",
    "symbolismEn": [
      "Direction",
      "Positioning",
      "Wayfinding",
      "Self-navigation"
    ],
    "size": 0.75,
    "glb": "/figures/models/m_52e5b29b5fe5t.glb",
    "thumb": "/figures/thumbs/m_52e5b29b5fe5t.webp",
    "ver": 2
  },
  {
    "id": "m_52e5b29b5fe5b",
    "name": "灯塔",
    "category": "建筑",
    "symbolism": [
      "指引",
      "希望",
      "迷茫中的定位",
      "孤独守望"
    ],
    "nameEn": "Lighthouse",
    "symbolismEn": [
      "Guidance",
      "Hope",
      "Bearings when lost",
      "Solitary vigil"
    ],
    "size": 4.2,
    "glb": "/figures/models/m_52e5b29b5fe5b.glb",
    "thumb": "/figures/thumbs/m_52e5b29b5fe5b.webp",
    "ver": 2
  },
  {
    "id": "m_52e5b29b5fe8",
    "name": "山脉",
    "category": "自然",
    "symbolism": [
      "阻碍与挑战",
      "稳固",
      "可攀登的目标",
      "坚韧"
    ],
    "nameEn": "Mountain range",
    "symbolismEn": [
      "Obstacles and challenges",
      "Stability",
      "Climbable goals",
      "Resilience"
    ],
    "size": 2.6,
    "glb": "/figures/models/m_52e5b29b5fe8.glb",
    "thumb": "/figures/thumbs/m_52e5b29b5fe8.webp",
    "maxWidth": 5.0,
    "ver": 4
  },
  {
    "id": "m_49e5b29b5fe4",
    "name": "医生",
    "category": "人物",
    "symbolism": [
      "疗愈",
      "专业权威",
      "求助与被照顾的需要",
      "对身体的关注"
    ],
    "nameEn": "Doctor",
    "symbolismEn": [
      "Healing",
      "Professional authority",
      "Need for help & care",
      "Attention to the body"
    ],
    "size": 1.8,
    "glb": "/figures/models/m_49e5b29b5fe4.glb",
    "thumb": "/figures/thumbs/m_49e5b29b5fe4.webp",
    "yaw0": 249,
    "ver": 1
  },
  {
    "id": "m_49e5b29b5fe5",
    "name": "海豚",
    "category": "动物",
    "symbolism": [
      "智慧",
      "灵性",
      "沟通",
      "亲和",
      "与水/情感的联结"
    ],
    "nameEn": "Dolphin",
    "symbolismEn": [
      "Intelligence",
      "Spirituality",
      "Communication",
      "Warmth",
      "Bond with water & emotion"
    ],
    "size": 1.5,
    "glb": "/figures/models/m_49e5b29b5fe5.glb",
    "thumb": "/figures/thumbs/m_49e5b29b5fe5.webp",
    "ver": 2
  },
  {
    "id": "m_49e5b29b5fe5t",
    "name": "显微镜",
    "category": "工具",
    "symbolism": [
      "探究",
      "洞察",
      "审视细节",
      "求真"
    ],
    "nameEn": "Microscope",
    "symbolismEn": [
      "Inquiry",
      "Insight",
      "Scrutiny of detail",
      "Seeking truth"
    ],
    "size": 1.0,
    "glb": "/figures/models/m_49e5b29b5fe5t.glb",
    "thumb": "/figures/thumbs/m_49e5b29b5fe5t.webp",
    "ver": 2
  },
  {
    "id": "m_49e5b29b5fe5b",
    "name": "天文台",
    "category": "建筑",
    "symbolism": [
      "探索未知",
      "远见",
      "超越性思考",
      "仰望"
    ],
    "nameEn": "Observatory",
    "symbolismEn": [
      "Exploring the unknown",
      "Vision",
      "Transcendent thinking",
      "Looking upward"
    ],
    "size": 2.9,
    "glb": "/figures/models/m_49e5b29b5fe5b.glb",
    "thumb": "/figures/thumbs/m_49e5b29b5fe5b.webp",
    "ver": 3
  },
  {
    "id": "m_49e5b29b5fe8",
    "name": "火山",
    "category": "自然",
    "symbolism": [
      "压抑的情绪",
      "爆发",
      "内在能量",
      "危险与转化"
    ],
    "nameEn": "Volcano",
    "symbolismEn": [
      "Suppressed emotions",
      "Eruption",
      "Inner energy",
      "Danger and transformation"
    ],
    "size": 2.2,
    "glb": "/figures/models/m_49e5b29b5fe8.glb",
    "thumb": "/figures/thumbs/m_49e5b29b5fe8.webp",
    "maxWidth": 4.5,
    "ver": 3
  },
  {
    "id": "m_41e5b29b5fe4",
    "name": "艺术家",
    "category": "人物",
    "symbolism": [
      "创造力",
      "自我表达",
      "想象",
      "个性与审美"
    ],
    "nameEn": "Artist",
    "symbolismEn": [
      "Creativity",
      "Self-expression",
      "Imagination",
      "Individuality & aesthetics"
    ],
    "size": 1.8,
    "glb": "/figures/models/m_41e5b29b5fe4.glb",
    "thumb": "/figures/thumbs/m_41e5b29b5fe4.webp",
    "yaw0": 270,
    "ver": 1
  },
  {
    "id": "m_41e5b29b5fe5",
    "name": "孔雀",
    "category": "动物",
    "symbolism": [
      "展示",
      "自尊",
      "被看见的渴望",
      "美与虚荣"
    ],
    "nameEn": "Peacock",
    "symbolismEn": [
      "Display",
      "Self-esteem",
      "Desire to be seen",
      "Beauty & vanity"
    ],
    "size": 1.45,
    "glb": "/figures/models/m_41e5b29b5fe5.glb",
    "thumb": "/figures/thumbs/m_41e5b29b5fe5.webp",
    "ver": 3
  },
  {
    "id": "m_41e5b29b5fe5t",
    "name": "钢琴",
    "category": "工具",
    "symbolism": [
      "情感表达",
      "训练与天赋",
      "内在旋律"
    ],
    "nameEn": "Piano",
    "symbolismEn": [
      "Emotional expression",
      "Training & talent",
      "Inner melody"
    ],
    "size": 1.5,
    "glb": "/figures/models/m_41e5b29b5fe5t.glb",
    "thumb": "/figures/thumbs/m_41e5b29b5fe5t.webp",
    "ver": 3
  },
  {
    "id": "m_41e5b29b5fe5b",
    "name": "剧院",
    "category": "建筑",
    "symbolism": [
      "表演",
      "角色与面具",
      "被观看",
      "公共自我"
    ],
    "nameEn": "Theatre",
    "symbolismEn": [
      "Performance",
      "Roles and masks",
      "Being watched",
      "Public self"
    ],
    "size": 2.4,
    "glb": "/figures/models/m_41e5b29b5fe5b.glb",
    "thumb": "/figures/thumbs/m_41e5b29b5fe5b.webp",
    "maxWidth": 4.5,
    "ver": 3
  },
  {
    "id": "m_41e5b29b5fe8",
    "name": "彩虹",
    "category": "自然",
    "symbolism": [
      "希望",
      "雨后转机",
      "多样性",
      "短暂的美好"
    ],
    "nameEn": "Rainbow",
    "symbolismEn": [
      "Hope",
      "A turn for the better after rain",
      "Diversity",
      "Fleeting beauty"
    ],
    "size": 2.4,
    "glb": "/figures/models/m_41e5b29b5fe8.glb",
    "thumb": "/figures/thumbs/m_41e5b29b5fe8.webp",
    "maxWidth": 5.0,
    "ver": 2
  },
  {
    "id": "m_53e5b29b5fe4",
    "name": "老师",
    "category": "人物",
    "symbolism": [
      "引导",
      "权威与关怀",
      "传承",
      "被教导的经验"
    ],
    "nameEn": "Teacher",
    "symbolismEn": [
      "Guidance",
      "Authority & care",
      "Passing on knowledge",
      "Experience of being taught"
    ],
    "size": 1.8,
    "glb": "/figures/models/m_53e5b29b5fe4.glb",
    "thumb": "/figures/thumbs/m_53e5b29b5fe4.webp",
    "yaw0": 270,
    "ver": 1
  },
  {
    "id": "m_53e5b29b5fe5",
    "name": "狗",
    "category": "动物",
    "symbolism": [
      "忠诚",
      "陪伴",
      "无条件的爱",
      "安全依恋"
    ],
    "nameEn": "Dog",
    "symbolismEn": [
      "Loyalty",
      "Companionship",
      "Unconditional love",
      "Secure attachment"
    ],
    "size": 0.95,
    "glb": "/figures/models/m_53e5b29b5fe5.glb",
    "thumb": "/figures/thumbs/m_53e5b29b5fe5.webp",
    "ver": 2
  },
  {
    "id": "m_53e5b29b5fe5t",
    "name": "电话",
    "category": "工具",
    "symbolism": [
      "沟通",
      "连接",
      "求助",
      "与外界的联系"
    ],
    "nameEn": "Telephone",
    "symbolismEn": [
      "Communication",
      "Connection",
      "Reaching out for help",
      "Contact with the outside world"
    ],
    "size": 0.7,
    "glb": "/figures/models/m_53e5b29b5fe5t.glb",
    "thumb": "/figures/thumbs/m_53e5b29b5fe5t.webp",
    "ver": 2
  },
  {
    "id": "m_53e5b29b5fe5b",
    "name": "医院",
    "category": "建筑",
    "symbolism": [
      "疗愈与修复的渴望",
      "脆弱与创伤",
      "对帮助的需要"
    ],
    "nameEn": "Hospital",
    "symbolismEn": [
      "Longing for healing & repair",
      "Vulnerability & trauma",
      "Need for help"
    ],
    "size": 2.6,
    "glb": "/figures/models/m_53e5b29b5fe5b.glb",
    "thumb": "/figures/thumbs/m_53e5b29b5fe5b.webp",
    "ver": 1
  },
  {
    "id": "m_e88ab1e59bad",
    "name": "花园",
    "category": "自然",
    "symbolism": [
      "生命力",
      "成长",
      "内在滋养",
      "安全美好的心理空间"
    ],
    "nameEn": "Garden",
    "symbolismEn": [
      "Vitality",
      "Growth",
      "Inner nourishment",
      "A safe, beautiful inner space"
    ],
    "size": 4.0,
    "glb": "/figures/models/m_e88ab1e59bad.glb",
    "thumb": "/figures/thumbs/m_e88ab1e59bad.webp",
    "maxWidth": 5.5,
    "ver": 2
  },
  {
    "id": "m_45e5b29b5fe4",
    "name": "企业家",
    "category": "人物",
    "symbolism": [
      "主导",
      "野心",
      "掌控",
      "风险承担"
    ],
    "nameEn": "Entrepreneur",
    "symbolismEn": [
      "Leadership",
      "Ambition",
      "Control",
      "Risk-taking"
    ],
    "size": 1.8,
    "glb": "/figures/models/m_45e5b29b5fe4.glb",
    "thumb": "/figures/thumbs/m_45e5b29b5fe4.webp",
    "ver": 1
  },
  {
    "id": "m_45e5b29b5fe5",
    "name": "狮子",
    "category": "动物",
    "symbolism": [
      "权力",
      "勇气",
      "支配",
      "领地与威严"
    ],
    "nameEn": "Lion",
    "symbolismEn": [
      "Power",
      "Courage",
      "Dominance",
      "Territory & majesty"
    ],
    "size": 1.5,
    "glb": "/figures/models/m_45e5b29b5fe5.glb",
    "thumb": "/figures/thumbs/m_45e5b29b5fe5.webp",
    "yaw0": -35,
    "ver": 2
  },
  {
    "id": "m_45e5b29b5fe5t",
    "name": "奖杯",
    "category": "工具",
    "symbolism": [
      "成就",
      "被认可的渴望",
      "竞争",
      "价值证明"
    ],
    "nameEn": "Trophy",
    "symbolismEn": [
      "Achievement",
      "Desire for recognition",
      "Competition",
      "Proof of worth"
    ],
    "size": 0.9,
    "glb": "/figures/models/m_45e5b29b5fe5t.glb",
    "thumb": "/figures/thumbs/m_45e5b29b5fe5t.webp",
    "ver": 2
  },
  {
    "id": "m_45e5b29b5fe5b",
    "name": "摩天大楼",
    "category": "建筑",
    "symbolism": [
      "野心",
      "地位",
      "向上攀升",
      "都市压力"
    ],
    "nameEn": "Skyscraper",
    "symbolismEn": [
      "Ambition",
      "Status",
      "Climbing upward",
      "Urban pressure"
    ],
    "size": 4.8,
    "glb": "/figures/models/m_45e5b29b5fe5b.glb",
    "thumb": "/figures/thumbs/m_45e5b29b5fe5b.webp",
    "ver": 2
  },
  {
    "id": "m_45e5b29b5fe8",
    "name": "火焰",
    "category": "自然",
    "symbolism": [
      "激情",
      "能量",
      "愤怒",
      "毁灭与重生"
    ],
    "nameEn": "Flame",
    "symbolismEn": [
      "Passion",
      "Energy",
      "Anger",
      "Destruction & rebirth"
    ],
    "size": 1.35,
    "glb": "/figures/models/m_45e5b29b5fe8.glb",
    "thumb": "/figures/thumbs/m_45e5b29b5fe8.webp",
    "ver": 2
  },
  {
    "id": "m_43e5b29b5fe4",
    "name": "财务人员",
    "category": "人物",
    "symbolism": [
      "秩序",
      "精确",
      "责任",
      "现实与规则"
    ],
    "nameEn": "Accountant",
    "symbolismEn": [
      "Order",
      "Precision",
      "Responsibility",
      "Reality & rules"
    ],
    "size": 1.8,
    "glb": "/figures/models/m_43e5b29b5fe4.glb",
    "thumb": "/figures/thumbs/m_43e5b29b5fe4.webp",
    "yaw0": 270,
    "ver": 1
  },
  {
    "id": "m_43e5b29b5fe5",
    "name": "蜜蜂",
    "category": "动物",
    "symbolism": [
      "勤劳",
      "集体",
      "分工与秩序",
      "被规训"
    ],
    "nameEn": "Bee",
    "symbolismEn": [
      "Hard work",
      "Collective",
      "Division of labour and order",
      "Being disciplined"
    ],
    "size": 0.65,
    "glb": "/figures/models/m_43e5b29b5fe5.glb",
    "thumb": "/figures/thumbs/m_43e5b29b5fe5.webp",
    "ver": 4
  },
  {
    "id": "m_43e5b29b5fe5t",
    "name": "计算器",
    "category": "工具",
    "symbolism": [
      "理性",
      "计算",
      "精确",
      "去情感化"
    ],
    "nameEn": "Calculator",
    "symbolismEn": [
      "Rationality",
      "Calculation",
      "Precision",
      "De-emotionalisation"
    ],
    "size": 0.65,
    "glb": "/figures/models/m_43e5b29b5fe5t.glb",
    "thumb": "/figures/thumbs/m_43e5b29b5fe5t.webp",
    "ver": 2
  },
  {
    "id": "m_43e5b29b5fe5b",
    "name": "银行",
    "category": "建筑",
    "symbolism": [
      "安全感",
      "资源与掌控",
      "价值储存",
      "现实与金钱压力"
    ],
    "nameEn": "Bank",
    "symbolismEn": [
      "Sense of security",
      "Resources and control",
      "Storing value",
      "Money pressure"
    ],
    "size": 2.6,
    "glb": "/figures/models/m_43e5b29b5fe5b.glb",
    "thumb": "/figures/thumbs/m_43e5b29b5fe5b.webp",
    "maxWidth": 3.6,
    "ver": 2
  },
  {
    "id": "m_43e5b29b5fe8",
    "name": "梯田",
    "category": "自然",
    "symbolism": [
      "秩序化的自然",
      "耕耘",
      "循序渐进",
      "人为规划"
    ],
    "nameEn": "Terraced Fields",
    "symbolismEn": [
      "Ordered nature",
      "Cultivation",
      "Step by step",
      "Human planning"
    ],
    "size": 1.4,
    "glb": "/figures/models/m_43e5b29b5fe8.glb",
    "thumb": "/figures/thumbs/m_43e5b29b5fe8.webp",
    "maxWidth": 5.0,
    "ver": 3
  },
  {
    "id": "upm_mu5vzjb11rm",
    "name": "公寓楼",
    "category": "建筑",
    "symbolism": [
      "城市生活",
      "密集",
      "归属与匿名",
      "现代感"
    ],
    "nameEn": "Apartment block",
    "symbolismEn": [
      "City life",
      "Density",
      "Belonging and anonymity",
      "Modernity"
    ],
    "size": 3.4,
    "glb": "/figures/models/upm_mu5vzjb11rm.glb",
    "thumb": "/figures/thumbs/upm_mu5vzjb11rm.webp",
    "ver": 2
  },
  {
    "id": "upm_mu5vzk9w522",
    "name": "公路",
    "category": "建筑",
    "symbolism": [
      "路径",
      "方向",
      "过渡",
      "行动力"
    ],
    "nameEn": "Road",
    "symbolismEn": [
      "Path",
      "Direction",
      "Transition",
      "Drive to act"
    ],
    "size": 1.4,
    "glb": "/figures/models/upm_mu5vzk9w522.glb",
    "thumb": "/figures/thumbs/upm_mu5vzk9w522.webp",
    "maxWidth": 4.0,
    "ver": 1
  },
  {
    "id": "upm_mu5vzkoy6i9",
    "name": "围墙",
    "category": "建筑",
    "symbolism": [
      "边界",
      "防御",
      "隔离",
      "自我保护"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mu5vzkoy6i9.glb",
    "thumb": "/figures/thumbs/upm_mu5vzkoy6i9.webp",
    "maxWidth": 4.0,
    "ver": 3
  },
  {
    "id": "upm_mu5vzl3p2kk",
    "name": "大刀",
    "category": "工具",
    "symbolism": [
      "攻击性",
      "力量",
      "切割",
      "决断"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.0,
    "glb": "/figures/models/upm_mu5vzl3p2kk.glb",
    "thumb": "/figures/thumbs/upm_mu5vzl3p2kk.webp",
    "ver": 2
  },
  {
    "id": "upm_mu5vzlk36jl",
    "name": "小木屋",
    "category": "建筑",
    "symbolism": [
      "退隐",
      "独处",
      "自然中的家",
      "安全感"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 2.0,
    "glb": "/figures/models/upm_mu5vzlk36jl.glb",
    "thumb": "/figures/thumbs/upm_mu5vzlk36jl.webp",
    "maxWidth": 2.8,
    "ver": 3
  },
  {
    "id": "upm_mu5vzm0x1xb",
    "name": "小船",
    "category": "工具",
    "symbolism": [
      "航行",
      "探索",
      "离开",
      "漂泊"
    ],
    "nameEn": "Small boat",
    "symbolismEn": [
      "Sailing",
      "Exploration",
      "Leaving",
      "Drifting"
    ],
    "size": 1.4,
    "glb": "/figures/models/upm_mu5vzm0x1xb.glb",
    "thumb": "/figures/thumbs/upm_mu5vzm0x1xb.webp",
    "maxWidth": 2.4,
    "ver": 2
  },
  {
    "id": "upm_mu5vzmg145e",
    "name": "岩石",
    "category": "自然",
    "symbolism": [
      "阻碍",
      "稳固",
      "坚硬",
      "难以撼动"
    ],
    "nameEn": "Rock",
    "symbolismEn": [
      "Obstacle",
      "Stability",
      "Hardness",
      "Immovable"
    ],
    "size": 0.9,
    "glb": "/figures/models/upm_mu5vzmg145e.glb",
    "thumb": "/figures/thumbs/upm_mu5vzmg145e.webp",
    "maxWidth": 1.6,
    "ver": 2
  },
  {
    "id": "upm_mu5vzmv174q",
    "name": "摩托车",
    "category": "工具",
    "symbolism": [
      "速度",
      "自由",
      "冒险",
      "失控"
    ],
    "nameEn": "Motorcycle",
    "symbolismEn": [
      "Speed",
      "Freedom",
      "Adventure",
      "Losing control"
    ],
    "size": 1.2,
    "glb": "/figures/models/upm_mu5vzmv174q.glb",
    "thumb": "/figures/thumbs/upm_mu5vzmv174q.webp",
    "maxWidth": 2.0,
    "ver": 2
  },
  {
    "id": "upm_mu5vznq74bm",
    "name": "栅栏",
    "category": "建筑",
    "symbolism": [
      "界限",
      "区隔",
      "有限的保护"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.0,
    "glb": "/figures/models/upm_mu5vznq74bm.glb",
    "thumb": "/figures/thumbs/upm_mu5vznq74bm.webp",
    "maxWidth": 3.0,
    "ver": 3
  },
  {
    "id": "upm_mu5vzo5qvt",
    "name": "桥",
    "category": "建筑",
    "symbolism": [
      "连接",
      "过渡",
      "跨越",
      "关系修复"
    ],
    "nameEn": "Bridge",
    "symbolismEn": [
      "Connection",
      "Transition",
      "Crossing over",
      "Repairing relationships"
    ],
    "size": 1.8,
    "glb": "/figures/models/upm_mu5vzo5qvt.glb",
    "thumb": "/figures/thumbs/upm_mu5vzo5qvt.webp",
    "maxWidth": 4.0,
    "ver": 2
  },
  {
    "id": "upm_mu5vzoke1kj",
    "name": "步枪",
    "category": "工具",
    "symbolism": [
      "攻击与防卫",
      "威胁",
      "掌控"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.0,
    "glb": "/figures/models/upm_mu5vzoke1kj.glb",
    "thumb": "/figures/thumbs/upm_mu5vzoke1kj.webp",
    "ver": 2
  },
  {
    "id": "upm_mu5vzp0w2oi",
    "name": "民居别墅",
    "category": "建筑",
    "symbolism": [
      "家庭",
      "安全基地",
      "理想生活"
    ],
    "nameEn": "House",
    "symbolismEn": [
      "Family",
      "Secure base",
      "Ideal life"
    ],
    "size": 2.6,
    "glb": "/figures/models/upm_mu5vzp0w2oi.glb",
    "thumb": "/figures/thumbs/upm_mu5vzp0w2oi.webp",
    "maxWidth": 3.6,
    "ver": 2
  },
  {
    "id": "upm_mu5vzpgi5r1",
    "name": "汽车",
    "category": "工具",
    "symbolism": [
      "前进",
      "自主",
      "掌控方向"
    ],
    "nameEn": "Car",
    "symbolismEn": [
      "Moving forward",
      "Autonomy",
      "Steering direction"
    ],
    "size": 1.8,
    "glb": "/figures/models/upm_mu5vzpgi5r1.glb",
    "thumb": "/figures/thumbs/upm_mu5vzpgi5r1.webp",
    "maxWidth": 2.8,
    "ver": 3
  },
  {
    "id": "upm_mu5vzpv53ok",
    "name": "游艇",
    "category": "工具",
    "symbolism": [
      "远行",
      "享乐",
      "地位",
      "离岸"
    ],
    "nameEn": "Yacht",
    "symbolismEn": [
      "Long voyage",
      "Pleasure",
      "Status",
      "Leaving shore"
    ],
    "size": 2.2,
    "glb": "/figures/models/upm_mu5vzpv53ok.glb",
    "thumb": "/figures/thumbs/upm_mu5vzpv53ok.webp",
    "maxWidth": 3.6,
    "ver": 2
  },
  {
    "id": "upm_mu5vzqat6gj",
    "name": "火车",
    "category": "工具",
    "symbolism": [
      "既定轨道",
      "集体前行",
      "人生阶段"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mu5vzqat6gj.glb",
    "thumb": "/figures/thumbs/upm_mu5vzqat6gj.webp",
    "maxWidth": 4.0,
    "ver": 2
  },
  {
    "id": "upm_mu5vzqqc2cq",
    "name": "炮",
    "category": "工具",
    "symbolism": [
      "强攻击性",
      "爆发",
      "防御工事"
    ],
    "nameEn": "Cannon",
    "symbolismEn": [
      "Strong aggression",
      "Outburst",
      "Fortification"
    ],
    "size": 1.3,
    "glb": "/figures/models/upm_mu5vzqqc2cq.glb",
    "thumb": "/figures/thumbs/upm_mu5vzqqc2cq.webp",
    "maxWidth": 2.2,
    "ver": 2
  },
  {
    "id": "upm_mu5vzr624rs",
    "name": "牛",
    "category": "动物",
    "symbolism": [
      "勤恳",
      "耐力",
      "被驯服的力量"
    ],
    "nameEn": "Ox",
    "symbolismEn": [
      "Diligence",
      "Endurance",
      "Tamed strength"
    ],
    "size": 1.5,
    "glb": "/figures/models/upm_mu5vzr624rs.glb",
    "thumb": "/figures/thumbs/upm_mu5vzr624rs.webp",
    "ver": 2
  },
  {
    "id": "upm_mu5vzrl148z",
    "name": "狐狸",
    "category": "动物",
    "symbolism": [
      "机敏",
      "策略",
      "狡黠",
      "独行"
    ],
    "nameEn": "Fox",
    "symbolismEn": [
      "Quick wit",
      "Strategy",
      "Cunning",
      "Going it alone"
    ],
    "size": 1.0,
    "glb": "/figures/models/upm_mu5vzrl148z.glb",
    "thumb": "/figures/thumbs/upm_mu5vzrl148z.webp",
    "yaw0": -35,
    "ver": 2
  },
  {
    "id": "upm_mu5vzs08z6",
    "name": "狼",
    "category": "动物",
    "symbolism": [
      "野性",
      "群体与孤独",
      "攻击",
      "忠诚"
    ],
    "nameEn": "Wolf",
    "symbolismEn": [
      "Wildness",
      "Pack and solitude",
      "Aggression",
      "Loyalty"
    ],
    "size": 0.95,
    "glb": "/figures/models/upm_mu5vzs08z6.glb",
    "thumb": "/figures/thumbs/upm_mu5vzs08z6.webp",
    "ver": 2
  },
  {
    "id": "upm_mu5vzsey16y",
    "name": "红绿灯",
    "category": "工具",
    "symbolism": [
      "规则",
      "停与行",
      "外部控制"
    ],
    "nameEn": "Traffic light",
    "symbolismEn": [
      "Rules",
      "Stop and go",
      "External control"
    ],
    "size": 2.4,
    "glb": "/figures/models/upm_mu5vzsey16y.glb",
    "thumb": "/figures/thumbs/upm_mu5vzsey16y.webp",
    "ver": 2
  },
  {
    "id": "upm_mu5vzsvwss",
    "name": "铁路",
    "category": "建筑",
    "symbolism": [
      "既定路线",
      "方向感",
      "连接远方"
    ],
    "nameEn": "Railway",
    "symbolismEn": [
      "Set route",
      "Sense of direction",
      "Connecting to faraway places"
    ],
    "size": 1.4,
    "glb": "/figures/models/upm_mu5vzsvwss.glb",
    "thumb": "/figures/thumbs/upm_mu5vzsvwss.webp",
    "maxWidth": 4.0,
    "ver": 2
  },
  {
    "id": "upm_mu5yhir26te",
    "name": "鱼儿",
    "category": "动物",
    "symbolism": [
      "潜意识",
      "流动",
      "自由",
      "无声的生命"
    ],
    "nameEn": "Fish",
    "symbolismEn": [
      "Unconscious",
      "Flow",
      "Freedom",
      "Silent life"
    ],
    "size": 0.6,
    "glb": "/figures/models/upm_mu5yhir26te.glb",
    "thumb": "/figures/thumbs/upm_mu5yhir26te.webp",
    "yaw0": 70,
    "ver": 2
  },
  {
    "id": "upm_mu5yhj8zpj",
    "name": "魔鬼",
    "category": "人物",
    "symbolism": [
      "阴影面",
      "内在冲突",
      "恐惧",
      "被压抑的攻击性"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.8,
    "glb": "/figures/models/upm_mu5yhj8zpj.glb",
    "thumb": "/figures/thumbs/upm_mu5yhj8zpj.webp",
    "ver": 2
  },
  {
    "id": "upm_mu5yhjpl5po",
    "name": "向日葵",
    "category": "自然",
    "symbolism": [
      "向阳",
      "希望",
      "生命力",
      "追随"
    ],
    "nameEn": "Sunflower",
    "symbolismEn": [
      "Facing the sun",
      "Hope",
      "Vitality",
      "Following"
    ],
    "size": 1.3,
    "glb": "/figures/models/upm_mu5yhjpl5po.glb",
    "thumb": "/figures/thumbs/upm_mu5yhjpl5po.webp",
    "ver": 2
  },
  {
    "id": "upm_mu5zzupa21w",
    "name": "士兵",
    "category": "人物",
    "symbolism": [
      "纪律",
      "攻击与防卫",
      "服从",
      "力量感"
    ],
    "nameEn": "Soldier",
    "symbolismEn": [
      "Discipline",
      "Attack and defence",
      "Obedience",
      "Sense of strength"
    ],
    "size": 1.8,
    "glb": "/figures/models/upm_mu5zzupa21w.glb",
    "thumb": "/figures/thumbs/upm_mu5zzupa21w.webp",
    "ver": 2
  },
  {
    "id": "upm_mu606nlyfj",
    "name": "草坪",
    "category": "自然",
    "symbolism": [
      "生机",
      "生长",
      "安稳的地面",
      "自然"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 0.4,
    "glb": "/figures/models/upm_mu606nlyfj.glb",
    "thumb": "/figures/thumbs/upm_mu606nlyfj.webp",
    "maxWidth": 4.0,
    "ver": 2
  },
  {
    "id": "upm_muprjmya4yc",
    "name": "骆驼",
    "category": "动物",
    "symbolism": [
      "坚忍",
      "耐力",
      "长途跋涉",
      "自给自足",
      "适应逆境"
    ],
    "nameEn": "Camel",
    "symbolismEn": [
      "Endurance",
      "Stamina",
      "Long journey",
      "Self-reliance",
      "Adapting to adversity"
    ],
    "size": 1.95,
    "glb": "/figures/models/upm_muprjmya4yc.glb",
    "thumb": "/figures/thumbs/upm_muprjmya4yc.webp",
    "ver": 1
  },
  {
    "id": "upm_muprjnp551o",
    "name": "巫师",
    "category": "人物",
    "symbolism": [
      "智慧",
      "神秘",
      "转化",
      "内在力量",
      "指引"
    ],
    "nameEn": "Wizard",
    "symbolismEn": [
      "Wisdom",
      "Mystery",
      "Transformation",
      "Inner power",
      "Guidance"
    ],
    "size": 1.8,
    "glb": "/figures/models/upm_muprjnp551o.glb",
    "thumb": "/figures/thumbs/upm_muprjnp551o.webp",
    "ver": 1
  },
  {
    "id": "upm_muprjofv3v8",
    "name": "金鱼",
    "category": "动物",
    "symbolism": [
      "好运",
      "富足",
      "自在",
      "被关注",
      "轻盈"
    ],
    "nameEn": "Goldfish",
    "symbolismEn": [
      "Good luck",
      "Abundance",
      "Ease",
      "Being noticed",
      "Lightness"
    ],
    "size": 0.6,
    "glb": "/figures/models/upm_muprjofv3v8.glb",
    "thumb": "/figures/thumbs/upm_muprjofv3v8.webp",
    "ver": 1
  },
  {
    "id": "upm_muprjp726gi",
    "name": "警察",
    "category": "人物",
    "symbolism": [
      "秩序",
      "保护",
      "规则",
      "安全感",
      "权威"
    ],
    "nameEn": "Police officer",
    "symbolismEn": [
      "Order",
      "Protection",
      "Rules",
      "Sense of safety",
      "Authority"
    ],
    "size": 1.8,
    "glb": "/figures/models/upm_muprjp726gi.glb",
    "thumb": "/figures/thumbs/upm_muprjp726gi.webp",
    "ver": 1
  },
  {
    "id": "upm_muprjpz3pm",
    "name": "智者",
    "category": "人物",
    "symbolism": [
      "智慧",
      "引导",
      "经验",
      "内省",
      "长者"
    ],
    "nameEn": "Sage",
    "symbolismEn": [
      "Wisdom",
      "Guidance",
      "Experience",
      "Introspection",
      "Elder"
    ],
    "size": 1.8,
    "glb": "/figures/models/upm_muprjpz3pm.glb",
    "thumb": "/figures/thumbs/upm_muprjpz3pm.webp",
    "ver": 1
  },
  {
    "id": "upm_muprjqoh1q1",
    "name": "马",
    "category": "动物",
    "symbolism": [
      "自由",
      "奔放",
      "力量",
      "速度",
      "忠诚"
    ],
    "nameEn": "Horse",
    "symbolismEn": [
      "Freedom",
      "Spirited",
      "Strength",
      "Speed",
      "Loyalty"
    ],
    "size": 1.7,
    "glb": "/figures/models/upm_muprjqoh1q1.glb",
    "thumb": "/figures/thumbs/upm_muprjqoh1q1.webp",
    "ver": 1
  },
  {
    "id": "upm_muprjre63m2",
    "name": "贝壳",
    "category": "自然",
    "symbolism": [
      "保护",
      "内在",
      "海洋",
      "珍藏",
      "柔韧"
    ],
    "nameEn": "Seashell",
    "symbolismEn": [
      "Protection",
      "Inner self",
      "Ocean",
      "Treasure",
      "Gentle resilience"
    ],
    "size": 0.6,
    "glb": "/figures/models/upm_muprjre63m2.glb",
    "thumb": "/figures/thumbs/upm_muprjre63m2.webp",
    "ver": 1
  },
  {
    "id": "upm_muprjsz95wh",
    "name": "苹果树",
    "category": "自然",
    "symbolism": [
      "成长",
      "收获",
      "丰盛",
      "滋养",
      "成果"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 2.4,
    "glb": "/figures/models/upm_muprjsz95wh.glb",
    "thumb": "/figures/thumbs/upm_muprjsz95wh.webp",
    "ver": 4
  },
  {
    "id": "upm_muprjtph2kb",
    "name": "郁金香",
    "category": "自然",
    "symbolism": [
      "爱意",
      "优雅",
      "春天",
      "新开始",
      "希望"
    ],
    "nameEn": "Tulip",
    "symbolismEn": [
      "Affection",
      "Elegance",
      "Spring",
      "New beginning",
      "Hope"
    ],
    "size": 0.75,
    "glb": "/figures/models/upm_muprjtph2kb.glb",
    "thumb": "/figures/thumbs/upm_muprjtph2kb.webp",
    "ver": 1
  },
  {
    "id": "upm_muprjug92cf",
    "name": "玫瑰花",
    "category": "自然",
    "symbolism": [
      "爱",
      "美好",
      "热情",
      "浪漫",
      "守护"
    ],
    "nameEn": "Rose",
    "symbolismEn": [
      "Love",
      "Beauty",
      "Passion",
      "Romance",
      "Protection"
    ],
    "size": 0.75,
    "glb": "/figures/models/upm_muprjug92cf.glb",
    "thumb": "/figures/thumbs/upm_muprjug92cf.webp",
    "ver": 1
  },
  {
    "id": "upm_muprwzic2uu",
    "name": "老虎",
    "category": "动物",
    "symbolism": [
      "力量",
      "勇猛",
      "威严",
      "攻击性",
      "领地"
    ],
    "nameEn": "Tiger",
    "symbolismEn": [
      "Strength",
      "Courage",
      "Majesty",
      "Aggression",
      "Territory"
    ],
    "size": 1.4,
    "glb": "/figures/models/upm_muprwzic2uu.glb",
    "thumb": "/figures/thumbs/upm_muprwzic2uu.webp",
    "ver": 1
  },
  {
    "id": "upm_muz17t0961s",
    "name": "铁链",
    "category": "工具",
    "symbolism": [
      "束缚",
      "限制",
      "牵连",
      "牢固",
      "压力"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 0.6,
    "glb": "/figures/models/upm_muz17t0961s.glb",
    "thumb": "/figures/thumbs/upm_muz17t0961s.webp",
    "maxWidth": 1.6,
    "ver": 2
  },
  {
    "id": "upm_muz17ufz181",
    "name": "羊",
    "category": "动物",
    "symbolism": [
      "温顺",
      "群体",
      "顺从",
      "善良",
      "依赖"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.0,
    "glb": "/figures/models/upm_muz17ufz181.glb",
    "thumb": "/figures/thumbs/upm_muz17ufz181.webp",
    "ver": 1
  },
  {
    "id": "upm_muz17vl53im",
    "name": "猪",
    "category": "动物",
    "symbolism": [
      "富足",
      "满足",
      "安逸",
      "憨厚",
      "懒散"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 0.9,
    "glb": "/figures/models/upm_muz17vl53im.glb",
    "thumb": "/figures/thumbs/upm_muz17vl53im.webp",
    "ver": 1
  },
  {
    "id": "upm_muz17wjs31l",
    "name": "自行车",
    "category": "工具",
    "symbolism": [
      "自由",
      "平衡",
      "前进",
      "独立",
      "自我驱动"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.1,
    "glb": "/figures/models/upm_muz17wjs31l.glb",
    "thumb": "/figures/thumbs/upm_muz17wjs31l.webp",
    "maxWidth": 1.8,
    "ver": 1
  },
  {
    "id": "upm_mv3pppb96vh",
    "name": "长城",
    "category": "建筑",
    "symbolism": [
      "防御与边界",
      "坚韧",
      "历史积淀",
      "民族认同"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 3.0,
    "glb": "/figures/models/upm_mv3pppb96vh.glb",
    "thumb": "/figures/thumbs/upm_mv3pppb96vh.webp",
    "maxWidth": 5.0,
    "ver": 1
  },
  {
    "id": "upm_mv3ppqe75cf",
    "name": "人民大会堂",
    "category": "建筑",
    "symbolism": [
      "集体与制度",
      "庄重",
      "公共权威",
      "国家认同"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 2.4,
    "glb": "/figures/models/upm_mv3ppqe75cf.glb",
    "thumb": "/figures/thumbs/upm_mv3ppqe75cf.webp",
    "maxWidth": 4.5,
    "ver": 1
  },
  {
    "id": "upm_mv3pprhk5tz",
    "name": "美国国会大厦",
    "category": "建筑",
    "symbolism": [
      "制度与规则",
      "权力",
      "公共事务",
      "西方文化印象"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 2.6,
    "glb": "/figures/models/upm_mv3pprhk5tz.glb",
    "thumb": "/figures/thumbs/upm_mv3pprhk5tz.webp",
    "maxWidth": 3.6,
    "ver": 1
  },
  {
    "id": "upm_mv3ppshv65g",
    "name": "华盛顿纪念碑",
    "category": "建筑",
    "symbolism": [
      "纪念",
      "理想与信念",
      "向上",
      "国家象征"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 3.8,
    "glb": "/figures/models/upm_mv3ppshv65g.glb",
    "thumb": "/figures/thumbs/upm_mv3ppshv65g.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pptt1x8",
    "name": "英国国会大厦",
    "category": "建筑",
    "symbolism": [
      "传统与秩序",
      "规则",
      "历史感",
      "英式文化印象"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 2.6,
    "glb": "/figures/models/upm_mv3pptt1x8.glb",
    "thumb": "/figures/thumbs/upm_mv3pptt1x8.webp",
    "maxWidth": 3.6,
    "ver": 1
  },
  {
    "id": "upm_mv3ppuwu41y",
    "name": "伦敦塔",
    "category": "建筑",
    "symbolism": [
      "历史与防御",
      "守护",
      "厚重",
      "异国体验"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 2.4,
    "glb": "/figures/models/upm_mv3ppuwu41y.glb",
    "thumb": "/figures/thumbs/upm_mv3ppuwu41y.webp",
    "maxWidth": 3.2,
    "ver": 1
  },
  {
    "id": "upm_mv3ppw2g272",
    "name": "悉尼市政厅",
    "category": "建筑",
    "symbolism": [
      "城市生活",
      "公共秩序",
      "社区",
      "澳洲印象"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 2.6,
    "glb": "/figures/models/upm_mv3ppw2g272.glb",
    "thumb": "/figures/thumbs/upm_mv3ppw2g272.webp",
    "maxWidth": 3.2,
    "ver": 1
  },
  {
    "id": "upm_mv3ppx192yy",
    "name": "悉尼港湾大桥",
    "category": "建筑",
    "symbolism": [
      "连接",
      "跨越",
      "通往新生活",
      "澳洲印象"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 2.2,
    "glb": "/figures/models/upm_mv3ppx192yy.glb",
    "thumb": "/figures/thumbs/upm_mv3ppx192yy.webp",
    "maxWidth": 5.0,
    "ver": 1
  },
  {
    "id": "upm_mv3ppybx6a7",
    "name": "吉隆坡双子塔",
    "category": "建筑",
    "symbolism": [
      "并肩与伙伴",
      "现代化",
      "高度与野心",
      "对称平衡"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 4.2,
    "glb": "/figures/models/upm_mv3ppybx6a7.glb",
    "thumb": "/figures/thumbs/upm_mv3ppybx6a7.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3ppzf6x5",
    "name": "新加坡滨海湾金沙酒店",
    "category": "建筑",
    "symbolism": [
      "繁华",
      "向往",
      "现代都市",
      "成功的想象"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 2.4,
    "glb": "/figures/models/upm_mv3ppzf6x5.glb",
    "thumb": "/figures/thumbs/upm_mv3ppzf6x5.webp",
    "maxWidth": 3.4,
    "ver": 2
  },
  {
    "id": "upm_mv3pq0qq6p4",
    "name": "四合院",
    "category": "建筑",
    "symbolism": [
      "家族",
      "传统家庭",
      "围合的安全感",
      "团聚"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.8,
    "glb": "/figures/models/upm_mv3pq0qq6p4.glb",
    "thumb": "/figures/thumbs/upm_mv3pq0qq6p4.webp",
    "maxWidth": 4.0,
    "ver": 1
  },
  {
    "id": "upm_mv3pq1o910w",
    "name": "机场",
    "category": "建筑",
    "symbolism": [
      "出发与离别",
      "转变",
      "远方",
      "人生新阶段"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 2.0,
    "glb": "/figures/models/upm_mv3pq1o910w.glb",
    "thumb": "/figures/thumbs/upm_mv3pq1o910w.webp",
    "maxWidth": 5.0,
    "ver": 1
  },
  {
    "id": "upm_mv3pq2j62ir",
    "name": "咖啡店",
    "category": "建筑",
    "symbolism": [
      "休憩",
      "社交",
      "日常生活",
      "独处与陪伴"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 2.4,
    "glb": "/figures/models/upm_mv3pq2j62ir.glb",
    "thumb": "/figures/thumbs/upm_mv3pq2j62ir.webp",
    "maxWidth": 3.2,
    "ver": 1
  },
  {
    "id": "upm_mv3pq3dik2",
    "name": "奶茶店",
    "category": "建筑",
    "symbolism": [
      "年轻生活",
      "小确幸",
      "社交",
      "自我犒赏"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 2.4,
    "glb": "/figures/models/upm_mv3pq3dik2.glb",
    "thumb": "/figures/thumbs/upm_mv3pq3dik2.webp",
    "maxWidth": 3.2,
    "ver": 1
  },
  {
    "id": "upm_mv3pq4gf2oh",
    "name": "大熊猫",
    "category": "动物",
    "symbolism": [
      "温和",
      "珍贵",
      "被呵护",
      "中国符号"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.3,
    "glb": "/figures/models/upm_mv3pq4gf2oh.glb",
    "thumb": "/figures/thumbs/upm_mv3pq4gf2oh.webp",
    "ver": 5
  },
  {
    "id": "upm_mv3pq5933py",
    "name": "袋鼠",
    "category": "动物",
    "symbolism": [
      "跳跃前进",
      "母性与保护",
      "活力",
      "澳洲符号"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.5,
    "glb": "/figures/models/upm_mv3pq5933py.glb",
    "thumb": "/figures/thumbs/upm_mv3pq5933py.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pq63r7e2",
    "name": "白头海雕",
    "category": "动物",
    "symbolism": [
      "自由",
      "力量",
      "远见",
      "美国符号"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 0.9,
    "glb": "/figures/models/upm_mv3pq63r7e2.glb",
    "thumb": "/figures/thumbs/upm_mv3pq63r7e2.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pq74939p",
    "name": "枫树",
    "category": "自然",
    "symbolism": [
      "季节变化",
      "成熟",
      "温暖",
      "加拿大符号"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 2.4,
    "glb": "/figures/models/upm_mv3pq74939p.glb",
    "thumb": "/figures/thumbs/upm_mv3pq74939p.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pq7ux5rg",
    "name": "白酒瓶",
    "category": "工具",
    "symbolism": [
      "应酬与人情",
      "压力释放",
      "传统社交",
      "成人世界"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 0.75,
    "glb": "/figures/models/upm_mv3pq7ux5rg.glb",
    "thumb": "/figures/thumbs/upm_mv3pq7ux5rg.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pq8s65eu",
    "name": "清酒",
    "category": "工具",
    "symbolism": [
      "仪式感",
      "节制",
      "日式文化",
      "社交"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 0.75,
    "glb": "/figures/models/upm_mv3pq8s65eu.glb",
    "thumb": "/figures/thumbs/upm_mv3pq8s65eu.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pq9kwo5",
    "name": "啤酒",
    "category": "工具",
    "symbolism": [
      "放松",
      "聚会",
      "宣泄",
      "同伴关系"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 0.7,
    "glb": "/figures/models/upm_mv3pq9kwo5.glb",
    "thumb": "/figures/thumbs/upm_mv3pq9kwo5.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqadxu5",
    "name": "红酒",
    "category": "工具",
    "symbolism": [
      "品味",
      "庆祝",
      "浪漫",
      "成熟"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 0.8,
    "glb": "/figures/models/upm_mv3pqadxu5.glb",
    "thumb": "/figures/thumbs/upm_mv3pqadxu5.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqbql1mo",
    "name": "白酒杯",
    "category": "工具",
    "symbolism": [
      "敬酒与人情",
      "压力",
      "传统礼数",
      "成人世界"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 0.6,
    "glb": "/figures/models/upm_mv3pqbql1mo.glb",
    "thumb": "/figures/thumbs/upm_mv3pqbql1mo.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqceveu",
    "name": "咖啡杯",
    "category": "工具",
    "symbolism": [
      "提神",
      "日常",
      "专注",
      "休憩"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 0.6,
    "glb": "/figures/models/upm_mv3pqceveu.glb",
    "thumb": "/figures/thumbs/upm_mv3pqceveu.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqd291cj",
    "name": "碗",
    "category": "工具",
    "symbolism": [
      "温饱",
      "滋养",
      "家的味道",
      "容纳"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 0.6,
    "glb": "/figures/models/upm_mv3pqd291cj.glb",
    "thumb": "/figures/thumbs/upm_mv3pqd291cj.webp",
    "maxWidth": 0.9,
    "ver": 1
  },
  {
    "id": "upm_mv3pqdu8582",
    "name": "筷子",
    "category": "工具",
    "symbolism": [
      "饮食传统",
      "家庭餐桌",
      "文化身份",
      "配合"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 0.75,
    "glb": "/figures/models/upm_mv3pqdu8582.glb",
    "thumb": "/figures/thumbs/upm_mv3pqdu8582.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqehw65g",
    "name": "叉子",
    "category": "工具",
    "symbolism": [
      "西式饮食",
      "异文化适应",
      "日常",
      "工具性"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 0.75,
    "glb": "/figures/models/upm_mv3pqehw65g.glb",
    "thumb": "/figures/thumbs/upm_mv3pqehw65g.webp",
    "ver": 2
  },
  {
    "id": "upm_mv3pqfaz3q7",
    "name": "果汁",
    "category": "工具",
    "symbolism": [
      "健康",
      "清新",
      "滋养",
      "童年"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 0.75,
    "glb": "/figures/models/upm_mv3pqfaz3q7.glb",
    "thumb": "/figures/thumbs/upm_mv3pqfaz3q7.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqg1y1z8",
    "name": "果汁杯",
    "category": "工具",
    "symbolism": [
      "滋养",
      "轻松",
      "分享",
      "童年"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 0.65,
    "glb": "/figures/models/upm_mv3pqg1y1z8.glb",
    "thumb": "/figures/thumbs/upm_mv3pqg1y1z8.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqgvu73f",
    "name": "餐桌",
    "category": "工具",
    "symbolism": [
      "家庭团聚",
      "分享",
      "沟通",
      "归属"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.0,
    "glb": "/figures/models/upm_mv3pqgvu73f.glb",
    "thumb": "/figures/thumbs/upm_mv3pqgvu73f.webp",
    "maxWidth": 2.0,
    "ver": 1
  },
  {
    "id": "upm_mv3pqhsk1te",
    "name": "椅子",
    "category": "工具",
    "symbolism": [
      "位置与归属",
      "休息",
      "等待",
      "被接纳"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.1,
    "glb": "/figures/models/upm_mv3pqhsk1te.glb",
    "thumb": "/figures/thumbs/upm_mv3pqhsk1te.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqiq64ek",
    "name": "巨型邮轮",
    "category": "工具",
    "symbolism": [
      "远行",
      "漂泊与享受",
      "集体旅程",
      "开阔"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 2.4,
    "glb": "/figures/models/upm_mv3pqiq64ek.glb",
    "thumb": "/figures/thumbs/upm_mv3pqiq64ek.webp",
    "maxWidth": 4.8,
    "ver": 2
  },
  {
    "id": "upm_mv3pqjl54xg",
    "name": "飞机",
    "category": "工具",
    "symbolism": [
      "远方",
      "出发",
      "快速转变",
      "自由"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pqjl54xg.glb",
    "thumb": "/figures/thumbs/upm_mv3pqjl54xg.webp",
    "maxWidth": 3.6,
    "ver": 1
  },
  {
    "id": "upm_mv3pqknr7lf",
    "name": "珊瑚礁",
    "category": "自然",
    "symbolism": [
      "生命力",
      "脆弱与美",
      "共生",
      "海洋世界"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.0,
    "glb": "/figures/models/upm_mv3pqknr7lf.glb",
    "thumb": "/figures/thumbs/upm_mv3pqknr7lf.webp",
    "maxWidth": 2.0,
    "ver": 1
  },
  {
    "id": "upm_mv3pqlhk1nz",
    "name": "白人中学生",
    "category": "人物",
    "symbolism": [
      "青春期",
      "学业",
      "同伴关系",
      "成长"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.7,
    "glb": "/figures/models/upm_mv3pqlhk1nz.glb",
    "thumb": "/figures/thumbs/upm_mv3pqlhk1nz.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqmcu56m",
    "name": "白人大学生",
    "category": "人物",
    "symbolism": [
      "独立",
      "求学",
      "探索身份",
      "未来"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.8,
    "glb": "/figures/models/upm_mv3pqmcu56m.glb",
    "thumb": "/figures/thumbs/upm_mv3pqmcu56m.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqn5o5kr",
    "name": "白人娃娃",
    "category": "人物",
    "symbolism": [
      "幼小",
      "依赖",
      "纯真",
      "被照顾的需要"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 0.9,
    "glb": "/figures/models/upm_mv3pqn5o5kr.glb",
    "thumb": "/figures/thumbs/upm_mv3pqn5o5kr.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqnyv7oz",
    "name": "亚洲人娃娃",
    "category": "人物",
    "symbolism": [
      "幼小",
      "纯真",
      "依恋",
      "童年自我"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 0.9,
    "glb": "/figures/models/upm_mv3pqnyv7oz.glb",
    "thumb": "/figures/thumbs/upm_mv3pqnyv7oz.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqor26a0",
    "name": "白人男经理",
    "category": "人物",
    "symbolism": [
      "职场",
      "权威",
      "责任",
      "成就压力"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.8,
    "glb": "/figures/models/upm_mv3pqor26a0.glb",
    "thumb": "/figures/thumbs/upm_mv3pqor26a0.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqpk161e",
    "name": "白人女教师",
    "category": "人物",
    "symbolism": [
      "教导",
      "引领",
      "规则",
      "支持"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.8,
    "glb": "/figures/models/upm_mv3pqpk161e.glb",
    "thumb": "/figures/thumbs/upm_mv3pqpk161e.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqqd25qz",
    "name": "白人议员",
    "category": "人物",
    "symbolism": [
      "权力",
      "公共事务",
      "规则制定",
      "社会地位"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.8,
    "glb": "/figures/models/upm_mv3pqqd25qz.glb",
    "thumb": "/figures/thumbs/upm_mv3pqqd25qz.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqr6a6ip",
    "name": "白人警察",
    "category": "人物",
    "symbolism": [
      "秩序",
      "保护",
      "规则与约束",
      "安全感"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.8,
    "glb": "/figures/models/upm_mv3pqr6a6ip.glb",
    "thumb": "/figures/thumbs/upm_mv3pqr6a6ip.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqrzx78w",
    "name": "白人运动员",
    "category": "人物",
    "symbolism": [
      "活力",
      "竞争",
      "团队",
      "身体力量"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.8,
    "glb": "/figures/models/upm_mv3pqrzx78w.glb",
    "thumb": "/figures/thumbs/upm_mv3pqrzx78w.webp",
    "ver": 4
  },
  {
    "id": "upm_mv3pqsw56uh",
    "name": "太阳伞",
    "category": "工具",
    "symbolism": [
      "庇护",
      "休闲",
      "度假",
      "遮挡"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 2.2,
    "glb": "/figures/models/upm_mv3pqsw56uh.glb",
    "thumb": "/figures/thumbs/upm_mv3pqsw56uh.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqtpz5aj",
    "name": "床",
    "category": "工具",
    "symbolism": [
      "休息",
      "安全",
      "私密",
      "亲密关系"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.0,
    "glb": "/figures/models/upm_mv3pqtpz5aj.glb",
    "thumb": "/figures/thumbs/upm_mv3pqtpz5aj.webp",
    "maxWidth": 2.2,
    "ver": 1
  },
  {
    "id": "upm_mv3pqum04rs",
    "name": "沙发",
    "category": "工具",
    "symbolism": [
      "放松",
      "家庭",
      "陪伴",
      "舒适区"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.0,
    "glb": "/figures/models/upm_mv3pqum04rs.glb",
    "thumb": "/figures/thumbs/upm_mv3pqum04rs.webp",
    "maxWidth": 2.2,
    "ver": 1
  },
  {
    "id": "upm_mv3pqvh65x0",
    "name": "书桌",
    "category": "工具",
    "symbolism": [
      "学习",
      "专注",
      "责任",
      "个人空间"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.0,
    "glb": "/figures/models/upm_mv3pqvh65x0.glb",
    "thumb": "/figures/thumbs/upm_mv3pqvh65x0.webp",
    "maxWidth": 1.8,
    "ver": 1
  },
  {
    "id": "upm_mv3pqwa16g4",
    "name": "台灯",
    "category": "工具",
    "symbolism": [
      "照亮",
      "专注",
      "陪伴",
      "夜晚的努力"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 0.9,
    "glb": "/figures/models/upm_mv3pqwa16g4.glb",
    "thumb": "/figures/thumbs/upm_mv3pqwa16g4.webp",
    "ver": 2
  },
  {
    "id": "upm_mv3pqwyd4b",
    "name": "气球",
    "category": "工具",
    "symbolism": [
      "快乐",
      "庆祝",
      "轻盈",
      "易逝"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pqwyd4b.glb",
    "thumb": "/figures/thumbs/upm_mv3pqwyd4b.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqxue74q",
    "name": "新郎",
    "category": "人物",
    "symbolism": [
      "婚姻",
      "承诺",
      "结合",
      "人生新阶段"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.8,
    "glb": "/figures/models/upm_mv3pqxue74q.glb",
    "thumb": "/figures/thumbs/upm_mv3pqxue74q.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqynt2zn",
    "name": "新娘",
    "category": "人物",
    "symbolism": [
      "婚姻",
      "承诺",
      "结合",
      "人生新阶段"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.8,
    "glb": "/figures/models/upm_mv3pqynt2zn.glb",
    "thumb": "/figures/thumbs/upm_mv3pqynt2zn.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqzar4y9",
    "name": "中国国旗",
    "category": "工具",
    "symbolism": [
      "国家认同",
      "故乡与根",
      "文化归属",
      "集体"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pqzar4y9.glb",
    "thumb": "/figures/thumbs/upm_mv3pqzar4y9.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pqzxn7mc",
    "name": "美国国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "自由"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pqzxn7mc.glb",
    "thumb": "/figures/thumbs/upm_mv3pqzxn7mc.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pr0ka6ww",
    "name": "加拿大国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "包容"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pr0ka6ww.glb",
    "thumb": "/figures/thumbs/upm_mv3pr0ka6ww.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pr1737fi",
    "name": "英国国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "传统"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pr1737fi.glb",
    "thumb": "/figures/thumbs/upm_mv3pr1737fi.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pr1v31n9",
    "name": "澳大利亚国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "新生活"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pr1v31n9.glb",
    "thumb": "/figures/thumbs/upm_mv3pr1v31n9.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pr2hu2zh",
    "name": "新西兰国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "自然"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pr2hu2zh.glb",
    "thumb": "/figures/thumbs/upm_mv3pr2hu2zh.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pr34n20p",
    "name": "新加坡国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "多元"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pr34n20p.glb",
    "thumb": "/figures/thumbs/upm_mv3pr34n20p.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pr3r17op",
    "name": "法国国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "浪漫"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pr3r17op.glb",
    "thumb": "/figures/thumbs/upm_mv3pr3r17op.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pr4dmcn",
    "name": "德国国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "严谨"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pr4dmcn.glb",
    "thumb": "/figures/thumbs/upm_mv3pr4dmcn.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pr50l4dt",
    "name": "日本国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "邻近文化"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pr50l4dt.glb",
    "thumb": "/figures/thumbs/upm_mv3pr50l4dt.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pr5o82w4",
    "name": "韩国国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "邻近文化"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pr5o82w4.glb",
    "thumb": "/figures/thumbs/upm_mv3pr5o82w4.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pr6b23fu",
    "name": "中国香港区旗",
    "category": "工具",
    "symbolism": [
      "地区认同",
      "向往的地方",
      "东西交汇",
      "归属"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pr6b23fu.glb",
    "thumb": "/figures/thumbs/upm_mv3pr6b23fu.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pr6za1op",
    "name": "菲律宾国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "多元"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pr6za1op.glb",
    "thumb": "/figures/thumbs/upm_mv3pr6za1op.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pr7m45ka",
    "name": "马来西亚国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "多元"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pr7m45ka.glb",
    "thumb": "/figures/thumbs/upm_mv3pr7m45ka.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pr88s21a",
    "name": "印度尼西亚国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "多元"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pr88s21a.glb",
    "thumb": "/figures/thumbs/upm_mv3pr88s21a.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pr8wj22c",
    "name": "越南国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "邻近文化"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pr8wj22c.glb",
    "thumb": "/figures/thumbs/upm_mv3pr8wj22c.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pr9j328y",
    "name": "泰国国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "多元"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pr9j328y.glb",
    "thumb": "/figures/thumbs/upm_mv3pr9j328y.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3pra5o3qb",
    "name": "印度国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "多元"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3pra5o3qb.glb",
    "thumb": "/figures/thumbs/upm_mv3pra5o3qb.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3prast58o",
    "name": "尼泊尔国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "独特"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3prast58o.glb",
    "thumb": "/figures/thumbs/upm_mv3prast58o.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3prbfi6b2",
    "name": "土耳其国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "东西交汇"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3prbfi6b2.glb",
    "thumb": "/figures/thumbs/upm_mv3prbfi6b2.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3prc346dl",
    "name": "蒙古国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "辽阔"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3prc346dl.glb",
    "thumb": "/figures/thumbs/upm_mv3prc346dl.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3prcpp6ee",
    "name": "阿联酋国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "繁华"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3prcpp6ee.glb",
    "thumb": "/figures/thumbs/upm_mv3prcpp6ee.webp",
    "ver": 1
  },
  {
    "id": "upm_mv3prdc63in",
    "name": "埃及国旗",
    "category": "工具",
    "symbolism": [
      "国家与文化认同",
      "向往的地方",
      "异乡与归属",
      "古老文明"
    ],
    "nameEn": "",
    "symbolismEn": [],
    "size": 1.6,
    "glb": "/figures/models/upm_mv3prdc63in.glb",
    "thumb": "/figures/thumbs/upm_mv3prdc63in.webp",
    "ver": 1
  }
]

export const figureById = new Map(figures.map((f) => [f.id, f]))

// 分类在数据里是中文（跟确认单一致），界面按这个顺序对到 copy.sandtray.categories 的下标
export const FIGURE_CATEGORIES: FigureCategory[] = ["人物", "动物", "建筑", "工具", "自然"]

export const figureName = (f: { name: string; nameEn: string }, lang: "zh" | "en") =>
  lang === "en" ? f.nameEn : f.name
