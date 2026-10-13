import { NextResponse } from "next/server"
import { callOpenAI } from "@/lib/ai/client"
import { store } from "@/lib/db"
import { requireUserId } from "@/lib/session"
import { guidelines } from "@/content/ai-guidelines"
import { copyOf, type Lang } from "@/content/copy"
import { getCopy, getLang } from "@/lib/lang"
import { figureById } from "@/content/figures"
import { sculptStrokes, strokePhases } from "@/lib/sandtray/stats"
import { ZONE_LABEL, zoneOf } from "@/lib/sandtray/zones"
import type { ZoneKey } from "@/lib/sandtray/zones"
import type { ExploreDirection, Report, SandtrayRecord } from "@/types/sandtray"

// 对应设计稿「沙盘_选择方向」的四个选项，作为模型的写作参照
const directionText: Record<Lang, Record<ExploreDirection, string>> = {
  zh: {
    self: "用户想看的是「你到底是个什么样的人」——自我认识",
    career: "用户想看的是「我到底适合什么工作」——事业发展",
    future: "用户想看的是「我未来应该往哪里走」——人生方向",
    free: "用户没有特定问题，只想随便聊聊——自由探索",
  },
  en: {
    self: 'They want to look at "what kind of person am I, really" — self-knowledge',
    career: 'They want to look at "what work would actually suit me" — career',
    future: 'They want to look at "which way should I go from here" — direction',
    free: "They have no particular question, they just want to talk — open exploration",
  },
}

// 所选方向决定整张卡回答的问题，称号、观察、意义、下一步都围绕它展开
const directionFocus: Record<Lang, Record<ExploreDirection, string>> = {
  zh: {
    self: "这次 ta 想知道「我到底是个什么样的人」。整张卡都在回答这个：ta 的性格、在意的东西、做事的方式。称号像在描述一个人。",
    career: "这次 ta 想知道「我到底适合什么工作」。整张卡都在回答这个：ta 可能适合的做事方式和工作环境，不替 ta 定具体职业。称号可以带一点职业气质。",
    future: "这次 ta 想知道「我未来应该往哪里走」。整张卡都在回答这个：ta 可能想去的方向、眼下在权衡什么、下一阶段先试什么。称号像一段路。",
    free: "这次 ta 没有特定问题，只想随便看看。整张卡回应 ta 此刻的状态和感受，轻松一点，不往职业上引。",
  },
  en: {
    self: 'This time they want to know "what kind of person am I, really". The whole card answers that: their temperament, what they care about, how they go about things. The title should read like a description of a person.',
    career: 'This time they want to know "what work would actually suit me". The whole card answers that: the ways of working and settings that might suit them, without assigning a specific job. The title can carry a hint of vocation.',
    future: 'This time they want to know "which way should I go from here". The whole card answers that: where they might be heading, what they are weighing right now, what to try first. The title should read like a path.',
    free: "This time they have no particular question and just want to look. The card responds to how they are right now, kept light, without steering towards careers.",
  },
}

const schema = {
  name: "awareness_card",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["title", "subtitle", "summary", "meaning", "nextSteps", "radar", "careers"],
    properties: {
      title: { type: "string", description: "给这张卡牌起的称号，4-8 个字" },
      subtitle: { type: "string", description: "一句话副标题，不超过 16 字" },
      summary: { type: "string", description: "我看到的：1-2 个最有代表性的摆放细节，以及它可能反映的你此刻的状态" },
      meaning: { type: "string", description: "对你意味着什么：把观察和用户选的探索方向连起来" },
      nextSteps: { type: "array", minItems: 2, maxItems: 2, items: { type: "string" }, description: "这周随手能做的两件轻松小事，按用户选的方向给，不点名具体职业" },
      radar: {
        type: "object",
        additionalProperties: false,
        required: ["R", "I", "A", "S", "E", "C"],
        properties: Object.fromEntries(
          ["R", "I", "A", "S", "E", "C"].map((k) => [k, { type: "integer", minimum: 0, maximum: 100 }]),
        ),
      },
      careers: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "match"],
          properties: {
            title: { type: "string" },
            match: { type: "integer", minimum: 0, maximum: 100 },
          },
        },
      },
    },
  },
}

