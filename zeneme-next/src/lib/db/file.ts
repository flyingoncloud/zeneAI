import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import type { SandtrayRecord } from "@/types/sandtray"
import type { Store } from "./types"

// 本地开发用的文件存储，每个用户一个文件
// 路径固定为 var/data，不要用变量拼接：Turbopack 会把整个项目当作依赖追踪进产物
const dir = path.join(process.cwd(), "var", "data")
const shots = path.join(process.cwd(), "var", "snapshots")
const usageLog = path.join(process.cwd(), "var", "ai-usage.jsonl")

async function load(userId: string): Promise<SandtrayRecord[]> {
  try {
    return JSON.parse(await readFile(path.join(dir, `${userId}.json`), "utf8"))
  } catch {
    return []
  }
}

async function save(userId: string, rows: SandtrayRecord[]) {
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, `${userId}.json`), JSON.stringify(rows, null, 2), "utf8")
}

const shotFile = (userId: string, recordId: string) => path.join(shots, `${userId}__${recordId}.txt`)

export const fileStore: Store = {
  async list(userId) {
    return (await load(userId)).sort((a, b) => b.updatedAt - a.updatedAt)
  },
  async get(userId, id) {
    return (await load(userId)).find((r) => r.id === id) ?? null
  },
  async put(userId, record) {
    const rows = await load(userId)
    const i = rows.findIndex((r) => r.id === record.id)
    if (i >= 0) rows[i] = record
    else rows.push(record)
    await save(userId, rows)
  },
  async remove(userId, id) {
    const rows = await load(userId)
    const next = rows.filter((r) => r.id !== id)
    if (next.length === rows.length) return false
    await save(userId, next)
    await rm(shotFile(userId, id), { force: true })
    return true
  },
  async putSnapshot(userId, recordId, data) {
    await mkdir(shots, { recursive: true })
    await writeFile(shotFile(userId, recordId), data, "utf8")
  },
  async getSnapshot(userId, recordId) {
    try {
      return await readFile(shotFile(userId, recordId), "utf8")
    } catch {
      return null
    }
  },
  async putUsage(entry) {
    await mkdir(path.dirname(usageLog), { recursive: true })
    await writeFile(usageLog, JSON.stringify(entry) + "\n", { flag: "a", encoding: "utf8" })
  },
}
