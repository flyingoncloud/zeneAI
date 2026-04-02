/**
 * Category Picker with Collapsible Tree View
 *
 * A tree picker for selecting categories from the hierarchy.
 * Shows expandable/collapsible tree structure.
 */

import React, { useState, useMemo } from 'react';
import { CATEGORY_HIERARCHY, type CategoryNode } from '@/data/categoryHierarchy';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface CategoryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  selectedCategory?: string;
  title?: string;
}

export function CategoryPicker({
  isOpen,
  onClose,
  onSelect,
  selectedCategory,
  title = "Select Category"
}: CategoryPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Handle ESC key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Toggle node expansion
  const toggleNode = (code: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  // Expand all nodes when searching
  const effectiveExpandedNodes = useMemo(() => {
    if (searchTerm) {
      // When searching, expand all nodes
      const allCodes = new Set<string>();
      const traverse = (nodes: Record<string, CategoryNode>) => {
        Object.values(nodes).forEach(node => {
          allCodes.add(node.code);
          if (node.children) {
            traverse(node.children);
          }
        });
      };
      traverse(CATEGORY_HIERARCHY);
      return allCodes;
    }
    return expandedNodes;
  }, [searchTerm, expandedNodes]);

  // Filter categories by search term
  const shouldShowNode = (node: CategoryNode, term: string): boolean => {
    if (!term) return true;
    const lowerTerm = term.toLowerCase();
    return (
      node.code.toLowerCase().includes(lowerTerm) ||
      node.name.toLowerCase().includes(lowerTerm) ||
      node.nameEn.toLowerCase().includes(lowerTerm)
    );
  };

  // Check if any descendant matches search
  const hasMatchingDescendant = (node: CategoryNode, term: string): boolean => {
    if (!term || !node.children) return false;

    return Object.values(node.children).some(child => {
      if (shouldShowNode(child, term)) return true;
      return hasMatchingDescendant(child, term);
    });
  };

  // Render tree node recursively
  const renderNode = (node: CategoryNode, level: number = 0) => {
    const hasChildren = node.children && Object.keys(node.children).length > 0;
    const isExpanded = effectiveExpandedNodes.has(node.code);
    const isSelected = node.code === selectedCategory;
    const matchesSearch = shouldShowNode(node, searchTerm);
    const hasMatchingChild = hasMatchingDescendant(node, searchTerm);

    // Hide if doesn't match search and has no matching descendants
    if (searchTerm && !matchesSearch && !hasMatchingChild) {
      return null;
    }

    return (
      <div key={node.code}>
        <button
          onClick={() => {
            // Select this node (any level)
            onSelect(node.code);
            onClose();
          }}
          className={`
            w-full text-left px-4 py-2.5 rounded-lg transition-all flex items-center gap-2
            ${isSelected
              ? 'bg-violet-500/20 border-2 border-violet-500/50'
              : 'border-2 border-transparent hover:bg-white/5 hover:border-white/10'
            }
          `}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren && (
            <span
              className="text-slate-500 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.code);
              }}
            >
              {isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </span>
          )}

          {/* Selection Indicator */}
          {isSelected && (
            <span className="text-violet-400 text-sm shrink-0">●</span>
          )}

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <div className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-slate-200'}`}>
              <span className="text-violet-400 font-mono">{node.code}</span>
              <span className="mx-2 text-slate-600">-</span>
              <span>{node.name}</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {node.nameEn}
            </div>
          </div>
        </button>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div>
            {Object.values(node.children!).map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#1A1B23] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-white/10 shrink-0">
          <input
            type="text"
            placeholder="搜索类别... (按 ESC 关闭)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#0F1115] border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
            autoFocus
          />
          {searchTerm && (
            <p className="text-xs text-slate-500 mt-2">
              提示：搜索时自动展开所有匹配项
            </p>
          )}
        </div>

        {/* Category Tree - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
          <div className="space-y-1">
            {Object.values(CATEGORY_HIERARCHY).map(node => renderNode(node, 0))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center shrink-0">
          <p className="text-xs text-slate-500">
            点击 {searchTerm ? '▼' : '▶'} 展开/收起子类别 | 按 ESC 关闭
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-300 hover:bg-white/5 rounded-lg transition-colors font-medium"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
