import "server-only"
import OpenAI from "openai"
import { estimateCost, writeUsage } from "./usage"

const model = process.env.OPENAI_MODEL || "gpt-5"

let client: OpenAI | null = null

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("缺少 OPENAI_API_KEY")
  // 推理模型生成一份报告需 40~70 秒（英文更久），超时设为 150 秒；
  // 重试 1 次应对网络抖动，最坏情况仍在 nginx 的 300 秒上限内。
  if (!client) client = new OpenAI({ apiKey, timeout: 150_000, maxRetries: 1 })
  return client
}

type CallOptions = {
  scene: string
  recordId?: string
  system: string
  user: string
  // 传入时使用结构化输出
  schema?: { name: string; schema: Record<string, unknown> }
}

// 所有 OpenAI 调用的统一入口，确保每次调用都被记录
export async function callOpenAI({ scene, recordId, system, user, schema }: CallOptions) {
  const started = Date.now()
  try {
    const res = await getClient().responses.create({
      model,
      instructions: system,
      input: user,
      // 卡牌内容很短，无需深度推理；低 effort 可明显缩短耗时并减少输出 token
      reasoning: { effort: "low" },
      ...(schema
        ? {
            text: {
              format: {
                type: "json_schema" as const,
                name: schema.name,
                schema: schema.schema,
                strict: true,
              },
            },
          }
        : {}),
    })
    const usage = res.usage
    const inputTokens = usage?.input_tokens ?? 0
    const outputTokens = usage?.output_tokens ?? 0
    await writeUsage({
      ts: new Date().toISOString(),
      scene,
      model,
      ok: true,
      ms: Date.now() - started,
      inputTokens,
      outputTokens,
      costUsd: estimateCost(inputTokens, outputTokens),
      requestId: res.id,
      recordId,
    })
    return res.output_text
  } catch (e) {
    await writeUsage({
      ts: new Date().toISOString(),
      scene,
      model,
      ok: false,
      ms: Date.now() - started,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: null,
      recordId,
      error: e instanceof Error ? e.message : String(e),
    })
    throw e
  }
}
