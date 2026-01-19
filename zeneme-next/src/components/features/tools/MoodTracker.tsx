import React, { useState } from 'react';
import * as Icons from '../../ui/icons';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { useZenemeStore, MoodLog } from '../../../hooks/useZenemeStore';

// NOTE: 不改 imports 的前提下，避免 eslint 报未使用（不影响运行逻辑）
void DialogTrigger;

type IconLikeProps = {
  size?: number | string;
  className?: string;
  color?: string;
  strokeWidth?: number;
  [key: string]: unknown;
};

type IconLike = React.ComponentType<IconLikeProps>;

const SafeIcon = ({ icon: Icon, ...props }: { icon?: IconLike } & IconLikeProps) => {
  if (!Icon) {
    const size = props.size ?? 24;
    return (
      <span
        style={{
          width: typeof size === 'number' ? `${size}px` : size,
          height: typeof size === 'number' ? `${size}px` : size,
          display: 'inline-block',
          background: '#ccc',
          borderRadius: 4,
        }}
      />
    );
  }
  return <Icon {...props} />;
};

const MOOD_COLORS = {
  Happy: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
  Calm: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
  Anxious: 'bg-orange-500/20 text-orange-200 border-orange-500/30',
  Sad: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
  Overwhelmed: 'bg-red-500/20 text-red-200 border-red-500/30',
  Neutral: 'bg-gray-500/20 text-gray-200 border-gray-500/30',
} as const;

type MoodKey = keyof typeof MOOD_COLORS;

export const MoodTracker: React.FC = () => {
  const { moodLogs, logMood, t } = useZenemeStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Form State
  const [newMood, setNewMood] = useState<MoodKey>('Neutral');
  const [newNote, setNewNote] = useState('');

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getMoodForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return moodLogs.find((log) => log.date === dateStr);
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const log = moodLogs.find((l) => l.date === dateStr);

    // Set form defaults
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    if (log) {
      // log.mood 可能来自 store 的类型；这里保证落在我们支持的 key 上
      const moodValue = (Object.keys(MOOD_COLORS) as MoodKey[]).includes(log.mood as MoodKey)
        ? (log.mood as MoodKey)
        : 'Neutral';
      setNewMood(moodValue);
      setNewNote(log.note || '');
    } else {
      setNewMood('Neutral');
      setNewNote('');
    }
    setIsLogModalOpen(true);
  };

  const handleSaveMood = async () => {
    if (!selectedDate) return;
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

    const payload: MoodLog = {
      date: dateStr,
      // 关键：不再使用 any；并且保持原逻辑（把当前选择的情绪写入 store）
      mood: newMood as unknown as MoodLog['mood'],
      note: newNote,
    };

    logMood(payload);

    // Note: MoodTracker is a standalone mood logging feature.
    // emotion_labeling is a step within emotional_first_aid module, not a standalone module.
    // Module completion for emotional_first_aid is handled in EmotionalFirstAid.tsx.

    setIsLogModalOpen(false);
  };

  const renderCalendar = () => {
    const days = [];
    // Empty cells for offset
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-900/10 backdrop-blur-sm" />);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const mood = getMoodForDate(day);
      const isToday =
        day === new Date().getDate() &&
        currentDate.getMonth() === new Date().getMonth() &&
        currentDate.getFullYear() === new Date().getFullYear();

      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(day)}
          className={`
            h-24 md:h-32 border border-white/5 p-2 relative cursor-pointer hover:bg-white/5 transition-all group backdrop-blur-sm
            ${isToday ? 'ring-2 ring-inset ring-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.2)]' : ''}
            ${mood ? MOOD_COLORS[(mood.mood as MoodKey) ?? 'Neutral'] + ' bg-opacity-30 border-opacity-50' : 'bg-slate-900/20'}
          `}
        >
          <span className={`text-sm font-medium ${isToday ? 'text-violet-400' : 'text-slate-500'}`}>{day}</span>

          {mood && (
            <div className="mt-2">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                  MOOD_COLORS[(mood.mood as MoodKey) ?? 'Neutral']
                } shadow-[0_0_5px_currentColor]`}
              >
                {t.mood.moods[mood.mood as keyof typeof t.mood.moods] || mood.mood}
              </span>
              {mood.note && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 md:line-clamp-3 leading-tight opacity-80">
                  {mood.note}
                </p>
              )}
            </div>
          )}

          {!mood && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <SafeIcon icon={Icons.Plus} className="text-violet-400" />
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="flex flex-col h-full bg-transparent p-6 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full h-full flex flex-col">
        <div className="flex justify-between items-center mb-6 backdrop-blur-sm p-4 rounded-xl bg-slate-900/20 border border-white/5">
          <h2 className="text-2xl font-bold text-white tracking-wide">{t.mood.title}</h2>
          <div className="flex items-center gap-4 bg-slate-900/60 p-1 rounded-lg border border-white/10 shadow-sm backdrop-blur-md">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="text-slate-400 hover:text-white hover:bg-white/5">
              <SafeIcon icon={Icons.ChevronLeft} size={18} />
            </Button>
            <span className="font-semibold w-32 text-center text-white">
              {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="text-slate-400 hover:text-white hover:bg-white/5">
              <SafeIcon icon={Icons.ChevronRight} size={18} />
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-slate-900/30 rounded-3xl shadow-xl border border-white/10 overflow-hidden flex flex-col backdrop-blur-md">
          <div className="grid grid-cols-7 border-b border-white/5 bg-slate-900/40">
            {t.mood.days.map((d) => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-1 overflow-y-auto">
            {renderCalendar()}
          </div>
        </div>
      </div>

      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="bg-slate-900/90 border-white/10 text-white backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white tracking-wide">
              {t.mood.logMood} - {selectedDate ? `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-400">{t.mood.subtitle}</Label>
              <Select
                value={newMood}
                onValueChange={(v: string) => setNewMood(v as MoodKey)}
              >
                <SelectTrigger className="bg-slate-800/50 border-white/10 text-white backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/95 border-white/10 text-white backdrop-blur-xl">
                  {(Object.keys(MOOD_COLORS) as MoodKey[]).map((mood) => (
                    <SelectItem key={mood} value={mood} className="text-white hover:bg-violet-500/20 focus:bg-violet-500/20 cursor-pointer">
                      {t.mood.moods[mood as keyof typeof t.mood.moods]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">{t.mood.notePlaceholder}</Label>
              <Textarea
                placeholder={t.mood.notePlaceholder}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="h-32 resize-none bg-slate-800/50 border-white/10 text-white placeholder:text-slate-600 backdrop-blur-sm"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setIsLogModalOpen(false)} className="text-slate-400 hover:text-white">
                {t.common.cancel}
              </Button>
              <Button onClick={handleSaveMood} className="bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                {t.common.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
