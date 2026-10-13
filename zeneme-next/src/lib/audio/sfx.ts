"use client"

import { withBase } from "@/lib/base-path"

// 沙盘音效（WebAudio）：沙声由录音切出的颗粒按笔尖移动触发，水声现场合成并限制最小间隔。
// 整体音量偏低，末端再过一道压缩器。

const KEY = "zene.sfx"

export type SfxTool = "dig" | "mound" | "smooth"

type Rig = {
  ac: AudioContext
  master: GainNode
  send: GainNode
  sand: GainNode
  tone: BiquadFilterNode
}

let rig: Rig | null = null
let on = false
let loaded = false
let lastDrop = -1
let lastNote = -1
const listeners = new Set<() => void>()

function load() {
  if (loaded || typeof window === "undefined") return
  loaded = true
  try {
    const raw = localStorage.getItem(KEY)
    if (raw !== null) on = JSON.parse(raw) === true
  } catch {}
}

function emit() {
  for (const l of listeners) l()
}

// 沙声颗粒源：脚步录音（CC0，来源见 public/audio/sand/NOTICE.txt），只取落脚后沙子塌陷的尾段。
// 合成噪声听起来像风，所以用真实录音做 granular。
const SAND_FILES = [1, 2, 3, 4, 5, 6].map((n) => withBase(`/audio/sand/sand-${n}.ogg`))
// 跳过开头的落脚重音
const TAIL_FROM = 0.07

let sandRaw: ArrayBuffer[] = []
let sandBufs: AudioBuffer[] = []
let fetching = false

// 只下载不解码：解码需要 AudioContext，而它要等用户手势才能创建
export async function preloadSand() {
  if (fetching || sandRaw.length) return
  fetching = true
  try {
    sandRaw = await Promise.all(
      SAND_FILES.map((u) => fetch(u).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(u))))),
    )
  } catch {
    sandRaw = []
    fetching = false
  }
}

function decodeSand(ac: AudioContext) {
  if (sandBufs.length || !sandRaw.length) return
  const raw = sandRaw
  sandBufs = []
  for (const buf of raw) {
    // decodeAudioData 会转移 ArrayBuffer 所有权，传副本
    ac.decodeAudioData(buf.slice(0)).then((b) => sandBufs.push(b)).catch(() => {})
  }
}

function build(): Rig | null {
  const AC: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  const ac = new AC()

  const master = ac.createGain()
  master.gain.value = 0.55
  // 防止多个声音叠加时突然变响
  const comp = ac.createDynamicsCompressor()
  comp.threshold.value = -22
  comp.knee.value = 22
  comp.ratio.value = 6
  comp.attack.value = 0.01
  comp.release.value = 0.28
  master.connect(comp).connect(ac.destination)

  // 短延迟给水滴加一点空间感
  const delay = ac.createDelay(0.6)
  delay.delayTime.value = 0.19
  const fb = ac.createGain()
  fb.gain.value = 0.1
  const tame = ac.createBiquadFilter()
  tame.type = "lowpass"
  tame.frequency.value = 1800
  const send = ac.createGain()
  send.gain.value = 1
  send.connect(delay)
  delay.connect(tame).connect(fb).connect(delay)
  const wet = ac.createGain()
  wet.gain.value = 0.08
  delay.connect(wet).connect(master)

  // 沙声颗粒的母线
  const sand = ac.createGain()
  sand.gain.value = 1
  const tone = ac.createBiquadFilter()
  tone.type = "lowpass"
  tone.frequency.value = TONE
  sand.connect(tone).connect(master)

  return { ac, master, send, sand, tone }
}

// 浏览器禁止自动播放，上下文在首次用户手势时创建
function wake() {
  load()
  if (!on) return null
  if (!rig) rig = build()
  if (rig) {
    if (rig.ac.state === "suspended") void rig.ac.resume()
    decodeSand(rig.ac)
  }
  return rig
}

// gain：颗粒电平；rate：播放速率（越低越闷）；step：触发间距（世界单位）
type Voice = { gain: number; rate: number; step: number }

// 沙声低通截止频率，干沙与水下共用；更高的截止频率听感刺耳。
const TONE = 1400

const VOICE: Record<SfxTool, Voice> = {
  dig: { gain: 0.145, rate: 0.8, step: 0.3 },
  mound: { gain: 0.13, rate: 0.68, step: 0.36 },
  smooth: { gain: 0.1, rate: 0.96, step: 0.26 },
}

// 水滴音高在此区间内随机，不取音阶，避免连起来像旋律。
const DROP_LO = 300
const DROP_HI = 520
// 水声最小间隔（秒）
const DROP_GAP = 1.05


let sanding = false
let travel = 0
let lastAt = 0

