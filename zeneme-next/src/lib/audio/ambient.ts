"use client"

import { AMBIENT_DEFAULT_TRACK, AMBIENT_DEFAULT_VOLUME, ambientTracks } from "@/content/audio"
import { withBase } from "@/lib/base-path"

// 背景音乐：全站单例循环播放，开关、音量、曲目存在 localStorage。
// 受浏览器自动播放限制，需用户交互后才会出声。
const KEY = "zene.ambient"

type State = { on: boolean; volume: number; trackId: string; error: boolean }

let audio: HTMLAudioElement | null = null
let state: State = { on: false, volume: AMBIENT_DEFAULT_VOLUME, trackId: AMBIENT_DEFAULT_TRACK, error: false }
const listeners = new Set<() => void>()

const trackOf = (id: string) => ambientTracks.find((t) => t.id === id) ?? ambientTracks[0]

function load(): State {
  if (typeof window === "undefined") return state
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return state
    const saved = JSON.parse(raw) as Partial<State>
    // 曲目列表变更后，本地保存的 id 可能已失效
    const trackId = ambientTracks.some((t) => t.id === saved.trackId) ? saved.trackId! : state.trackId
    return { ...state, ...saved, trackId, error: false }
  } catch {
    return state
  }
}

function save() {
  try {
    const { on, volume, trackId } = state
    localStorage.setItem(KEY, JSON.stringify({ on, volume, trackId }))
  } catch {}
}

function emit() {
  for (const l of listeners) l()
}

function set(next: Partial<State>) {
  state = { ...state, ...next }
  save()
  emit()
}

function el() {
  if (!audio) {
    audio = new Audio()
    audio.loop = true
    // 未开启时不预加载，默认曲目较长（20 余分钟）
    audio.preload = "none"
    audio.volume = state.volume
    // 文件缺失或解码失败时把开关复位
    audio.addEventListener("error", () => set({ on: false, error: true }))
  }
  return audio
}

async function play(): Promise<boolean> {
  const a = el()
  const src = withBase(trackOf(state.trackId).src)
  if (!a.src.endsWith(src)) a.src = src
  a.preload = "auto"
  a.volume = state.volume
  try {
    await a.play()
    if (state.error) set({ error: false })
    return true
  } catch {
    // 无用户手势时浏览器会拒绝播放
    return false
  }
}

// 自动播放被拒时，在下一次用户交互时补播
function resumeOnNextGesture() {
  const go = () => {
    off()
    if (state.on) void play()
  }
  const off = () => {
    window.removeEventListener("pointerdown", go)
    window.removeEventListener("keydown", go)
  }
  window.addEventListener("pointerdown", go, { once: true })
  window.addEventListener("keydown", go, { once: true })
}

// 供其他入口打开 MusicButton 中的选曲面板，避免把面板状态提到全局
const panelListeners = new Set<() => void>()
export const musicPanel = {
  open: () => panelListeners.forEach((l) => l()),
  subscribe(l: () => void) {
    panelListeners.add(l)
    return () => {
      panelListeners.delete(l)
    }
  },
}

let started = false
// 曲目文件不存在时隐藏音乐入口。用 HEAD 探测一次默认曲目，全站共用结果。
let probe: Promise<boolean> | null = null
function filesReady() {
  probe ??= fetch(withBase(trackOf(state.trackId).src), { method: "HEAD" })
    .then((r) => r.ok)
    .catch(() => false)
  return probe
}

export const ambient = {
  async ready() {
    if (ambientTracks.length === 0) return false
    return filesReady()
  },
  // 页面加载时调用，恢复上次的播放状态
  init() {
    if (started || ambientTracks.length === 0) return
    started = true
    state = load()
    emit()
    if (!state.on) return
    void play().then((ok) => {
      if (!ok) resumeOnNextGesture()
    })
  },
  get: () => state,
  subscribe(listener: () => void) {
    if (listeners.size === 0) state = load()
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  async toggle() {
    if (ambientTracks.length === 0) return
    set({ on: !state.on })
    if (state.on) await play()
    else el().pause()
  },
  // 选中曲目并开始播放；再次选中正在播放的曲目则关闭
  async select(trackId: string) {
    if (ambientTracks.length === 0) return
    if (state.on && state.trackId === trackId) {
      set({ on: false })
      el().pause()
      return
    }
    set({ trackId, on: true })
    await play()
  },
  setVolume(v: number) {
    set({ volume: Math.min(1, Math.max(0, v)) })
    if (audio) audio.volume = state.volume
  },
}
