/**
 * Psychology Assessment Category Hierarchy
 *
 * This defines the hierarchical structure of assessment categories
 * used for scoring and report generation.
 */

export interface CategoryNode {
  code: string;
  name: string;
  nameEn: string;
  description?: string;
  children?: Record<string, CategoryNode>;
}

export const CATEGORY_HIERARCHY: Record<string, CategoryNode> = {
  "2.1": {
    code: "2.1",
    name: "情绪觉察",
    nameEn: "Emotional Awareness",
    description: "Ability to recognize and understand emotions",
    children: {
      "2.1.1": {
        code: "2.1.1",
        name: "情绪识别与表达",
        nameEn: "Emotion Recognition and Expression",
        description: "Ability to identify and express emotions"
      },
      "2.1.2": {
        code: "2.1.2",
        name: "情绪调节与恢复",
        nameEn: "Emotion Regulation and Recovery",
        description: "Ability to regulate emotions and recover from distress"
      },
      "2.1.3": {
        code: "2.1.3",
        name: "情绪倾向与风险",
        nameEn: "Emotional Tendencies and Risks",
        description: "Emotional patterns and potential risks"
      }
    }
  },
  "2.2": {
    code: "2.2",
    name: "认知模式",
    nameEn: "Cognitive Patterns",
    description: "Thinking patterns and cognitive frameworks",
    children: {
      "2.2.1": {
        code: "2.2.1",
        name: "自我内在系统分析",
        nameEn: "Internal System Analysis",
        description: "Understanding of internal psychological systems",
        children: {
          "2.2.1.1": {
            code: "2.2.1.1",
            name: "管理者",
            nameEn: "Managers"
          },
          "2.2.1.2": {
            code: "2.2.1.2",
            name: "消防员",
            nameEn: "Firefighters"
          },
          "2.2.1.3": {
            code: "2.2.1.3",
            name: "流亡者",
            nameEn: "Exiles"
          },
          "2.2.1.4": {
            code: "2.2.1.4",
            name: "自性",
            nameEn: "Self"
          }
        }
      },
      "2.2.2": {
        code: "2.2.2",
        name: "自动思维模式",
        nameEn: "Automatic Thought Patterns",
        description: "Automatic cognitive distortions",
        children: {
          "2.2.2.1": {
            code: "2.2.2.1",
            name: "过度概括",
            nameEn: "Overgeneralization"
          },
          "2.2.2.2": {
            code: "2.2.2.2",
            name: "非黑即白",
            nameEn: "Black-and-White Thinking"
          },
          "2.2.2.3": {
            code: "2.2.2.3",
            name: "灾难化",
            nameEn: "Catastrophizing"
          },
          "2.2.2.4": {
            code: "2.2.2.4",
            name: "应该/必须",
            nameEn: "Should/Must Statements"
          },
          "2.2.2.5": {
            code: "2.2.2.5",
            name: "自我责备",
            nameEn: "Self-Blame"
          }
        }
      },
      "2.2.3": {
        code: "2.2.3",
        name: "视角转换能力",
        nameEn: "Perspective Shifting",
        description: "Ability to shift perspectives",
        children: {
          "2.2.3.1": {
            code: "2.2.3.1",
            name: "自我 vs 他人视角转换",
            nameEn: "Self vs Others Perspective"
          },
          "2.2.3.2": {
            code: "2.2.3.2",
            name: "空间视角转换",
            nameEn: "Spatial Perspective"
          },
          "2.2.3.3": {
            code: "2.2.3.3",
            name: "认知框架转换",
            nameEn: "Cognitive Frame Shifting"
          },
          "2.2.3.4": {
            code: "2.2.3.4",
            name: "情绪视角转换",
            nameEn: "Emotional Perspective"
          }
        }
      },
      "2.2.4": {
        code: "2.2.4",
        name: "内在叙事结构",
        nameEn: "Internal Narrative Structure",
        description: "Personal narrative patterns",
        children: {
          "2.2.4.1": {
            code: "2.2.4.1",
            name: "英雄型",
            nameEn: "Hero Type"
          },
          "2.2.4.2": {
            code: "2.2.4.2",
            name: "受害者型",
            nameEn: "Victim Type"
          },
          "2.2.4.3": {
            code: "2.2.4.3",
            name: "反抗型",
            nameEn: "Rebel Type"
          },
          "2.2.4.4": {
            code: "2.2.4.4",
            name: "迷失型",
            nameEn: "Lost Type"
          },
          "2.2.4.5": {
            code: "2.2.4.5",
            name: "探索者型",
            nameEn: "Explorer Type"
          }
        }
      }
    }
  },
  "2.3": {
    code: "2.3",
    name: "关系模式",
    nameEn: "Relational Patterns",
    description: "Interpersonal relationship patterns",
    children: {
      "2.3.1": {
        code: "2.3.1",
        name: "依恋结构",
        nameEn: "Attachment Structure",
        description: "Attachment style patterns",
        children: {
          "2.3.1.1": {
            code: "2.3.1.1",
            name: "安全型",
            nameEn: "Secure"
          },
          "2.3.1.2": {
            code: "2.3.1.2",
            name: "焦虑型",
            nameEn: "Anxious"
          },
          "2.3.1.3": {
            code: "2.3.1.3",
            name: "回避型",
            nameEn: "Avoidant"
          },
          "2.3.1.4": {
            code: "2.3.1.4",
            name: "混乱型",
            nameEn: "Disorganized"
          }
        }
      },
      "2.3.2": {
        code: "2.3.2",
        name: "冲突触发点",
        nameEn: "Conflict Triggers",
        description: "Relationship conflict triggers"
      },
      "2.3.3": {
        code: "2.3.3",
        name: "共情能力",
        nameEn: "Empathy",
        description: "Ability to empathize with others"
      },
      "2.3.4": {
        code: "2.3.4",
        name: "内在冲突度",
        nameEn: "Internal Conflict Level",
        description: "Level of internal psychological conflict"
      }
    }
  },
  "2.4": {
    code: "2.4",
    name: "性格类型",
    nameEn: "Personality Type",
    description: "Personality type classification"
  },
  "2.5": {
    code: "2.5",
    name: "成长指数与变化潜能",
    nameEn: "Growth Index & Change Potential",
    description: "Capacity for growth and change",
    children: {
      "2.5.1": {
        code: "2.5.1",
        name: "洞察深度",
        nameEn: "Insight Depth",
        description: "Depth of self-insight"
      },
      "2.5.2": {
        code: "2.5.2",
        name: "内在可塑性",
        nameEn: "Internal Plasticity",
        description: "Psychological flexibility and adaptability"
      },
      "2.5.3": {
        code: "2.5.3",
        name: "心灵韧性",
        nameEn: "Psychological Resilience",
        description: "Mental resilience and recovery capacity"
      }
    }
  }
};

