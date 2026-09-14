'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { FALLING_COUNT, FALLING_ON_STAIRS, type FallingRound } from '@/data/cognitiveScreen';
import { ItemGlyph } from './ItemGlyph';

interface FallingFruitProps {
  round: FallingRound;
  /** Picked ids, in the order the user tapped them. */
  picked: string[];
  onChange: (picked: string[]) => void;
  /**
   * Fired once the last fruit has landed. Watching is not something the user can
   * hurry, so the step's clock only starts here.
   */
  onAnswerPhase: () => void;
}

/**
 * 滚下来的水果 — the light game.
 *
 * Six fruits sit on a staircase; the user gets a few seconds to look at them,
 * a cover comes down, and then three of them roll out from behind it one at a
 * time. Afterwards: which three, in what order.
 *
 * It measures what a word list measures — hold a short sequence over a few
 * seconds and reproduce it — while looking like a game. Real objects, in colour,
 * in motion, and no reasoning asked for.
 *
 * The cover is load-bearing, not decoration. If the fruits that never fall stay
 * on screen, the cheapest way to answer is to memorise those and answer by
 * elimination — a different and easier task than the one we mean to set.
 *
 * A `backward` round is the same screen asked the other way round: last fruit
 * first. Which way it will be is said before the fruits roll and again while they
 * are rolling, never only afterwards. Springing the reversal at the end would
 * turn it into a trick — the user would have watched with the wrong intention,
 * and what the item is for is whether a sequence can be *reversed*, not whether
 * the instruction was read carefully.
 */

const STEPS = FALLING_ON_STAIRS;
/**
 * Step spacing as a share of the frame. One step fewer than before buys every
 * fruit more room, and the spacing is what caps how large a fruit can be drawn
 * without touching the one on the next step.
 */
const STEP_GAP = 15;
const STEP_X = (index: number) => 9 + index * STEP_GAP;
const STEP_Y = (index: number) => 9 + index * STEP_GAP;

/**
 * Floor on how long the fruits are visible before the cover drops. Six fruits at
 * a second each was the whole budget at 6s, and this stretch auto-advances
 * whether or not the user has finished looking, so it has to be generous; anyone
 * who is done presses 看好了，开始.
 */
const PREVIEW_MS = 9000;
/**
 * Time from one fruit starting its roll to the next one starting. It has to cover
 * the roll itself *plus* a pause with the fruit sitting still, because the roll
 * is when the fruit is hardest to read and the pause is when it is actually
 * identified. 1.5s, then 1.9s, both came back as too fast to recognise and
 * remember — the item then measures naming speed rather than memory.
 */
const ROLL_INTERVAL_MS = 3200;
const ROLL_SECONDS_PER_STEP = 0.34;
/**
 * Where a fruit comes to rest, in the same 0–100 space as the stairs: just off
 * the bottom step, far enough inside the frame that a w-32 glyph is not clipped
 * on either a square phone frame or a 4:3 desktop one.
 */
const LAND_X = 86;
const LAND_Y = 86;

/** Keyframes for a fruit leaving step `from`: one per step down, then the floor. */
const rollPath = (from: number) => {
  const hops = STEPS - from;
  return {
    tops: [...Array.from({ length: hops }, (_, n) => `${STEP_Y(from + n)}%`), `${LAND_Y}%`],
    lefts: [...Array.from({ length: hops }, (_, n) => `${STEP_X(from + n)}%`), `${LAND_X}%`],
    seconds: Math.max(0.9, hops * ROLL_SECONDS_PER_STEP),
  };
};

type Phase = 'preview' | 'watch' | 'answer';

/** The stepped ramp the fruits sit on, in the same 0–100 space as the fruits. */
const Staircase: React.FC = () => {
  const points = useMemo(() => {
    const parts: string[] = [];
    for (let i = 0; i < STEPS; i++) {
      parts.push(`${STEP_X(i) - 7},${STEP_Y(i) + 11}`);
      parts.push(`${STEP_X(i) + 12},${STEP_Y(i) + 11}`);
    }
    parts.push('100,100', `${STEP_X(0) - 7},100`);
    return parts.join(' ');
  }, []);

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <polygon points={points} fill="rgba(148,163,184,0.14)" stroke="rgba(148,163,184,0.35)" strokeWidth="0.5" />
    </svg>
  );
};

