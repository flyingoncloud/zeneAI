"use client";

import React from 'react';
import { X, ExternalLink, MoreVertical } from 'lucide-react';
import { isWechat, hasUserDismissedWechatBanner, dismissWechatBanner } from '@/utils/wechatDetection';

/**
 * Banner that suggests opening the app in an external browser when accessed from WeChat
 * Can be dismissed by the user and won't show again
 * Shows instructions when clicked
 */
export function WechatBanner() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [showInstructions, setShowInstructions] = React.useState(false);

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

  const toggleInstructions = () => {
    setShowInstructions(!showInstructions);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600/95 to-blue-600/95 backdrop-blur-sm shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <button
            onClick={toggleInstructions}
            className="flex items-center gap-2 flex-1 text-left"
          >
            <span className="text-lg">📱</span>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">
                为获得最佳体验，建议在浏览器中打开
              </p>
              {!showInstructions && (
                <p className="text-white/70 text-xs mt-0.5">
                  点击查看如何操作 →
                </p>
              )}
            </div>
            <ExternalLink className="w-4 h-4 text-white/80" />
          </button>
          <button
            onClick={handleDismiss}
            className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="关闭提示"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Instructions Dropdown */}
        {showInstructions && (
          <div className="border-t border-white/20 bg-white/10 backdrop-blur-md">
            <div className="px-4 py-4 max-w-7xl mx-auto">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">
                      点击右上角 <MoreVertical className="inline w-4 h-4 mx-1" /> 菜单按钮
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">
                      选择"在浏览器中打开"或"在Safari中打开"
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">
                      在浏览器中享受更好的体验
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/20">
                  <p className="text-white/60 text-xs">
                    💡 提示：由于微信安全限制，无法自动跳转到浏览器
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spacer to prevent content from being hidden under banner */}
      <div className={`${showInstructions ? 'h-[280px]' : 'h-[52px]'} transition-all duration-300`} />
    </>
  );
}