/**
 * Get category node by code
 */
export function getCategoryNode(code: string): CategoryNode | null {
  // Direct lookup first (for top-level codes like "2.1", "2.2", etc.)
  if (CATEGORY_HIERARCHY[code]) {
    return CATEGORY_HIERARCHY[code];
  }

  // For nested codes like "2.2.1" or "2.2.2.1", traverse the hierarchy
  const parts = code.split('.');

  // Must have at least 3 parts for nested codes (e.g., "2.2.1")
  if (parts.length < 3) {
    return null;
  }

  // Start with top-level node (e.g., "2.2" for code "2.2.1")
  const topLevelKey = `${parts[0]}.${parts[1]}`;
  let current = CATEGORY_HIERARCHY[topLevelKey];

  if (!current) {
    return null;
  }

  // If it's a 2-level code (e.g., "2.2"), we already have it
  if (parts.length === 2) {
    return current;
  }

  // Traverse children for deeper levels (e.g., "2.2.1" → "2.2.2.1")
  for (let i = 2; i < parts.length; i++) {
    const key = parts.slice(0, i + 1).join('.');
    if (current.children && current.children[key]) {
      current = current.children[key];
    } else {
      return null;
    }
  }

  return current;
}

/**
 * Get category display name
 */
export function getCategoryName(code: string): string {
  const node = getCategoryNode(code);
  return node ? node.name : code;
}

/**
 * Get category full label (code + name)
 */
export function getCategoryLabel(code: string): string {
  const node = getCategoryNode(code);
  return node ? `${code} - ${node.name}` : code;
}

/**
 * Flatten hierarchy for dropdown/search
 */
export function flattenHierarchy(): Array<{
  code: string;
  name: string;
  nameEn: string;
  label: string;
  level: number;
  hasChildren: boolean;
}> {
  const result: Array<{
    code: string;
    name: string;
    nameEn: string;
    label: string;
    level: number;
    hasChildren: boolean;
  }> = [];

  function traverse(nodes: Record<string, CategoryNode>, level: number) {
    Object.values(nodes).forEach(node => {
      result.push({
        code: node.code,
        name: node.name,
        nameEn: node.nameEn,
        label: `${node.code} - ${node.name}`,
        level,
        hasChildren: !!node.children
      });

      if (node.children) {
        traverse(node.children, level + 1);
      }
    });
  }

  traverse(CATEGORY_HIERARCHY, 0);
  return result;
}
