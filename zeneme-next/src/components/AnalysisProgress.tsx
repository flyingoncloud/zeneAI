import React from 'react';

interface AnalysisProgressProps {
  label?: string;
  detail?: string;
  totalSteps?: number;
  currentStep?: number;
  className?: string;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  label = "Analysis Progress",
  detail = "Inner Parts: 2/3",
  totalSteps = 3,
  currentStep = 2,
  className = ""
}) => {
  return (
    <div className={`flex flex-col gap-2 w-64 ${className}`}>
      <div className="flex justify-between items-end mb-1">
        <span className="text-sm font-medium text-slate-400">{label}</span>
        <span className="text-xs text-[#8B5CF6] font-mono shadow-[0_0_10px_rgba(139,92,246,0.3)]">
          {detail}
        </span>
      </div>
      <div className="flex gap-1 h-1.5">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`flex-1 rounded-full transition-all duration-300 ${
              index < currentStep
                ? 'bg-[#8B5CF6] shadow-[0_0_10px_#8B5CF6] border-none'
                : 'bg-transparent border border-[#333333]'
            }`}
            style={{ 
              animationDelay: index < currentStep ? `${index * 150}ms` : '0ms' 
            }}
          />
        ))}
      </div>
    </div>
  );
};
