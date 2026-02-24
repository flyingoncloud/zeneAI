"use client";

import React from 'react';
import { X } from 'lucide-react';
import { isWechat, hasUserDismissedWechatBanner, dismissWechatBanner } from '@/utils/wechatDetection';

/**
 * Banner that suggests opening the app in an external browser when accessed from WeChat
 * Can be dismissed by the user and won't show again
 */
export function WechatBanner() {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Only show if in WeChat and user hasn't dismissed before
    if (isWechat() && !hasUserDismissedWechatBanner()) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    dismissWechatBanner();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600/90 to-blue-600/90 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg">📱</span>
          <p className="text-white text-sm font-medium">
            为获得最佳体验，建议在浏览器中打开
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="关闭提示"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}
