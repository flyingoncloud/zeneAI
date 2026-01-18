import React from 'react';
import { motion } from 'motion/react';
import { ReportDetail } from '../reports/ReportDetail';

interface ReportPageProps {
  onClose: () => void;
  reportContent?: string | null;
}

export const ReportPage: React.FC<ReportPageProps> = ({ onClose, reportContent }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-8 bg-black/80 backdrop-blur-sm"
    >
      <div className="w-full h-full md:max-w-4xl md:h-[90vh] bg-[#121212] md:rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(139,92,246,0.1)] border-0 md:border border-white/10 flex flex-col relative text-slate-200">
        <ReportDetail
          onBack={onClose}
          mode="chat"
          reportContent={reportContent}
        />
      </div>
    </motion.div>
  );
};
