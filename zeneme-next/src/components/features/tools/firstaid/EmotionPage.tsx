import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useZenemeStore, MoodLog } from '../../../../hooks/useZenemeStore';
import {
  RobotAnxious,
  RobotSad,
  RobotAngry,
  RobotHappy,
  RobotRelieved,
  RobotConfused,
  RobotTired,
  RobotGrateful
} from '../../../ui/RobotEmotions';

interface EmotionPageProps {
  onComplete: (emotionData: { emotion: string; intensity: number }) => void;
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

const robotIcons = [
  RobotAnxious,
  RobotSad,
  RobotAngry,
  RobotHappy,
  RobotRelieved,
  RobotConfused,
  RobotTired,
  RobotGrateful
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
      const emotionsList: MoodLog['mood'][] = ['Anxious', 'Sad', 'Angry', 'Happy', 'Relieved', 'Confused', 'Tired', 'Grateful'];
      if (emotionsList[selectedEmotion]) {
        moodToSave = emotionsList[selectedEmotion];
      }
    }
    // Priority 2: Emoji selection (now Robot selection)
    else if (selectedEmoji !== null) {
      moodToSave = indexToMoodMap[selectedEmoji] || 'Neutral';
    }

    const today = new Date().toISOString().split('T')[0];

    logMood({
      date: today,
      mood: moodToSave,
      note: `Emotional First Aid Session. Intensity: ${intensity}/100`
    });

    // Pass emotion data to parent
    onComplete({
      emotion: moodToSave,
      intensity: intensity
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-transparent z-50">
      <div className="w-full h-full relative flex flex-col items-center justify-center z-10">
        <div className="absolute top-12 left-0 right-0 z-10 px-6 md:px-12">
          <div className="max-w-4xl mx-auto">
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

        <div className="relative z-10 w-full max-w-4xl px-6 md:px-12">
          <div
            className="backdrop-blur-xl bg-slate-900/60 rounded-[24px] p-6 md:p-12 shadow-2xl border border-white/10"
            style={{
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
            }}
          >
            <div className="mb-8">
              {/* Robot Icons Grid */}
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4 mb-8">
                {['😰', '😢', '😠', '😄', '😌', '😕', '😴', '🥰'].map((emoji, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedEmoji(idx);
                      // Auto-select corresponding word if possible
                      setSelectedEmotion(idx);
                    }}
                    className={`relative rounded-2xl transition-all duration-300 group p-2 ${
                      selectedEmoji === idx
                        ? 'bg-violet-500/10 scale-110 shadow-[0_0_20px_rgba(139,92,246,0.2)] border border-violet-500/30 ring-1 ring-violet-400/30'
                        : 'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="w-full aspect-square flex items-center justify-center">
                      <span className="text-4xl md:text-5xl select-none leading-none filter drop-shadow-sm">{emoji}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <div className="flex flex-wrap gap-3">
                {t.emotion.emotions.map((emotion: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedEmotion(idx);
                      // Auto-select corresponding emoji if possible
                      setSelectedEmoji(idx);
                    }}
                    className={`px-5 py-2.5 rounded-full transition-all ${
                      selectedEmotion === idx
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-0">
              <label className="block text-white mb-3 tracking-wide">
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
              <div className="flex justify-between text-sm text-slate-500 mt-2">
                <span>{language === 'zh' ? '轻微' : 'Mild'}</span>
                <span>{language === 'zh' ? '强烈' : 'Intense'}</span>
              </div>
            </div>
          </div>
        </div>

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
              className="px-8 py-3 rounded-full backdrop-blur-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg ml-auto shadow-[0_0_20px_rgba(139,92,246,0.3)]"
            >
              {t.emotion.saveAndExit}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
