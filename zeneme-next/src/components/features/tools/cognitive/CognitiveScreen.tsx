'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Brain } from 'lucide-react';
import {
  buildSession,
  CELLS_PER_BLOCK,
  DISTRACTORS_PER_BLOCK,
  FAMILY_LABELS,
  TIMING,
  scoreSession,
  type BlockResponse,
  type Demographics,
  type ScreenResult,
} from '@/data/cognitiveScreen';
import { AboutYou } from './AboutYou';
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
  | { kind: 'recall'; block: number };

function emptyCells(count: number): (string | null)[] {
  return Array.from({ length: count }, () => null);
}

/**
 * 认知快测 — a self-administered screen across the design's six domains.
 *
 * Each of the three rounds runs encode -> hold -> two selection tasks -> recall.
 * The selection tasks are both scored items in their own right (定向力, 注意力,
 * 计算力, 语言流畅性) and the distraction interval before recall, which is how
 * the clinical guidance says the delay should be filled. Scoring is entirely
 * client-side; nothing is sent anywhere.
 */
export const CognitiveScreen: React.FC<CognitiveScreenProps> = ({ onExit }) => {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  // The 定向力 questions are answered against the clock at the moment the form
  // is built, so the date is pinned per session rather than read on each render.
  const [startedAt] = useState(() => new Date());
  const session = useMemo(() => buildSession(seed, startedAt), [seed, startedAt]);

  const steps = useMemo<Step[]>(
    () =>
      session.blocks.flatMap<Step>((_, block) => [
        { kind: 'encode', block },
        { kind: 'hold', block },
        ...Array.from({ length: DISTRACTORS_PER_BLOCK }, (_, n): Step => ({
          kind: 'selection',
          task: block * DISTRACTORS_PER_BLOCK + n,
        })),
        { kind: 'recall', block },
      ]),
    [session],
  );

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
  const [result, setResult] = useState<ScreenResult | null>(null);

  // Wall-clock marks for the encode -> recall interval, per block. Only the
  // report reads these, so they never need to trigger a render.
  const holdEndedAt = useRef<number[]>([]);
  const recallStartedAt = useRef<number[]>([]);

  const step = steps[stepIndex];

  const finish = useCallback(() => {
    const responses: BlockResponse[] = session.blocks.map((block, index) => {
      const started = recallStartedAt.current[index] ?? Date.now();
      const encodeEnd = holdEndedAt.current[index] ?? started;
      return {
        family: block.family,
        encoded: encodeCells[index],
        recalled: recallCells[index],
        delaySeconds: Math.max(0, Math.round((started - encodeEnd) / 1000)),
      };
    });
    setResult(scoreSession(session, responses, selectionAnswers, demographics));
    setPhase('result');
  }, [session, encodeCells, recallCells, selectionAnswers, demographics]);

  const advance = useCallback(() => {
    const current = steps[stepIndex];
    if (current.kind === 'hold') holdEndedAt.current[current.block] = Date.now();

    const nextIndex = stepIndex + 1;
    if (nextIndex >= steps.length) {
      finish();
      return;
    }

    const next = steps[nextIndex];
    if (next.kind === 'recall') recallStartedAt.current[next.block] = Date.now();

    setStepIndex(nextIndex);
    setSecondsLeft(limitFor(next));
  }, [steps, stepIndex, finish, limitFor]);

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
    const timer = setTimeout(() => {
      if (secondsLeft <= 0) advanceRef.current();
      else setSecondsLeft(secondsLeft - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [phase, secondsLeft]);

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
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/15 border border-violet-400/30 flex items-center justify-center">
            <Brain className="w-8 h-8 text-violet-300" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">认知快测</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              一个自助完成的认知筛查，覆盖记忆力、定向力、注意力、计算力和语言流畅性，约 10–15 分钟，共三轮。
              每一轮里，你先把几个图案按自己的顺序放进格子，接着做两道别的题，然后把刚才的图案和顺序回忆出来。
            </p>
          </div>

          <ul className="text-left text-xs text-slate-400 space-y-2 rounded-xl bg-white/[0.03] p-4">
            <li>· 请在安静、不被打扰的环境里一次做完</li>
            <li>· 每一屏都有时间限制，时间到会自动进入下一步</li>
            <li>· 不能回到上一步，也不要记笔记</li>
            <li>· 结果只在你的设备上计算，不会上传</li>
          </ul>

          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 flex gap-2.5 text-left">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-100/90 leading-relaxed">
              这不是 MoCA，也不是任何已发表量表的电子版——题目由我们自行编写。它是一个未经效度验证的探索性指标，不能用于诊断。
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPhase('about')}
            className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-500 hover:to-purple-500 transition-all"
          >
            开始
          </button>
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
    return (
      <ResultView result={result} onRetake={retake} onExit={onExit} />
    );
  }

  const stepNumber = `第 ${stepIndex + 1} / ${steps.length} 步`;
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
            instruction={`从上方选出 ${CELLS_PER_BLOCK} 个${family}，按你自己想好的顺序放进格子。稍后要请你把它们和顺序一起回忆出来。`}
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
            instruction="请记住格子里的项目，以及它们的顺序。"
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
            instruction={`刚才在「${family}」这一组里，你选过 ${CELLS_PER_BLOCK} 个项目。请把它们按原来的顺序放回格子——下面的选项比刚才多。`}
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
                {/* Forcing five guesses would manufacture false recognitions,
                    so an honest "I don't remember" has to be available. */}
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
