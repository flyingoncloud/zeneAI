/**
 * Filters out technical function call text from AI responses
 * Removes patterns like "[调用函数：functions.recommend_module]" and JSON function call data
 *
 * @param content - The raw AI response content
 * @returns Filtered content with technical text removed
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function filterFunctionCallText(content: string | undefined): string {
  if (!content) return '';

  try {
    let filtered = content;

    // Remove [调用函数：...] patterns
    filtered = filtered.replace(/\[调用函数：[^\]]+\]\s*/g, '');

    // Remove JSON objects (function call data)
    // Match JSON objects that contain "module_id" field
    filtered = filtered.replace(/\{\s*"module_id"[\s\S]*?\}/g, '');

    // Clean up extra whitespace and newlines
    filtered = filtered.replace(/\n{3,}/g, '\n\n').trim();

    return filtered;
  } catch (error) {
    console.error('[Content Filter Error]', error);
    // Return original content if filtering fails
    return content;
  }
}

/**
 * Validates that a module object has all required fields
 *
 * @param module - The module object to validate
 * @returns True if module is valid, false otherwise
 */
export function validateModuleData(module: any): boolean {
  return (
    typeof module === 'object' &&
    module !== null &&
    typeof module.module_id === 'string' &&
    typeof module.name === 'string' &&
    typeof module.icon === 'string' &&
    typeof module.description === 'string'
  );
}
