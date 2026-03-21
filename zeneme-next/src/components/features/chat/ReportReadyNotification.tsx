'use client';

import React from 'react';
import { motion } from 'motion/react';

interface ReportReadyNotificationProps {
  onViewReport: () => void;
}

export const ReportReadyNotification: React.FC<ReportReadyNotificationProps> = ({
  onViewReport,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 120 }}
      className="
        relative overflow-hidden rounded-2xl
        bg-slate-900/60 backdrop-blur-xl
        border border-violet-500/20
        shadow-[0_0_20px_rgba(139,92,246,0.3)]
        p-5
      "
    >
      <p className="text-[15px] leading-relaxed text-white/90 font-medium tracking-wide">
        你的内视觉察报告已就绪
      </p>
      <p className="mt-1 text-sm text-white/50 font-light">
        基于对话中收集的测评数据，可以生成你的心理洞察报告
      </p>

      <button
        type="button"
        onClick={onViewReport}
        className="
          mt-4 w-full px-4 py-2.5
          text-sm font-medium text-white
          rounded-xl
          bg-gradient-to-r from-violet-600/80 to-purple-600/80
          hover:from-violet-500 hover:to-purple-500
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-1 focus:ring-offset-slate-900
        "
      >
        查看报告
      </button>
    </motion.div>
  );
};

ReportReadyNotification.displayName = 'ReportReadyNotification';
