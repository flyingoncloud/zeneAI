// 背景音乐配置。曲目来自 Pixabay，
// 文件自行托管在 public/audio/ambient/，授权说明见同目录 NOTICE.txt。
// 列表为空时所有音乐入口都不显示。
export type AmbientTrack = {
  id: string
  name: string
  nameEn: string
  // 曲目时长，取自文件本身；留空则界面上不显示
  length: string
  src: string
  // 原曲名与来源，仅作记录
  credit: string
}

export const ambientTracks: AmbientTrack[] = [
  {
    id: "mindfulness",
    name: "正念冥想",
    nameEn: "Mindful calm",
    length: "4:01",
    src: "/audio/ambient/mindfulness.mp3",
    credit: "Mindfulness Relaxation & Meditation Music — Pixabay #22174",
  },
  {
    id: "air",
    name: "微风",
    nameEn: "Light air",
    length: "3:10",
    src: "/audio/ambient/soft-air-drift.mp3",
    credit: "Ambient Background Soft Air Drift — Pixabay #575882",
  },
  {
    id: "calm",
    name: "静谧",
    nameEn: "Stillness",
    length: "6:49",
    src: "/audio/ambient/calm-ambient.mp3",
    credit: "Calm Ambient — Pixabay #491577",
  },
  {
    id: "drift",
    name: "缓流",
    nameEn: "Slow drift",
    length: "8:21",
    src: "/audio/ambient/ambient-calm.mp3",
    credit: "Ambient Calm — Pixabay #491578",
  },
]

// 默认曲目：选最长、最适合冥想引导的一首
export const AMBIENT_DEFAULT_TRACK = "mindfulness"

export const AMBIENT_DEFAULT_VOLUME = 0.2
