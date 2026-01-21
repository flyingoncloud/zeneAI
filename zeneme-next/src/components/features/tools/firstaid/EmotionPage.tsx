import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useZenemeStore, MoodLog } from '../../../../hooks/useZenemeStore';
import { ZeneMeEmotions } from '../../../ui/ZeneMeEmotions';

interface EmotionPageProps {
  onComplete: () => void;
  onBack?: () => void;
}

// Mapping index to mood strings
const indexToMoodMap: Record<number, MoodLog['mood']> = {
  0: 'Anxious',
  1: 'Sad',
  2: 'Angry',
  3: 'Happy',
  4: 'Relieved',
  5: 'Confused',
  6: 'Tired',
  7: 'Grateful'
};

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
      const emotionsList: MoodLog['mood'][] = [
        'Anxious',
        'Sad',
        'Angry',
        'Happy',
        'Relieved',
        'Confused',
        'Tired',
        'Grateful'
      ];
      if (emotionsList[selectedEmotion]) {
        moodToSave = emotionsList[selectedEmotion];
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
      note: `Emotional First Aid Session. Intensity: ${intensity}/100`
    });

    onComplete();
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

        {/* Main Card Container */}
        <div className="relative z-10 w-full max-w-4xl px-6 md:px-8">
          <div
            className="backdrop-blur-xl bg-slate-900/60 rounded-[24px] px-7 py-6 shadow-2xl border border-white/10 flex flex-col gap-6"
            style={{
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Emotions Scroll Container */}
            <div className="w-full overflow-x-auto py-4 -my-4 scrollbar-hide">
              {/* 
                目标：
                - 尽量铺满一行：justify-between + 每个 item flex-1
                - 放大：icon wrapper / icon size / label 字号
                - 居中：items-center
                - 屏幕太窄：仍可横向滚动（外层 overflow-x-auto）
              */}
              <div className="w-full px-2">
                <div className="min-w-[760px] w-full flex flex-row items-start justify-between gap-4">
                  {ZeneMeEmotions.map((EmotionIcon, idx) => {
                    const isSelected = selectedEmoji === idx;
                    const label = t.emotion.emotions?.[idx] ?? '';

                    return (
                      <div
                        key={`emotion-${idx}`}
                        className="flex-1 min-w-[90px] flex flex-col items-center gap-4"
                      >
                        {/* Icon Wrapper */}
                        <div className="relative w-[78px] h-[78px] flex items-center justify-center z-20 mb-2">
                          {/* Selection Ring */}
                          {isSelected && (
                            <div
                              className="absolute pointer-events-none z-30"
                              style={{
                                inset: '-7px',
                                borderRadius: '24px',
                                border: '2px solid rgba(160,120,255,0.9)',
                                boxShadow:
                                  '0 0 0 1px rgba(160,120,255,0.25), 0 0 18px rgba(160,120,255,0.22)',
                              }}
                            />
                          )}

                          {/* Icon Button */}
                          <button
                            onClick={() => {
                              setSelectedEmoji(idx);
                              setSelectedEmotion(idx);
                            }}
                            className={`
                              relative z-20 w-full h-full flex items-center justify-center transition-all duration-300 rounded-[20px]
                              ${
                                isSelected
                                  ? 'bg-violet-500/10 scale-100'
                                  : 'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 opacity-90 hover:opacity-100'
                              }
                            `}
                          >
                            <div className="w-full h-full flex items-center justify-center overflow-visible">
                              <EmotionIcon
                                size={74}
                                className="filter drop-shadow-sm transition-transform duration-300 overflow-visible"
                              />
                            </div>
                          </button>
                        </div>

                        {/* Label Button */}
                        <button
                          onClick={() => {
                            setSelectedEmotion(idx);
                            setSelectedEmoji(idx);
                          }}
                          className={`
                            relative z-10 w-full max-w-[110px] h-[38px] rounded-full text-sm font-medium transition-all flex items-center justify-center
                            whitespace-nowrap
                            ${
                              selectedEmotion === idx
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                            }
                          `}
                        >
                          {label}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Intensity Slider Section */}
            <div className="w-full">
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