const label = (zones: Record<ZoneKey, number>, lang: Lang) =>
  Object.entries(zones)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${ZONE_LABEL[lang][k as ZoneKey]}:${Math.round(v * 10) / 10}`)
    .join(lang === "en" ? ", " : "、") || (lang === "en" ? "none" : "无")

// 送入模型的数据：沙具（象征、区域、顺序、大小）、区域统计、塑沙面积与区域、笔画时间序列、行为节奏
function describe(record: SandtrayRecord, lang: Lang) {
  const { figures, stats, events, strokes } = record.layout
  const sculpt = events ? sculptStrokes(events) : (strokes ?? [])
  return {
    // 用户选择的探索方向，放在最前
    question: record.direction ? directionText[lang][record.direction] : undefined,
    name: record.name,
    story: record.story,
    figures: figures
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((f) => {
        const meta = figureById.get(f.figureId)
        return {
          order: f.order,
          name: (lang === "en" ? meta?.nameEn : meta?.name) ?? f.figureId,
          category: meta?.category,
          symbolism: lang === "en" ? meta?.symbolismEn : meta?.symbolism,
          zone: ZONE_LABEL[lang][zoneOf(f.x, f.z, record.layout.view)],
          scale: +f.scale.toFixed(2),
          // 仅在悬空（正）或下沉（负）时带上，单位为沙盘单位（人高 1.8）
          ...(f.lift && Math.abs(f.lift) >= 0.05 ? { lift: +f.lift.toFixed(2) } : {}),
        }
      }),
    区域统计: stats ? label(stats.figureZones, lang) : undefined,
    塑沙: stats
      ? {
          挖低面积: stats.dugArea,
          挖低区域: label(stats.dugZones, lang),
          堆高面积: stats.piledArea,
          堆高区域: label(stats.piledZones, lang),
          最深: stats.maxDepth,
          最高: stats.maxHeight,
          挖到见水: stats.water,
          用时秒: Math.round(stats.durationMs / 1000),
        }
      : undefined,
    塑沙过程: sculpt.length ? strokePhases(sculpt, 12, lang, record.layout.view) : undefined,
    行为节奏: stats
      ? {
          总用时秒: Math.round(stats.durationMs / 1000),
          实际操作秒: Math.round(stats.activeMs / 1000),
          中途离开秒: Math.round(stats.awayMs / 1000),
          开始前停顿秒: Math.round(stats.pauses.beforeFirstMs / 1000),
          结束前停顿秒: Math.round(stats.pauses.lastToSaveMs / 1000),
          停顿超3秒次数: stats.pauses.over3s,
          停顿超10秒次数: stats.pauses.over10s,
          最长停顿秒: Math.round(stats.pauses.longestMs / 1000),
          动作次数: stats.actions,
        }
      : undefined,
    摆放结构: stats
      ? {
          离中心平均距离: stats.spread.avgFromCenter,
          最近邻平均距离: stats.spread.nearestAvg,
          铺开面积: stats.spread.bboxArea,
        }
      : undefined,
  }
}

// 占位报告：AI_MOCK=1 或未配置 OPENAI_API_KEY 时使用，流程完整但不调用模型
function mockReport(record: SandtrayRecord, lang: Lang): Report {
  const s = record.layout.stats
  if (lang === "en") {
    return {
      title: "Sample · Still water",
      subtitle: "Placeholder content — the model writes this once AI is on",
      summary: s?.water
        ? "You dug down to water, and a few pieces stayed at its edge — the model writes this line, without narrating your actions."
        : "The sand was left whole, and the pieces stayed close together — the model writes this line, without narrating your actions.",
      radar: { R: 62, I: 78, A: 55, S: 41, E: 34, C: 47 },
      careers: [
        { title: "Sample · Investigative", match: 78 },
        { title: "Sample · Realistic", match: 62 },
        { title: "Sample · Artistic", match: 55 },
      ],
      meaning: "Placeholder: the model connects what it noticed to the direction you chose, and what it might mean for you.",
      nextSteps: ["Placeholder: one small thing to try this week", "Placeholder: another small step"],
      generatedAt: Date.now(),
    }
  }
  return {
    title: "示例 · 静水区",
    subtitle: "占位内容，接入 AI 后由模型生成",
    summary: s?.water
      ? "你挖到了水，几件沙具留在水边——这一句将来由模型写，不复述操作流水。"
      : "沙面保持完整，沙具彼此靠得很近——这一句将来由模型写，不复述操作流水。",
    radar: { R: 62, I: 78, A: 55, S: 41, E: 34, C: 47 },
    careers: [
      { title: "示例方向 · 研究型", match: 78 },
      { title: "示例方向 · 实践型", match: 62 },
      { title: "示例方向 · 表达型", match: 55 },
    ],
    meaning: "占位段落：模型在这里把观察和你选的方向连起来，说说这对你可能意味着什么。",
    nextSteps: ["占位：这周可以试的一件小事", "占位：另一件小事"],
    generatedAt: Date.now(),
  }
}

// 模型偶尔在句尾残留括号，保存前去掉
const strip = (v: unknown) => (typeof v === "string" ? v.replace(/[{}[\]]/g, "").trim() : v)
function tidy(r: Omit<Report, "generatedAt">) {
  return {
    ...r,
    title: strip(r.title) as string,
    subtitle: strip(r.subtitle) as string,
    summary: strip(r.summary) as string,
    meaning: strip(r.meaning) as string,
    nextSteps: (r.nextSteps ?? []).map((s) => strip(s) as string),
  }
}

// 按用户限流。内存计数仅适用于单实例，多实例部署需改用 Redis 或数据库。
const recent = new Map<string, number[]>()
const RATE_WINDOW = 60 * 60 * 1000
const RATE_MAX = 10

function overRateLimit(uid: string) {
  const now = Date.now()
  const hits = (recent.get(uid) ?? []).filter((t) => now - t < RATE_WINDOW)
  if (hits.length >= RATE_MAX) {
    recent.set(uid, hits)
    return true
  }
  hits.push(now)
  recent.set(uid, hits)
  return false
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await requireUserId()
  const { id } = await params
  const record = await store.get(uid, id)
  const ui = (await getCopy()).ui
  if (!record) return NextResponse.json({ error: ui.errNoRecord }, { status: 404 })
  if (!record.layout.figures.length) {
    return NextResponse.json({ error: ui.errEmptyTray }, { status: 400 })
  }
  if (overRateLimit(uid)) {
    return NextResponse.json({ error: ui.errTooOften }, { status: 429 })
  }

  if (process.env.AI_MOCK === "1" || !process.env.OPENAI_API_KEY) {
    const report = mockReport(record, await getLang())
    await store.put(uid, { ...record, report, status: "analyzed", updatedAt: Date.now() })
    return NextResponse.json({ report })
  }

  const lang = await getLang()
  const copy = copyOf(lang)
  const g = guidelines[lang]

  // 报告使用界面语言，语言要求放在最前：输入 JSON 的字段名是中文，不明确说明时模型会跟随字段名的语言
  const system =
    lang === "en"
      ? [
          g.language,
          `You are "${copy.global.spriteName}", ${copy.global.spritePersona}.`,
          "The user has placed figures in a 3D sandtray. Write them a short self-awareness card. The point is not to describe the tray back to them, but to help them see what it might say about them and what they could do next — the reader should come away thinking \"this is about me, and it's useful\".",
          directionFocus.en[record.direction ?? "free"],
          "The question field is what they chose to explore. Every part — title, summary, meaning, nextSteps — should serve that question.",
          "summary (What I noticed, 25-35 words): pick one or two telling details — a specific figure and where it sits or what it sits next to — and say what they might reflect about the person right now.",
          "meaning (What it might mean for you, 30-40 words): connect that observation to their chosen direction and their life. Use open wording like \"perhaps\" or \"it may be that\", but say something concrete, not generic.",
          "nextSteps (two items, each 12-22 words): one small, low-pressure thing they could do this week, leaning towards \"find out a little\" or \"notice something about yourself\". Write it so they know exactly how to do it: what, how, roughly how long, and optionally half a sentence on why. Use gentle wording such as \"you could…\" or \"try…\", not instructions. Use everyday language, no jargon, one action per item. Example: \"Each evening this week, take two minutes to note what absorbed you most, then look for a pattern at the weekend.\"",
          "Do not name specific jobs or roles, and do not ask them to contact strangers or apply for anything; a few figures are not enough to guess an industry. Shift the focus by question: self-knowledge → notice or note one small trait of theirs; career → notice what they get most absorbed in, or look up an industry they've been curious about and what a day in it looks like; direction in life → write down a day they'd like to live a year from now, or look into a place or course that interests them; open exploration → one small thing that helps them unwind.",
          "Do not name figures or mention the sandtray in the sentence, and no vague advice like \"reflect more\". In meaning, don't assign them a specific job either — describe the kind of work style or setting that might suit them.",
          `Person: ${g.person}. Keep title, subtitle, summary and meaning under ${g.freeLength} words in total (nextSteps not counted).`,
          ...g.rules,
          "Only write about points you have grounds for. If something is unclear, leave it out — never write phrases like \"its meaning is unclear\" into the card.",
          "Never mention Holland, RIASEC, type letters or scores in the text.",
          "Plain text only: no brackets, braces, quotation marks around whole sentences, or Markdown.",
          `Never use these words: ${g.blocklist.join(", ")}.`,
          "radar and careers are stored for later and not shown to the user: radar is the strength of each Holland type (R Realistic / I Investigative / A Artistic / S Social / E Enterprising / C Conventional), scored from how the figures' symbolism is distributed; careers are 2-3 possible directions with a match score.",
          "The input JSON uses Chinese field names; that is only the data schema. Your output must still be entirely in English.",
        ].join("\n")
      : [
          g.language,
          `你是「${copy.global.spriteName}」，${copy.global.spritePersona}。`,
          "用户在 3D 沙盘里摆了一些沙具，你给 ta 写一张自我觉察卡。重点不是把沙盘复述一遍，而是帮 ta 看见「这可能在说我什么、我接下来可以做点什么」——读完要觉得「这说的是我，而且有用」。",
          directionFocus.zh[record.direction ?? "free"],
          "question 字段是用户自己选的探索方向。title、summary、meaning、nextSteps 都要为回答这个问题服务。",
          "summary（我看到的，40-50 字）：挑 1-2 个最有代表性的细节——具体哪件沙具、放在哪、挨着谁——说出它可能反映的你此刻的状态。",
          "meaning（对你意味着什么，50-60 字）：把这个观察和 ta 选的方向、ta 的生活连起来。用「也许」「可能」留余地，但要说具体的话，不要放之四海皆准的套话。",
          "nextSteps（两条，每条 20-32 字）：现实里这周随手就能做的一件小事，轻、开放、没有压力，偏「了解一下」「留意一下自己」。写成一句读了就知道怎么做的话：做什么、怎么做、大概花多久，可以带半句为什么。用「可以……」「试着……」这样柔和的说法，不要像布置任务。用日常口语，别用「复盘」「拆解」这类术语，一条只讲一个动作。例：「这周每晚花两分钟，记下当天最投入的一件事，周末回头看看有什么共同点」。",
          "nextSteps 不要点名具体职业或岗位，不要让 ta 去找陌生人聊、去投简历；沙盘里只有几件沙具，猜具体行业很容易错。可以按 question 换侧重：自我认识 → 留意或记下自己的一个小特点；事业发展 → 留意做什么事时最投入、或搜一个一直好奇的行业看看它每天做什么；人生方向 → 写下一年后想过的一天、或查查一个感兴趣的地方或专业；自由探索 → 一件让自己放松的小事。",
          "句子里不要出现沙具名或「沙盘」二字，也不要「多想想」「多关注自己」这种空话。meaning 里也不要替 ta 定具体岗位，只说可能适合什么样的做事方式或环境。",
          `人称：${g.person}。title、subtitle、summary、meaning 合计不超过 ${g.freeLength} 字（nextSteps 另算）。`,
          ...g.rules,
          "只写有依据的点；没依据的点直接略过，不要把「含义未可知」「看不出来」这类话写进卡片。",
          "正文里不要出现霍兰德、RIASEC、类型字母和分数。",
          "只输出纯文本：不要括号、花括号、整句加引号或 Markdown 符号。",
          `禁用词：${g.blocklist.join("、")}。`,
          "radar 和 careers 只存档、不展示给用户：radar 是霍兰德六型（R 现实 / I 研究 / A 艺术 / S 社会 / E 企业 / C 常规）的倾向强度，按沙具的象征分布给分；careers 是 2-3 个可能的方向及匹配度。",
        ].join("\n")

  try {
    const text = await callOpenAI({
      scene: "report",
      recordId: id,
      system,
      user: JSON.stringify(describe(record, lang)),
      schema,
    })
    const report: Report = { ...tidy(JSON.parse(text)), generatedAt: Date.now() }
    await store.put(uid, { ...record, report, status: "analyzed", updatedAt: Date.now() })
    return NextResponse.json({ report })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "生成失败" },
      { status: 500 },
    )
  }
}