export const FallingFruit: React.FC<FallingFruitProps> = ({
  round,
  picked,
  onChange,
  onAnswerPhase,
}) => {
  const [phase, setPhase] = useState<Phase>('preview');
  /** How many of the three have started rolling. */
  const [rolled, setRolled] = useState(0);
  const backward = round.direction === 'backward';

  const stairIndex = useMemo(() => {
    const map = new Map<string, number>();
    round.stair.forEach((item, index) => map.set(item.id, index));
    return map;
  }, [round]);

  // Preview -> watch. A tap can bring it forward; this is the floor, not a wait.
  useEffect(() => {
    if (phase !== 'preview') return;
    const timer = setTimeout(() => setPhase('watch'), PREVIEW_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // The parent's callback identity changes as answers come in, and this effect
  // must not restart when it does — a restarted timer means a fruit that never
  // rolls.
  const answerPhaseRef = useRef(onAnswerPhase);
  useEffect(() => {
    answerPhaseRef.current = onAnswerPhase;
  }, [onAnswerPhase]);

  // One fruit every ROLL_INTERVAL_MS, then straight into the answer phase.
  useEffect(() => {
    if (phase !== 'watch') return;
    if (rolled >= round.fell.length) {
      const done = setTimeout(() => {
        setPhase('answer');
        answerPhaseRef.current();
      }, ROLL_INTERVAL_MS);
      return () => clearTimeout(done);
    }
    const timer = setTimeout(() => setRolled((count) => count + 1), rolled === 0 ? 400 : ROLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [phase, rolled, round.fell.length]);

  const toggle = (id: string) => {
    if (picked.includes(id)) {
      onChange(picked.filter((value) => value !== id));
      return;
    }
    if (picked.length >= FALLING_COUNT) return;
    onChange([...picked, id]);
  };

  if (phase === 'answer') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {round.stair.map((item) => {
            const order = picked.indexOf(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                aria-pressed={order !== -1}
                aria-label={item.label}
                className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                  order !== -1
                    ? 'border-violet-400 bg-violet-500/20 ring-2 ring-violet-400/40'
                    : 'border-white/10 bg-slate-800/50 hover:border-violet-400/40'
                }`}
              >
                <ItemGlyph itemId={item.id} className="w-16 h-16 md:w-20 md:h-20" />
                <span className="text-xs md:text-sm text-slate-300">{item.label}</span>
                {order !== -1 && (
                  <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center tabular-nums">
                    {order + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Their own taps read back to them in order. Without this, checking a
            sequence means finding small numbered badges scattered across the
            grid — the user ends up holding their own answer in memory too. */}
        {picked.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {picked.map((id, order) => {
              const item = round.stair.find((candidate) => candidate.id === id);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-400/30 text-xs text-violet-100"
                >
                  <span className="w-4 h-4 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {order + 1}
                  </span>
                  {item?.label}
                </span>
              );
            })}
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4 transition-colors"
            >
              重选
            </button>
          </div>
        )}

        <p className="text-xs text-slate-500 text-center leading-relaxed">
          记得几样就点几样，{backward ? '从最后滚下来的那样倒着点' : '按滚下来的先后顺序点'}
          （点一下可取消）。
          <br className="md:hidden" />
          顺序拿不准也没关系——认出是哪几样就有分。
        </p>
      </div>
    );
  }

  const covered = phase === 'watch';
  /**
   * Only the fruit rolling right now is on screen, and it stays where it lands
   * until the next one starts — the still fruit is what gets recognised, the
   * rolling one is mostly a blur. Earlier fruits are cleared rather than left in
   * a pile: a pile is the answer, on screen, no memory required.
   */
  const rolling = covered && rolled > 0 ? round.fell[rolled - 1] : undefined;
  const path = rolling === undefined ? undefined : rollPath(stairIndex.get(rolling) ?? 0);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Square on a phone, wider on a desktop: the staircase spans the frame
          diagonally, so on a narrow screen height is what buys the fruits room
          to be drawn at a size worth looking at. */}
      <div className="relative w-full aspect-square md:aspect-[4/3] rounded-2xl border border-white/10 bg-slate-800/30 overflow-hidden">
        <Staircase />

        {/* On the stairs, until the cover drops. */}
        {!covered &&
          round.stair.map((item, index) => (
            <span
              key={item.id}
              className="absolute"
              style={{
                left: `${STEP_X(index)}%`,
                top: `${STEP_Y(index)}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Capped by the step spacing, not by taste: neighbouring steps are
                  STEP_GAP apart on each axis, so a glyph much larger than this
                  would overlap its neighbour on the stairs. */}
              <ItemGlyph itemId={item.id} className="w-16 h-16 md:w-24 md:h-24" />
            </span>
          ))}

        {covered && (
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
          />
        )}

        {/* The rolling fruit, drawn above the cover. */}
        {rolling !== undefined && path && (
          <motion.span
            // The id is the key, so each fruit mounts fresh and replays its roll
            // instead of inheriting where the previous one came to rest.
            key={rolling}
            className="absolute z-10"
            style={{ translateX: '-50%', translateY: '-50%' }}
            initial={{ top: path.tops[0], left: path.lefts[0], rotate: 0 }}
            // A single turn, not two: the fruit is the only thing on screen to
            // identify, and spinning it twice on the way down makes it a blur.
            animate={{ top: path.tops, left: path.lefts, rotate: 360 }}
            transition={{ duration: path.seconds, ease: 'easeIn' }}
          >
            {/* The roller is the thing the user has to identify, and it is alone
                on screen, so it is drawn larger than on the stairs. */}
            <ItemGlyph itemId={rolling} className="w-20 h-20 md:w-32 md:h-32" />
          </motion.span>
        )}
      </div>

      {phase === 'preview' ? (
        <div className="text-center space-y-3">
          <p className="text-sm text-slate-300">
            台阶上有 {STEPS} 样水果。看清楚它们分别是什么，等一下有 {FALLING_COUNT} 样会滚下来。
          </p>
          {backward && (
            // Said before the round starts, not after: see the note at the top.
            <p className="text-sm font-semibold text-amber-200">
              这一轮反过来——等下要请你从<span className="underline underline-offset-4">最后</span>
              滚下来的那样开始，倒着说回第一样。
            </p>
          )}
          <button
            type="button"
            onClick={() => setPhase('watch')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-purple-500 transition-all"
          >
            看好了，开始
          </button>
        </div>
      ) : (
        <p className="text-sm text-violet-200 text-center">
          看着它们滚下来——记住是哪 {FALLING_COUNT} 样
          {backward ? '（等下要倒着说）' : '（顺序记得住更好）'}（
          {Math.min(rolled, round.fell.length)}/{round.fell.length}）
        </p>
      )}
    </div>
  );
};

FallingFruit.displayName = 'FallingFruit';
