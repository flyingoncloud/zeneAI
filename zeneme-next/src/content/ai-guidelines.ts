// AI 报告正文的写作约束。
// 生成报告文案的 prompt 必须带上这些约束。中英各一份：报告要用用户当前的界面语言写。

import type { Lang } from "./copy"

type Guidelines = {
  person: string
  freeLength: number
  fullLength: number
  rules: string[]
  blocklist: string[]
  // 输出语言，放在 prompt 最前面
  language: string
}

const zh: Guidelines = {
  person: "第二人称「你」",
  // 免费层整份报告的字数上限；付费解锁后展开完整版
  freeLength: 150,
  fullLength: 500,
  rules: [
    "只描述观察到的，不下判断、不贴标签",
    "不给医疗建议，不做任何形式的诊断",
    "避免引发自卑或自我怀疑的措辞",
    "不要复述操作流水（先放了什么、又挖了沙、用了几秒）——那是数据不是观察，用户看了没有意义",
    "没有足够依据时直接说看不出来，不要硬凑结论",
  ],
  blocklist: ["诊断", "障碍", "症状", "治疗", "病", "你应该"],
  language: "全部输出用简体中文。",
}

// 英文不是中文的直译：字数上限换成词数（同样的信息量，英文词数约为中文字数的六成），
// 禁用词也换成英文里对应的诊断类措辞。
const en: Guidelines = {
  person: 'second person ("you")',
  freeLength: 90,
  fullLength: 300,
  rules: [
    "Describe only what you observe. Do not judge, and do not label.",
    "No medical advice, and no diagnosis of any kind.",
    "Avoid any wording that could invite shame or self-doubt.",
    "Do not narrate the user's actions (what they placed first, that they dug the sand, how many seconds it took) — that is data, not observation, and it tells the reader nothing.",
    "When there isn't enough to go on, say so plainly instead of forcing a conclusion.",
  ],
  blocklist: ["diagnosis", "disorder", "symptom", "treatment", "illness", "you should"],
  language: "Write everything in English.",
}

export const guidelines: Record<Lang, Guidelines> = { zh, en }
