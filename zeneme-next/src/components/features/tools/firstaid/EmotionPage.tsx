import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useZenemeStore, MoodLog } from '../../../../hooks/useZenemeStore';
import { ZeneWeEmotions } from '../../../ui/ZeneMeEmotions';


interface EmotionPageProps {
  onComplete: (emotionData: { emotion: string; intensity: number }) => void;
  onBack?: () => void;
}

// --- Color interpolation helpers ---
function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}
function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return '#' + [r, g, bl].map(c => c.toString(16).padStart(2, '0')).join('');
}

// Pre-computed 8 position colors per row
const POS_COLORS = Array.from({ length: 8 }, (_, i) => lerpColor('#FFD54A', '#FF8A00', i / 7));
const NEG_COLORS = Array.from({ length: 8 }, (_, i) => lerpColor('#3A7BFF', '#8A3DFF', i / 7));

// Mapping index → mood string (new display order)
const indexToMoodMap: Record<number, MoodLog['mood']> = {
  // Positive (0-7): 平静→满足→温暖→自信→好奇→期待→感激→开心
  0: 'Calm',
  1: 'Satisfied',
  2: 'Warm',
  3: 'Confident',
  4: 'Curious',
  5: 'Expectant',
  6: 'Grateful',
  7: 'Happy',
  // Negative (8-15): 孤独→压抑→委屈→悲伤→迷茫→焦虑→害怕→愤怒
  8: 'Lonely',
  9: 'Repressed',
  10: 'Wronged',
  11: 'Sad',
  12: 'Confused',
  13: 'Anxious',
  14: 'Scared',
  15: 'Angry'
};

const LABELS = [
  '平静', '满足', '温暖', '自信', '好奇', '期待', '感激', '开心',
  '孤独', '压抑', '委屈', '悲伤', '迷茫', '焦虑', '害怕', '愤怒'
];