export const sfx = {
  // React 在订阅前读取快照，需在此先加载本地偏好，否则刷新后回到默认值
  get: () => {
    load()
    return { on }
  },

  subscribe(listener: () => void) {
    load()
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  toggle() {
    load()
    on = !on
    try {
      localStorage.setItem(KEY, JSON.stringify(on))
    } catch {}
    emit()
    if (!on) sfx.silence()
    else wake()
  },

  // 在首次用户手势时调用以创建上下文
  unlock() {
    wake()
  },

  // 每帧调用，moved 为本帧笔尖在沙面上移动的距离（世界单位）。
  // 移动够一段距离放一颗颗粒，静止时无声；间距、音高、电平均带随机，避免听出节拍。
  sculpt(tool: SfxTool, moved: number) {
    if (!on) return
    const r = wake()
    if (!r) return
    const now = r.ac.currentTime
    if (!sanding) {
      sanding = true
      travel = 0
      lastAt = now
    }
    const v = VOICE[tool]
    travel += moved

    // 每帧最多两颗：快速移动时不漏，也不会一次堆太多
    for (let i = 0; i < 2; i++) {
      if (travel < v.step * (0.6 + Math.random() * 0.9)) break
      if (now - lastAt < 0.035) break
      travel = 0
      lastAt = now
      if (!sandBufs.length) break
      const buf = sandBufs[(Math.random() * sandBufs.length) | 0]
      // 在尾段内随机取片段，避免重复
      const dur = 0.03 + Math.random() * 0.055
      const span = buf.duration - TAIL_FROM - dur
      if (span <= 0) break
      const at = TAIL_FROM + Math.random() * span
      const src = r.ac.createBufferSource()
      src.buffer = buf
      src.playbackRate.value = v.rate * (0.85 + Math.random() * 0.3)
      const g = r.ac.createGain()
      // 切片头尾是断口，需加短淡入淡出以免爆音；电平拉开差距，模拟大小不一的沙粒
      const lvl = v.gain * (0.4 + Math.random() * 0.6)
      const play = dur / src.playbackRate.value
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(lvl, now + play * 0.3)
      g.gain.linearRampToValueAtTime(0, now + play)
      src.connect(g).connect(r.sand)
      src.start(now, at, dur)
    }
  },

  // 颗粒本身很短，结束时无需淡出
  sculptEnd() {
    sanding = false
  },

  // 指针划过水面时触发，受 DROP_GAP 限制
  water() {
    if (!on) return
    const r = wake()
    if (!r) return
    const t = r.ac.currentTime
    if (t - lastDrop < DROP_GAP) return
    lastDrop = t

    // 与上一颗音高过近时错开
    let f = DROP_LO + Math.random() * (DROP_HI - DROP_LO)
    if (Math.abs(f - lastNote) < 40) f = f > (DROP_LO + DROP_HI) / 2 ? f - 60 : f + 60
    lastNote = f

    const osc = r.ac.createOscillator()
    osc.type = "sine"
    // 水滴音高向上滑（气泡收缩），向下滑听起来像铃声
    osc.frequency.setValueAtTime(f, t)
    osc.frequency.exponentialRampToValueAtTime(f * 2.1, t + 0.075)
    const loud = 0.063 + Math.random() * 0.023
    const g = r.ac.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(loud, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)
    const soft = r.ac.createBiquadFilter()
    soft.type = "lowpass"
    soft.frequency.value = 1600
    osc.connect(g).connect(soft)
    soft.connect(r.master)
    soft.connect(r.send)
    osc.start(t)
    osc.stop(t + 0.18)

    // 叠加极轻的水花噪声
    const n = r.ac.createBufferSource()
    const len = Math.floor(r.ac.sampleRate * 0.03)
    const buf = r.ac.createBuffer(1, len, r.ac.sampleRate)
    const d = buf.getChannelData(0)
    for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / len) ** 3
    n.buffer = buf
    const nb = r.ac.createBiquadFilter()
    nb.type = "bandpass"
    nb.frequency.value = 1500
    nb.Q.value = 1.4
    const ng = r.ac.createGain()
    ng.gain.value = loud * 0.3
    n.connect(nb).connect(ng).connect(r.master)
    n.start(t)
  },

  // 离开沙盘或切到后台时立即静音
  silence() {
    if (!rig) return
    sanding = false
    const now = rig.ac.currentTime
    rig.sand.gain.cancelScheduledValues(now)
    rig.sand.gain.setValueAtTime(0, now)
    rig.sand.gain.setValueAtTime(1, now + 0.2)
  },

  suspend() {
    sfx.silence()
    if (rig && rig.ac.state === "running") void rig.ac.suspend()
  },
}
