// Quick test to verify getCategoryNode fix
// Run with: node test_category_fix.js

const CATEGORY_HIERARCHY = {
  "2.1": {
    code: "2.1",
    name: "情绪觉察",
    nameEn: "Emotional Awareness"
  },
  "2.2": {
    code: "2.2",
    name: "认知模式",
    nameEn: "Cognitive Patterns",
    children: {
      "2.2.1": {
        code: "2.2.1",
        name: "自我内在系统分析",
        nameEn: "Internal System Analysis"
      },
      "2.2.2": {
        code: "2.2.2",
        name: "自动思维模式",
        nameEn: "Automatic Thought Patterns",
        children: {
          "2.2.2.1": {
            code: "2.2.2.1",
            name: "过度概括",
            nameEn: "Overgeneralization"
          }
        }
      }
    }
  }
};

function getCategoryNode(code) {
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

function getCategoryLabel(code) {
  const node = getCategoryNode(code);
  return node ? `${code} - ${node.name}` : code;
}

// Test cases
console.log('Testing getCategoryNode fix:\n');

const testCases = [
  '2.1',
  '2.2',
  '2.2.1',
  '2.2.2',
  '2.2.2.1',
  '2.3',  // Should return null (not in test data)
  '2.2.2.2'  // Should return null (not in test data)
];

testCases.forEach(code => {
  const label = getCategoryLabel(code);
  const node = getCategoryNode(code);
  console.log(`Code: ${code}`);
  console.log(`  Label: ${label}`);
  console.log(`  Found: ${node ? 'YES' : 'NO'}`);
  if (node) {
    console.log(`  Name: ${node.name}`);
  }
  console.log('');
});
