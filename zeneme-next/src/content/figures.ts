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
    "maxWidth": 5,
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
    "size": 1,
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
    "ver": 2
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
    "ver": 2
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
    "ver": 2
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
    "maxWidth": 5,
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
    "yaw0": -35,
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
    "maxWidth": 4,
    "ver": 1
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
    "maxWidth": 2,
    "ver": 2
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
    "maxWidth": 4,
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
    "yaw0": -35,
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
    "maxWidth": 4,
    "ver": 2
  },
  {
    "id": "upm_mu5yhir26te",
    "yaw0": 70,
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
  }
]

export const figureById = new Map(figures.map((f) => [f.id, f]))

// 分类在数据里是中文（跟确认单一致），界面按这个顺序对到 copy.sandtray.categories 的下标
export const FIGURE_CATEGORIES: FigureCategory[] = ["人物", "动物", "建筑", "工具", "自然"]

export const figureName = (f: { name: string; nameEn: string }, lang: "zh" | "en") =>
  lang === "en" ? f.nameEn : f.name
