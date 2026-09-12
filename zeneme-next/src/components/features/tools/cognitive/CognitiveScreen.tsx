'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import {
  buildRecognitionTrials,
  buildSession,
  CELLS_PER_BLOCK,
  DISTRACTORS_PER_BLOCK,
  FAMILY_LABELS,
  TIMING,
  scoreSession,
  type BlockResponse,
  type Demographics,
  type RecognitionTrial,
  type ScreenResult,
} from '@/data/cognitiveScreen';
import { AboutYou } from './AboutYou';
import { CueRecall } from './CueRecall';
import { FallingFruit } from './FallingFruit';
import { ItemGlyph } from './ItemGlyph';
import { PlacementBoard } from './PlacementBoard';
import { ResultView } from './ResultView';
import { SelectionGrid } from './SelectionGrid';
import { TaskFrame } from './TaskFrame';

interface CognitiveScreenProps {
  /** Called when the user exits or finishes; wired to the app's view router. */
  onExit: () => void;
}

type Phase = 'intro' | 'about' | 'task' | 'result';

type Step =
  | { kind: 'encode'; block: number }
  | { kind: 'hold'; block: number }
  | { kind: 'selection'; task: number }
  | { kind: 'recall'; block: number }
  | { kind: 'cue'; block: number }
  | { kind: 'falling' };

function emptyCells(count: number): (string | null)[] {
  return Array.from({ length: count }, () => null);
}

/* ------------------------------------------------------------------ *
 * The intro illustration
 * ------------------------------------------------------------------ */

/**
 * The staircase, in the 0–100 space the SVG and the fruits share. One source for
 * both, so a fruit cannot end up floating in mid-air next to a step — which is
 * what happened when the two were written out by hand separately.
 *
 * `surface` is the height of a step's top as a distance up from the bottom of the
 * frame, because that is what the fruits are positioned against: anchoring to
 * `bottom` rather than centring on `top` keeps a fruit sitting exactly on its
 * step at any panel size, whatever the glyph measures in pixels.
 */
const HERO_STEPS = 4;
const HERO_STEP_LEFT = (index: number) => 8 + index * 24;
const HERO_STEP_WIDTH = 24;
const HERO_SURFACE = (index: number) => 56 - index * 16;
const HERO_CENTRE = (index: number) => HERO_STEP_LEFT(index) + HERO_STEP_WIDTH / 2;

/** Fruits waiting on the steps, top to bottom. */
const HERO_FRUIT = ['apple', 'citrus', 'grape', 'strawberry'];

/** Seconds for one fruit to get from the top step to off the bottom right. */
const HERO_ROLL = 2.4;
/** Pause before the loop starts over. */
const HERO_PAUSE = 1.1;
const HERO_PERIOD = HERO_ROLL + HERO_PAUSE;
/**
 * When the roller lands on step `index`. Its path is one segment onto the top
 * step, one per remaining step, and one off the bottom right — so the landings
 * are evenly spaced through the roll, which is what lets the hops be timed by
 * arithmetic instead of by eye.
 */
const HERO_ARRIVAL = (index: number) => (HERO_ROLL * (index + 1)) / (HERO_STEPS + 1);
/** How long a startled fruit's hop lasts. */
const HERO_HOP = 0.45;

/**
 * The intro illustration: a cherry rolling down the staircase, over and over,
 * while the fruits it passes hop out of surprise.
 *
 * It is a preview rather than a decoration — this is the game in the middle of
 * the screen, animated with the same motion, so by the time anyone reaches it
 * they have already watched the instructions instead of reading them.
 *
 * The hops are timed off the same constants as the roll, so each fruit jumps as
 * the cherry reaches its step rather than on its own unrelated schedule. That
 * timing is the whole joke; without it, five things move at random and the panel
 * just looks busy.
 */
const HeroStaircase: React.FC = () => {
  const points = useMemo(() => {
    const parts: string[] = [];
    for (let i = 0; i < HERO_STEPS; i++) {
      const top = 100 - HERO_SURFACE(i);
      parts.push(`${HERO_STEP_LEFT(i)},${top}`);
      parts.push(`${HERO_STEP_LEFT(i) + HERO_STEP_WIDTH},${top}`);
    }
    parts.push('100,100', `${HERO_STEP_LEFT(0)},100`);
    return parts.join(' ');
  }, []);

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <polygon
        points={points}
        fill="rgba(255,255,255,0.07)"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.6"
      />
    </svg>
  );
};

