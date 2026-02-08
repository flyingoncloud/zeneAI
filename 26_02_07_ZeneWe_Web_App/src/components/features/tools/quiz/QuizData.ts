import { Zap, Brain, Activity, Play, Image as ImageIcon, RotateCw, LayoutGrid } from 'lucide-react';

export type QuestionFormat = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Choice {
  id: string;
  text: string;
  image?: string; // For Format 3
  value: number; // For scoring
}

export interface QuizQuestion {
  id: number;
  format: QuestionFormat;
  stem: string; // The main question text
  subtitle?: string; // Optional subtitle/instruction
  
  // Format specific fields
  stimulus?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    alt?: string;
  };
  
  choices?: Choice[]; // For Format 2, 3, 5
  
  // For Format 4 (Spatial)
  spatialConfig?: {
    centerObject: string; // e.g., "Tree"
    targetObject: string; // e.g., "Cat"
    sceneItems: { id: string; icon: string; label: string; x: number; y: number }[]; // Positions in %
    correctAngle?: number; // 0-360
  };

  // UI Hints
  uiHints?: {
    leftLabel?: string; // For Format 1 (Likert)
    rightLabel?: string; // For Format 1 (Likert)
    timeLimit?: number;
  };
}

export const MOCK_QUIZ_QUESTIONS: QuizQuestion[] = [
  // Format 1: Likert (Existing style enhanced)
  {
    id: 1,
    format: 1,
    stem: "我最近感到精力充沛，对生活充满热情。",
    uiHints: {
      leftLabel: "非常不同意",
      rightLabel: "非常同意"
    }
  },
  // Format 2: Text + Header Image + Radio Options
  {
    id: 2,
    format: 2,
    stem: "当你看到这幅景象时，你本能的感受是？",
    stimulus: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop',
      alt: 'Mountain landscape'
    },
    choices: [
      { id: 'A', text: '宁静与广阔', value: 5 },
      { id: 'B', text: '孤独与渺小', value: 2 },
      { id: 'C', text: '想要去探索', value: 4 },
      { id: 'D', text: '感到压抑', value: 1 }
    ]
  },
  // Format 3: Image Grid Selection
  {
    id: 3,
    format: 3,
    stem: "你向领导提交方案后，收到一句简短回复：“我们需要讨论一下。”你的第一反应是：",
    choices: [
      { 
        id: 'A', 
        text: '只要被叫去讨论，说明我的方案就是不合格。', 
        image: 'https://images.unsplash.com/photo-1739300293396-9ad79111c8e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZXJpb3VzJTIwb2ZmaWNlJTIwbWVldGluZyUyMGRpc2N1c3Npb258ZW58MXx8fHwxNzcwMzgwMTg2fDA&ixlib=rb-4.1.0&q=80&w=1080', 
        value: 5 
      },
      { 
        id: 'B', 
        text: '他们这次不满意，以后我提的方案可能都通不过。', 
        image: 'https://images.unsplash.com/photo-1576763013267-01343ca79876?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlc3NlZCUyMGVtcGxveWVlJTIwbG9va2luZyUyMGF0JTIwbGFwdG9wJTIwc2NyZWVufGVufDF8fHx8MTc3MDM4MDE4Nnww&ixlib=rb-4.1.0&q=80&w=1080', 
        value: 1 
      },
      { 
        id: 'C', 
        text: '完了，这肯定意味着重大问题，项目可能要被叫停。', 
        image: 'https://images.unsplash.com/photo-1758687127236-0da5ff52f4bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3JyaWVkJTIwYnVzaW5lc3MlMjBwZXJzb24lMjB0aGlua2luZ3xlbnwxfHx8fDE3NzAzODAxODZ8MA&ixlib=rb-4.1.0&q=80&w=1080', 
        value: 2 
      },
      { 
        id: 'D', 
        text: '我本来必须把所有问题预先考虑到，不能让领导再操心。', 
        image: 'https://images.unsplash.com/photo-1685381949388-bb0402fbe133?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvZmZpY2UlMjBlbWFpbCUyMG5vdGlmaWNhdGlvbiUyMHN0cmVzc3xlbnwxfHx8fDE3NzAzODAxODd8MA&ixlib=rb-4.1.0&q=80&w=1080', 
        value: 4 
      }
    ]
  },
  // Format 4: Image Grid (6 Items)
  {
    id: 9,
    format: 4,
    stem: "请从以下 6 张图中，选出最符合你当下状态的一张。",
    choices: [
      { 
        id: 'A', 
        text: '平静', 
        value: 5,
        image: 'https://images.unsplash.com/photo-1763899910806-43a13994b44f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxtJTIwcGVhY2VmdWwlMjBwZXJzb24lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzAzODI4MDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      },
      { 
        id: 'B', 
        text: '紧张', 
        value: 1,
        image: 'https://images.unsplash.com/photo-1678988498674-958509e12591?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXJ2b3VzJTIwYW54aW91cyUyMHN0cmVzc2VkJTIwcGVyc29uJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcwMzgyODA0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      },
      { 
        id: 'C', 
        text: '期待', 
        value: 4,
        image: 'https://images.unsplash.com/photo-1603110505034-7e7dd9458f27?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcHRpbWlzdGljJTIwcGVyc29ufGVufDF8fHx8MTc3MDM4MjgxNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      },
      { 
        id: 'D', 
        text: '疲惫', 
        value: 2,
        image: 'https://images.unsplash.com/photo-1497491908353-c2624b242ecf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aXJlZCUyMGV4aGF1c3RlZCUyMGJ1cm5vdXQlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzAzODI4MDV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      },
      { 
        id: 'E', 
        text: '混乱', 
        value: 2,
        image: 'https://images.unsplash.com/photo-1759269834861-db6fddb17db3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25mdXNlZCUyMGNoYW90aWMlMjBtaW5kJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcwMzgyODA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      },
      { 
        id: 'F', 
        text: '释然', 
        value: 5,
        image: 'https://images.unsplash.com/photo-1593015839760-756dcd728cba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWxpZXZlZCUyMGhhcHB5JTIwcmVsYXhlZCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MDM4MjgwNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      }
    ]
  },
  // Format 7: Ranking (Top 3 Animals)
  {
    id: 10,
    format: 7,
    stem: "给你几种动物，请在以下动物中依次排序，选出你心中最喜欢的三种。",
    subtitle: "规则：最喜欢=1，第二喜欢=2，第三喜欢=3。",
    choices: [
      { id: 'cat', text: '猫', value: 0 },
      { id: 'dog', text: '狗', value: 0 },
      { id: 'rabbit', text: '兔子', value: 0 },
      { id: 'panda', text: '熊猫', value: 0 },
      { id: 'fox', text: '狐狸', value: 0 },
      { id: 'dolphin', text: '海豚', value: 0 },
      { id: 'owl', text: '猫头鹰', value: 0 },
      { id: 'lion', text: '狮子', value: 0 },
      { id: 'turtle', text: '乌龟', value: 0 }
    ]
  },
  // Format 6: Spatial/PTSOT (Example 1)
  {
    id: 4,
    format: 6,
    stem: "空间想象：若你站在树旁面向房子，猫在你的什么方向？",
    subtitle: "请拖动箭头指示方向（请以直觉作答，不要旋转设备）",
    spatialConfig: {
      centerObject: "User",
      targetObject: "Cat",
      sceneItems: [
        { id: 'tree', icon: 'TreeDeciduous', label: '树', x: 50, y: 50 }, // Center reference
        { id: 'house', icon: 'Home', label: '房子', x: 50, y: 10 }, // Top (North)
        { id: 'cat', icon: 'Cat', label: '猫', x: 80, y: 50 } // Right (East)
      ],
      correctAngle: 90 // East
    }
  },

  // Format 5: Media Stimulus
  {
    id: 6,
    format: 5,
    stem: "观看这段视频片段，视频中主角的情绪主要是？",
    stimulus: {
      type: 'video',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-calm-sea-and-coast-at-sunset-1229-large.mp4', // Placeholder free stock video
      alt: 'Calm sea sunset'
    },
    choices: [
      { id: 'A', text: '悲伤与失落', value: 1 },
      { id: 'B', text: '平静与接纳', value: 5 },
      { id: 'C', text: '焦虑与不安', value: 2 },
      { id: 'D', text: '愤怒与抗拒', value: 1 },
      { id: 'E', text: '喜悦与兴奋', value: 4 }
    ]
  },
  // Format 1 again to mix it up
  {
    id: 7,
    format: 1,
    stem: "我能清晰地感知到自己情绪的起伏变化。",
    uiHints: {
      leftLabel: "从不",
      rightLabel: "总是"
    }
  },
  // Format 2 again
  {
    id: 8,
    format: 2,
    stem: "这幅抽象画让你想到了什么？",
    stimulus: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=1000&auto=format&fit=crop',
      alt: 'Abstract art'
    },
    choices: [
      { id: 'A', text: '混乱的思绪', value: 2 },
      { id: 'B', text: '爆发的创造力', value: 5 },
      { id: 'C', text: '深层的恐惧', value: 1 },
      { id: 'D', text: '生命的律动', value: 4 }
    ]
  }
];