export function EmotionPage({ onComplete, onBack }: EmotionPageProps) {
  const { t, language, logMood } = useZenemeStore();
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<number | null>(null);
  const [intensity, setIntensity] = useState(50);


  const handleSave = () => {
    // Determine the mood to save
    let moodToSave: MoodLog['mood'] = 'Neutral';

    // Priority 1: Text selection
    if (selectedEmotion !== null) {
      if (indexToMoodMap[selectedEmotion]) {
        moodToSave = indexToMoodMap[selectedEmotion];
      }
    }
    // Priority 2: Emoji selection
    else if (selectedEmoji !== null) {
      moodToSave = indexToMoodMap[selectedEmoji] || 'Neutral';
    }

    const today = new Date().toISOString().split('T')[0];

    logMood({
      date: today,
      mood: moodToSave,
      intensity: intensity,
      note: `Emotional First Aid Session. Intensity: ${intensity}/100`
    });

    onComplete({ emotion: moodToSave, intensity });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-transparent z-50">
      <div className="w-full h-full relative flex flex-col items-center justify-center z-10">

        {/* Top Content (Title etc.) */}
        <div className="absolute top-12 left-0 right-0 z-10 px-6 md:px-12">
          <div className="max-w-4xl mx-auto mt-[30px]">
            <div className="mb-8">
              <div className="inline-block px-4 py-2 rounded-full bg-slate-900/60 backdrop-blur-md text-slate-300 text-sm mb-4 border border-white/10">
                {t.emotion.stepLabel}
              </div>
              <div className="h-2 bg-white/10 backdrop-blur-md rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-violet-400 w-2/3 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
              </div>
            </div>

            <h1 className="text-4xl text-white mb-4 tracking-wide text-shadow-md">
              {t.emotion.title}
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl">
              {t.emotion.description}
            </p>
          </div>
        </div>

        {/*
            Main Card Container
        */}
        <div className="relative z-10 w-full max-w-5xl px-4 md:px-8">
          <div
            className="backdrop-blur-xl bg-slate-900/60 rounded-[24px] px-4 py-6 shadow-2xl border border-white/10 flex flex-col gap-6 mx-auto w-full"
            style={{
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
              maxWidth: 'clamp(340px, 78vw, 720px)', // ✅ 手机-平板-桌面自适应
              transform: 'translateY(70px)', 
            }}
          >
            {/*
                Emotions Scroll Container
            */}
            <div className="w-full max-w-full overflow-x-auto custom-scrollbar pb-2"
                style={{
                      overflowX: 'auto',     // ✅ 强制
                      overflowY: 'hidden',   // ✅ 避免竖向出现
                      WebkitOverflowScrolling: 'touch',
                      touchAction: 'pan-x',
                      scrollbarGutter: 'stable', // ✅ 桌面端更容易看到滚动条
                      }}>
              {/* 2. 注入滚动条样式 (针对 Webkit 内核浏览器如 Chrome/Safari/大多数手机浏览器) */}
              <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar {
                  height: 8px !important; /* 稍微加高一点 */
                  display: block;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: rgba(0, 0, 0, 0.2) !important; /* 轨道背景色 */
                  border-radius: 99px;
                  margin: 0 20px; /* 左右留白，不让滚动条贴边 */
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.2) !important; /* 滑块颜色 */
                  border-radius: 99px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(255, 255, 255, 0.4) !important;
                }
                /* Firefox 兼容 */
                .custom-scrollbar {
                  scrollbar-width: thin;
                  scrollbar-color: rgba(255, 255, 255, 0.5) rgba(0, 0, 0, 0.2);
                }  
              `}} />
              <div
                className="grid gap-x-2 gap-y-3 justify-items-center"
                style={{ minWidth: '700px', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}
                >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((idx) => {
                  const isPos = idx < 8;
                  const label = LABELS[idx];
                  const isSelected = selectedEmoji === idx;

                  const EmotionIcon = ZeneWeEmotions[idx];
                  const iconColor = isPos ? POS_COLORS[idx] : NEG_COLORS[idx - 8];

                  return (
                    <div key={`mood-${idx}`} className="flex flex-col items-center gap-2">
                       {/* Icon */}
                       <div
                         className="relative w-[56px] h-[56px] flex items-center justify-center z-20"
                       >
                         {isSelected && (
                           <div
                             className="absolute pointer-events-none z-30"
                             style={{
                               inset: '-6px',
                               borderRadius: '20px',
                               border: `2px solid ${isPos ? 'rgba(251, 191, 36, 0.9)' : 'rgba(160,120,255,0.9)'}`, // Gold for Pos, Purple for Neg
                               boxShadow: isPos
                                 ? '0 0 0 1px rgba(251, 191, 36, 0.3), 0 0 18px rgba(251, 191, 36, 0.4)'
                                 : '0 0 0 1px rgba(160,120,255,0.25), 0 0 18px rgba(160,120,255,0.22)'
                             }}
                           />
                         )}
                         <button
                           onClick={() => {
                             setSelectedEmoji(idx);
                             setSelectedEmotion(idx);
                           }}
                           className={`
                             relative z-20 w-full h-full flex items-center justify-center transition-all duration-300 rounded-[18px]
                             ${
                                isSelected
                                 ? 'bg-white/10 scale-100'
                                 : 'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 opacity-90 hover:opacity-100'
                             }
                           `}
                         >
                            <div className="w-full h-full flex items-center justify-center overflow-visible">
                               <EmotionIcon size={56} color={iconColor} className="filter drop-shadow-sm transition-transform duration-300" />
                            </div>
                         </button>
                       </div>

                       {/* Label */}
                       <button
                         onClick={() => {
                             setSelectedEmotion(idx);
                             setSelectedEmoji(idx);
                         }}
                         className={`
                           w-[64px] h-[28px] mb-2 rounded-full text-xs font-medium transition-all flex items-center justify-center
                           ${
                             isSelected
                               ? (isPos
                                   ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                                   : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]')
                               : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                           }
                         `}
                         style={{ width: 64, height: 28 }}   // ✅ 强制和设计图一致
                       >
                         {label}
                       </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Intensity Slider Section */}
            <div className="w-full mt-2">
              <label className="block text-white mb-4 tracking-wide font-medium">
                {language === 'zh' ? '强度' : 'Intensity'}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #8B5CF6 0%, #7c3aed ${intensity}%, rgba(255, 255, 255, 0.1) ${intensity}%, rgba(255, 255, 255, 0.1) 100%)`,
                }}
              />
              <div className="flex justify-between text-sm text-slate-500 mt-2 font-medium">
                <span>{language === 'zh' ? '轻微' : 'Mild'}</span>
                <span>{language === 'zh' ? '强烈' : 'Intense'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-12 left-0 right-0 z-10 px-6 md:px-12">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors backdrop-blur-md bg-white/5 rounded-full border border-white/5"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{t.common.back}</span>
              </button>
            )}

            <button
              onClick={handleSave}
              className="px-8 py-3 rounded-full backdrop-blur-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg ml-auto shadow-[0_0_20px_rgba(139,92,246,0.3)] font-medium tracking-wide"
            >
              {t.emotion.saveAndExit}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}