/**
 * The intro illustration.
 *
 * It is here because the first screen was a brain icon over four bullet points
 * and a red warning box, which sets up a clinical examination — and someone who
 * opens this because they are worried about their memory does not need to be
 * told, before answering anything, that this might be serious. The picture is
 * the game they are about to play.
 */
const IntroHero: React.FC = () => {
  // Someone worried enough about their memory to open this does not need a
  // looping animation fighting them, and a repeating roll is exactly the kind of
  // motion that reads as nausea rather than as charm to a vestibular-sensitive
  // user. When the OS says so, the panel holds still.
  const still = useReducedMotion();

  return (
    <div className="relative h-44 md:h-52 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-amber-500/10 border border-white/10">
      <HeroStaircase />

      {HERO_FRUIT.map((fruit, index) => (
        <motion.span
          key={fruit}
          className="absolute"
          style={{
            left: `${HERO_CENTRE(index)}%`,
            bottom: `${HERO_SURFACE(index)}%`,
            translateX: '-50%',
          }}
          // A startled hop, then a tip back onto its feet, as the cherry
          // arrives. `repeatDelay` fills out the rest of the roll's period so
          // the hop stays in step with it rather than drifting out of it.
          animate={still ? undefined : { y: [0, -13, 0], rotate: [0, -12, 8, 0] }}
          transition={{
            duration: HERO_HOP,
            times: [0, 0.4, 0.7, 1],
            ease: 'easeOut',
            repeat: Infinity,
            repeatDelay: HERO_PERIOD - HERO_HOP,
            delay: HERO_ARRIVAL(index),
          }}
        >
          <ItemGlyph itemId={fruit} className="w-11 h-11 md:w-14 md:h-14" />
        </motion.span>
      ))}

      {/* The cherry does the run the game asks the user to watch: down every
          step in turn, then off the bottom right. */}
      <motion.span
        className="absolute z-10"
        style={{ translateX: '-50%' }}
        // Entering from off the left rather than starting on the top step,
        // which is already occupied by the apple.
        initial={{ left: '-10%', bottom: `${HERO_SURFACE(0) + 22}%` }}
        animate={
          still
            ? { left: `${HERO_CENTRE(1) + 10}%`, bottom: `${HERO_SURFACE(0) + 4}%`, opacity: 1 }
            : {
                left: [
                  '-10%',
                  ...Array.from({ length: HERO_STEPS }, (_, i) => `${HERO_CENTRE(i)}%`),
                  '110%',
                ],
                bottom: [
                  `${HERO_SURFACE(0) + 22}%`,
                  ...Array.from({ length: HERO_STEPS }, (_, i) => `${HERO_SURFACE(i)}%`),
                  '-25%',
                ],
                rotate: [0, 1260],
                // Gone before it reappears at the top, so the reset reads as a
                // fruit leaving the frame rather than one teleporting back.
                opacity: [1, 1, 1, 1, 1, 0],
              }
        }
        transition={
          still
            ? { duration: 0 }
            : {
                duration: HERO_ROLL,
                // Constant speed between steps, so a landing happens when the
                // arithmetic in HERO_ARRIVAL says it does and the hops stay in
                // sync. Only the first drop in and the last drop out are eased.
                ease: ['easeIn', 'linear', 'linear', 'linear', 'easeIn'],
                repeat: Infinity,
                repeatDelay: HERO_PAUSE,
              }
        }
      >
        <ItemGlyph itemId="cherry" className="w-12 h-12 md:w-16 md:h-16" />
      </motion.span>
    </div>
  );
};

/**
 * 认知小测 — a self-administered screen across the design's six domains.
 *
 * Each memory block runs encode -> hold -> two other tasks -> free recall -> a
 * cued three-choice rescue for whatever did not come back. The tasks in the
 * middle are scored items in their own right (定向力, 注意力, 计算力, 语言流畅性)
 * and double as the distraction interval, which is how the clinical guidance
 * says the delay should be filled. After the blocks comes the game and the last
 * two tasks. Scoring is entirely client-side; nothing is sent anywhere.
 */
