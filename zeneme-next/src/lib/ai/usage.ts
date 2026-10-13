import { store } from "@/lib/db"

// 记录每次 OpenAI 调用的 token 与耗时，用于统计用量。
// 配置 MONGODB_URI 时写入 ai_usage 集合，否则写入 var/ai-usage.jsonl。

export type AiUsage = {
  ts: string
  scene: string
  model: string
  ok: boolean
  ms: number
  inputTokens: number
  outputTokens: number
  costUsd: number | null
  requestId?: string
  recordId?: string
  error?: string
}

function price(env: string | undefined) {
  const n = Number(env)
  return env && Number.isFinite(n) ? n : null
}

export function estimateCost(inputTokens: number, outputTokens: number) {
  const pin = price(process.env.AI_PRICE_INPUT_PER_1M)
  const pout = price(process.env.AI_PRICE_OUTPUT_PER_1M)
  if (pin === null || pout === null) return null
  return (inputTokens * pin + outputTokens * pout) / 1_000_000
}

export async function writeUsage(entry: AiUsage) {
  // 记录失败不影响分析请求
  try {
    await store.putUsage({ ...entry })
  } catch (e) {
    console.error("写 AI 用量失败", e)
  }
}
