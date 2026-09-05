'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { Demographics } from '@/data/cognitiveScreen';
import { EDUCATION_BONUS, EDUCATION_BONUS_MAX_YEARS } from '@/data/cognitiveScreen';

interface AboutYouProps {
  onSubmit: (demographics: Demographics) => void;
  onSkip: () => void;
}

const SEX_OPTIONS: Array<{ value: NonNullable<Demographics['sex']>; label: string }> = [
  { value: 'female', label: '女' },
  { value: 'male', label: '男' },
  { value: 'other', label: '其他 / 不便告知' },
];

/** Parses a bounded integer, treating anything out of range as "not given". */
function parseBounded(raw: string, min: number, max: number): number | null {
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value) || value < min || value > max) return null;
  return value;
}

export const AboutYou: React.FC<AboutYouProps> = ({ onSubmit, onSkip }) => {
  const [age, setAge] = useState('');
  const [educationYears, setEducationYears] = useState('');
  const [sex, setSex] = useState<Demographics['sex']>(null);

  const submit = () => {
    onSubmit({
      age: parseBounded(age, 6, 120),
      educationYears: parseBounded(educationYears, 0, 30),
      sex,
    });
  };

  const fieldClass =
    'w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400/60 transition-colors';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full overflow-y-auto flex items-center justify-center p-6"
    >
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-8">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">关于你</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            这几项只用于解读你的分数——受教育年数 ≤ {EDUCATION_BONUS_MAX_YEARS} 年会得到{' '}
            {EDUCATION_BONUS} 分的补偿，和纸笔量表的做法一致。全部可以跳过。
          </p>
        </div>

        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">年龄</span>
            <input
              type="number"
              inputMode="numeric"
              min={6}
              max={120}
              value={age}
              onChange={(event) => setAge(event.target.value)}
              placeholder="例如 68"
              className={fieldClass}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">受教育年数</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={30}
              value={educationYears}
              onChange={(event) => setEducationYears(event.target.value)}
              placeholder="小学 6 · 初中 9 · 高中 12 · 本科 16"
              className={fieldClass}
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm text-slate-300">性别</span>
            <div className="flex flex-wrap gap-2">
              {SEX_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSex(sex === option.value ? null : option.value)}
                  className={`px-4 py-2 rounded-xl border text-sm transition-all ${
                    sex === option.value
                      ? 'border-violet-400/60 bg-violet-500/20 text-violet-100'
                      : 'border-white/10 bg-slate-800/60 text-slate-300 hover:border-white/20'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onSkip}
            className="px-5 py-3 rounded-xl border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition-colors"
          >
            跳过
          </button>
          <button
            type="button"
            onClick={submit}
            className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-500 hover:to-purple-500 transition-all"
          >
            开始测试
          </button>
        </div>
      </div>
    </motion.div>
  );
};

AboutYou.displayName = 'AboutYou';