export const CognitiveScreen: React.FC<CognitiveScreenProps> = ({ onExit }) => {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  // The 定向力 questions are answered against the clock at the moment the form
  // is built, so the date is pinned per session rather than read on each render.
  const [startedAt] = useState(() => new Date());
  const session = useMemo(() => buildSession(seed, startedAt), [seed, startedAt]);

  const steps = useMemo<Step[]>(() => {
    const blockSteps = session.blocks.flatMap<Step>((_, block) => [
      { kind: 'encode', block },
      { kind: 'hold', block },
      ...Array.from({ length: DISTRACTORS_PER_BLOCK }, (_, n): Step => ({
        kind: 'selection',
        task: block * DISTRACTORS_PER_BLOCK + n,
      })),
      { kind: 'recall', block },
      { kind: 'cue', block },
    ]);
    // The game, then whatever selection tasks were not used as distractors.
    const used = session.blocks.length * DISTRACTORS_PER_BLOCK;
    return [
      ...blockSteps,
      { kind: 'falling' },
      ...session.selections
        .slice(used)
        .map((_, n): Step => ({ kind: 'selection', task: used + n })),
    ];
  }, [session]);

  /** Each selection task carries its own allowance; the rest are uniform. */
  const limitFor = useCallback(
    (target: Step): number => {
      switch (target.kind) {
        case 'encode':
          return TIMING.encode;
        case 'hold':
          return TIMING.hold;
        case 'recall':
          return TIMING.recall;
        case 'cue':
          return TIMING.recognition;
        case 'falling':
          return TIMING.falling;
        case 'selection':
          return session.selections[target.task].seconds;
      }
    },
    [session],
  );

  const [phase, setPhase] = useState<Phase>('intro');
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(TIMING.encode);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const [demographics, setDemographics] = useState<Demographics>({
    age: null,
    educationYears: null,
    sex: null,
  });
  const [encodeCells, setEncodeCells] = useState(() =>
    session.blocks.map(() => emptyCells(CELLS_PER_BLOCK)),
  );
  const [recallCells, setRecallCells] = useState(() =>
    session.blocks.map(() => emptyCells(CELLS_PER_BLOCK)),
  );
  const [selectionAnswers, setSelectionAnswers] = useState<string[][]>(() =>
    session.selections.map(() => []),
  );
  /** Built when a recall screen is left, since only then is the miss list known. */
  const [cueTrials, setCueTrials] = useState<RecognitionTrial[][]>(() =>
    session.blocks.map(() => []),
  );
  const [cueAnswers, setCueAnswers] = useState<Record<string, string>[]>(() =>
    session.blocks.map(() => ({})),
  );
  const [fallingPicks, setFallingPicks] = useState<string[]>([]);
  /** The game's clock only starts once the fruits have finished rolling. */
  const [fallingArmed, setFallingArmed] = useState(false);
  const [result, setResult] = useState<ScreenResult | null>(null);

  // Wall-clock marks for the encode -> recall interval, per block. Only the
  // report reads these, so they never need to trigger a render.
  const holdEndedAt = useRef<number[]>([]);
  const recallStartedAt = useRef<number[]>([]);

  const step = steps[stepIndex];

  const finish = useCallback(
    (trials: RecognitionTrial[][]) => {
      const responses: BlockResponse[] = session.blocks.map((block, index) => {
        const started = recallStartedAt.current[index] ?? Date.now();
        const encodeEnd = holdEndedAt.current[index] ?? started;
        const own = trials[index] ?? [];
        const answers = cueAnswers[index] ?? {};
        return {
          family: block.family,
          encoded: encodeCells[index],
          recalled: recallCells[index],
          recognisedIds: own
            .filter((trial) => answers[trial.targetId] === trial.targetId)
            .map((trial) => trial.targetId),
          cuedCount: own.length,
          delaySeconds: Math.max(0, Math.round((started - encodeEnd) / 1000)),
        };
      });
      setResult(
        scoreSession(session, responses, selectionAnswers, fallingPicks, demographics),
      );
      setPhase('result');
    },
    [session, encodeCells, recallCells, selectionAnswers, cueAnswers, fallingPicks, demographics],
  );

  const advance = useCallback(() => {
    const current = steps[stepIndex];
    if (current.kind === 'hold') holdEndedAt.current[current.block] = Date.now();

    let trials = cueTrials;
    if (current.kind === 'recall') {
      const built = buildRecognitionTrials(
        session.blocks[current.block],
        encodeCells[current.block],
        recallCells[current.block],
        session.seed + current.block + 1,
      );
      trials = cueTrials.map((value, index) => (index === current.block ? built : value));
      setCueTrials(trials);
    }

    // A block where everything came back on its own has nothing left to cue.
    let nextIndex = stepIndex + 1;
    while (
      nextIndex < steps.length &&
      steps[nextIndex].kind === 'cue' &&
      (trials[(steps[nextIndex] as { block: number }).block]?.length ?? 0) === 0
    ) {
      nextIndex++;
    }

    if (nextIndex >= steps.length) {
      finish(trials);
      return;
    }

    const next = steps[nextIndex];
    if (next.kind === 'recall') recallStartedAt.current[next.block] = Date.now();

    setStepIndex(nextIndex);
    setSecondsLeft(limitFor(next));
  }, [steps, stepIndex, cueTrials, session, encodeCells, recallCells, finish, limitFor]);

  // `advance` closes over the answers, so its identity changes every time a
  // cell is filled. The tick below must not depend on that identity, or every
  // tap would cancel and restart the pending timeout and stop the clock.
  const advanceRef = useRef(advance);
  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  // One-second tick that advances the step when the clock runs out. Both the
  // decrement and the advance happen inside the timeout rather than in the
  // effect body, so neither one cascades a render. Resetting the clock for the
  // next screen is `advance`'s job.
  useEffect(() => {
    if (phase !== 'task') return;
    // Watching the fruits roll is not something the user can hurry, so the
    // game's allowance covers the answer only.
    if (step.kind === 'falling' && !fallingArmed) return;
    const timer = setTimeout(() => {
      if (secondsLeft <= 0) advanceRef.current();
      else setSecondsLeft(secondsLeft - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [phase, secondsLeft, step, fallingArmed]);

  // The run is timed and cannot be resumed, and "go back and look for it" is
  // exactly the instinct a mistimed instruction invites — in WeChat's webview
  // that gesture would otherwise discard everything silently. Intercepting it
  // routes it into the same confirmation the × already shows.
  useEffect(() => {
    if (phase !== 'task') return;
    const guard = { cognitiveScreen: true };
    window.history.pushState(guard, '');
    const onPopState = () => {
      window.history.pushState(guard, '');
      setShowExitConfirm(true);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [phase]);

  const startTask = useCallback(() => {
    setPhase('task');
    setStepIndex(0);
    setSecondsLeft(limitFor(steps[0]));
  }, [steps, limitFor]);

  // A new seed swaps in a parallel form: same structure, different items, so a
  // retest is not just the form the user has already learned. The block and
  // task counts are fixed, so the blank answer grids do not depend on the seed.
  const retake = useCallback(() => {
    setSeed(Math.floor(Math.random() * 2 ** 31));
    setEncodeCells(session.blocks.map(() => emptyCells(CELLS_PER_BLOCK)));
    setRecallCells(session.blocks.map(() => emptyCells(CELLS_PER_BLOCK)));
    setSelectionAnswers(session.selections.map(() => []));
    setCueTrials(session.blocks.map(() => []));
    setCueAnswers(session.blocks.map(() => ({})));
    setFallingPicks([]);
    setFallingArmed(false);
    holdEndedAt.current = [];
    recallStartedAt.current = [];
    setResult(null);
    setPhase('about');
  }, [session]);

  if (phase === 'intro') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full overflow-y-auto flex items-center justify-center p-6"
      >
        <div className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-6">
          <IntroHero />

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-white">认知小测</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              一组图片小题，看图、点一点就行，大约 8–12 分钟。
              里面有记东西、找东西、数一数，也有一个水果滚楼梯的小游戏。
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPhase('about')}
            className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-500 hover:to-purple-500 transition-all"
          >
            开始
          </button>

          {/* Rules below the picture, and the caveats folded away rather than
              deleted — the person who wants to know what this is can open it,
              and the person who just wants to start is not stopped by a warning
              box on the way in. */}
          <ul className="text-left text-xs text-slate-400 space-y-2 rounded-xl bg-white/[0.03] p-4">
            <li>· 找个安静的地方一次做完，中间不用记笔记</li>
            <li>· 每一屏有时间限制，答完可以直接点「继续」，不用等</li>
            <li>· 不能回上一步；结果只在你手机上算，不会上传</li>
          </ul>

          <div className="rounded-xl bg-white/[0.02] border border-white/5">
            <button
              type="button"
              onClick={() => setShowAbout((open) => !open)}
              aria-expanded={showAbout}
              className="w-full px-4 py-3 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              关于这个测试
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showAbout ? 'rotate-180' : ''}`}
              />
            </button>
            {showAbout && (
              <p className="px-4 pb-4 text-xs text-slate-500 leading-relaxed">
                题目是我们自己编写的，参考了临床筛查常用的结构（记忆、定向、注意、计算、语言流畅性），
                但不是 MoCA 或任何已发表量表的电子版，也没有做过效度验证。
                它给你一个可以和自己以后的分数对比的参考值，不能用来诊断或排除任何疾病。
                如果你或家人觉得记性最近变化明显，不管测出多少分，都值得找医生当面看一次。
              </p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (phase === 'about') {
    return (
      <AboutYou
        onSubmit={(values) => {
          setDemographics(values);
          startTask();
        }}
        onSkip={startTask}
      />
    );
  }

  if (phase === 'result' && result) {
    return <ResultView result={result} onRetake={retake} onExit={onExit} />;
  }

  // A cue step shares its recall step's number instead of taking one of its own.
  // It is a follow-up to that screen, and it only exists when something was
  // missed — numbering it would make the counter jump for the users who
  // remembered everything, which reads as a bug.
  const numberedSteps = steps.filter((entry) => entry.kind !== 'cue').length;
  const position = steps.slice(0, stepIndex + 1).filter((entry) => entry.kind !== 'cue').length;
  const stepNumber = `第 ${position} / ${numberedSteps} 步`;
  const exitRequest = () => setShowExitConfirm(true);

  const frame = () => {
    switch (step.kind) {
      case 'encode': {
        const block = session.blocks[step.block];
        const cells = encodeCells[step.block];
        const family = FAMILY_LABELS[block.family];
        return (
          <TaskFrame
            secondsLeft={secondsLeft}
            totalSeconds={limitFor(step)}
            stepLabel={`${stepNumber} · 记住 ${family}`}
            // Never "从上面". The instruction band is the topmost thing on the
            // screen, so anything above it is the browser's own chrome — under a
            // countdown, "从上面挑" reads as "the items are on the previous
            // page" and sends the user back out of the run. Every direction in
            // this flow is relative to where the instruction sits, and the
            // section is named as well as pointed at.
            instruction={`请在下面的「可选项目」里挑 ${CELLS_PER_BLOCK} 样${family}，按你自己想好的顺序放进格子。过一会儿要请你把它们按同样的顺序再放一次。`}
            onExit={exitRequest}
            onNext={advance}
            nextEnabled={cells.every((cell) => cell !== null)}
            nextHint={`放满 ${CELLS_PER_BLOCK} 个格子后就可以继续，不必等时间走完。`}
          >
            <PlacementBoard
              palette={block.encodePalette}
              cells={cells}
              onChange={(next) =>
                setEncodeCells((current) =>
                  current.map((value, index) => (index === step.block ? next : value)),
                )
              }
            />
          </TaskFrame>
        );
      }

      case 'hold': {
        const block = session.blocks[step.block];
        return (
          <TaskFrame
            secondsLeft={secondsLeft}
            totalSeconds={limitFor(step)}
            stepLabel={`${stepNumber} · 记住顺序`}
            instruction="再看一眼：是哪几样，以及它们的先后顺序。"
            banner={`记好了就点「继续」，或 ${secondsLeft} 秒后自动进入下一步`}
            onExit={exitRequest}
            onNext={advance}
            // Nothing to do here but memorise, so making the user sit out the
            // clock buys nothing — whoever is ready is ready.
            nextEnabled
            nextLabel="继续"
          >
            <PlacementBoard
              readOnly
              palette={block.encodePalette}
              cells={encodeCells[step.block]}
              onChange={() => {}}
            />
          </TaskFrame>
        );
      }

      case 'selection': {
        const task = session.selections[step.task];
        const selected = selectionAnswers[step.task];
        return (
          <TaskFrame
            secondsLeft={secondsLeft}
            totalSeconds={limitFor(step)}
            stepLabel={`${stepNumber} · ${task.domainLabel}`}
            instruction={task.instruction}
            onExit={exitRequest}
            onNext={advance}
            nextEnabled={selected.length > 0}
            nextHint={
              task.mode === 'single'
                ? '选一张后就可以继续，不必等时间走完。'
                : '至少选一个后就可以继续；一个都不符合的话，等时间走完即可。'
            }
          >
            <SelectionGrid
              task={task}
              selected={selected}
              onChange={(next) =>
                setSelectionAnswers((current) =>
                  current.map((value, index) => (index === step.task ? next : value)),
                )
              }
            />
          </TaskFrame>
        );
      }

      case 'recall': {
        const block = session.blocks[step.block];
        const cells = recallCells[step.block];
        const family = FAMILY_LABELS[block.family];
        const complete = cells.every((cell) => cell !== null);
        return (
          <TaskFrame
            secondsLeft={secondsLeft}
            totalSeconds={limitFor(step)}
            stepLabel={`${stepNumber} · 回忆 ${family}`}
            instruction={`刚才在「${family}」里，你挑过 ${CELLS_PER_BLOCK} 样。请把它们按原来的顺序放回格子——下面的选项比刚才多。`}
            onExit={exitRequest}
            onNext={advance}
            nextEnabled={complete}
            nextHint="放满格子后就可以继续；想不起来的话，用下面的链接跳过。"
          >
            <PlacementBoard
              palette={block.recallPalette}
              cells={cells}
              onChange={(next) =>
                setRecallCells((current) =>
                  current.map((value, index) => (index === step.block ? next : value)),
                )
              }
            />
            {!complete && (
              <div className="max-w-5xl mx-auto mt-8 text-center">
                {/* Forcing four guesses would manufacture false recognitions,
                    so an honest "I don't remember" has to be available — and
                    the cue step right after gives those items a second chance
                    anyway. */}
                <button
                  type="button"
                  onClick={advance}
                  className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4 transition-colors"
                >
                  想不起来了，跳过剩下的格子
                </button>
              </div>
            )}
          </TaskFrame>
        );
      }

      case 'cue': {
        const block = session.blocks[step.block];
        const trials = cueTrials[step.block] ?? [];
        const answers = cueAnswers[step.block] ?? {};
        const family = FAMILY_LABELS[block.family];
        const complete = trials.every((trial) => answers[trial.targetId] !== undefined);
        return (
          <TaskFrame
            secondsLeft={secondsLeft}
            totalSeconds={limitFor(step)}
            stepLabel={`${stepNumber} · 提示一下`}
            instruction={`有 ${trials.length} 样${family}刚才没放回来。给你一点提示：每一组三个里，有一个是刚才出现过的。`}
            onExit={exitRequest}
            onNext={advance}
            nextEnabled={complete}
            nextHint="每组选一个后就可以继续。"
          >
            <CueRecall
              trials={trials}
              answers={answers}
              onChange={(next) =>
                setCueAnswers((current) =>
                  current.map((value, index) => (index === step.block ? next : value)),
                )
              }
            />
            {!complete && (
              <div className="max-w-3xl mx-auto mt-6 text-center">
                <button
                  type="button"
                  onClick={advance}
                  className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4 transition-colors"
                >
                  实在没印象，跳过这一步
                </button>
              </div>
            )}
          </TaskFrame>
        );
      }

      case 'falling': {
        return (
          <TaskFrame
            secondsLeft={fallingArmed ? secondsLeft : limitFor(step)}
            totalSeconds={limitFor(step)}
            stepLabel={`${stepNumber} · 小游戏`}
            instruction="台阶上的水果会一样一样滚下来。记住是哪几样——顺序记得住更好，记不住也不影响。"
            onExit={exitRequest}
            onNext={advance}
            // One pick is enough to move on. Demanding all of them forced anyone
            // who remembered two to invent a third, and an invented pick costs
            // credit — the gate was manufacturing the failure it then scored.
            nextEnabled={fallingPicks.length > 0}
            nextHint="选上 1 个就可以继续，不用凑满。"
          >
            <FallingFruit
              round={session.falling}
              picked={fallingPicks}
              onChange={setFallingPicks}
              onAnswerPhase={() => setFallingArmed(true)}
            />
            {fallingArmed && fallingPicks.length === 0 && (
              <div className="max-w-3xl mx-auto mt-6 text-center">
                <button
                  type="button"
                  onClick={advance}
                  className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4 transition-colors"
                >
                  一样也想不起来，跳过这一步
                </button>
              </div>
            )}
          </TaskFrame>
        );
      }
    }
  };

  return (
    <div className="h-full relative">
      {frame()}

      {showExitConfirm && (
        <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4">
            <h3 className="text-base font-semibold text-white">要退出测试吗？</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              测试不能中途保存，退出后这一次的作答会全部丢弃。
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-purple-500 transition-all"
              >
                继续测试
              </button>
              <button
                type="button"
                onClick={onExit}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

CognitiveScreen.displayName = 'CognitiveScreen';
