import { MongoClient, type Collection } from "mongodb"
import type { SandtrayRecord } from "@/types/sandtray"
import type { Store } from "./types"

type Row = SandtrayRecord & { userId: string }
type Snapshot = { _id: string; data: string; updatedAt: number }

// 开发模式下模块会热替换，MongoClient 挂在 globalThis 上以免重复建立连接
const g = globalThis as typeof globalThis & { __zeneMongo?: Promise<MongoClient> }

function connect() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("缺少 MONGODB_URI")
  if (!g.__zeneMongo) {
    g.__zeneMongo = new MongoClient(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      maxPoolSize: 10,
    }).connect()
  }
  return g.__zeneMongo
}

let ready: Promise<{
  records: Collection<Row>
  snapshots: Collection<Snapshot>
  usage: Collection<Record<string, unknown>>
}> | null = null

function db() {
  if (!ready) {
    ready = connect().then(async (client) => {
      const d = client.db(process.env.MONGODB_DB || "zene")
      const records = d.collection<Row>("records")
      const snapshots = d.collection<Snapshot>("snapshots")
      const usage = d.collection<Record<string, unknown>>("ai_usage")
      await records.createIndex({ userId: 1, updatedAt: -1 })
      await records.createIndex({ userId: 1, id: 1 }, { unique: true })
      await usage.createIndex({ ts: -1 })
      return { records, snapshots, usage }
    })
  }
  return ready
}

function strip(row: Row): SandtrayRecord {
  const out = { ...row } as Partial<Row>
  delete out.userId
  delete (out as { _id?: unknown })._id
  return out as SandtrayRecord
}

const key = (userId: string, recordId: string) => `${userId}:${recordId}`

export const mongoStore: Store = {
  async list(userId) {
    const { records } = await db()
    return (await records.find({ userId }).sort({ updatedAt: -1 }).limit(200).toArray()).map(strip)
  },
  async get(userId, id) {
    const { records } = await db()
    const row = await records.findOne({ userId, id })
    return row ? strip(row) : null
  },
  async put(userId, record) {
    const { records } = await db()
    await records.replaceOne({ userId, id: record.id }, { ...record, userId }, { upsert: true })
  },
  async remove(userId, id) {
    const { records, snapshots } = await db()
    const res = await records.deleteOne({ userId, id })
    await snapshots.deleteOne({ _id: key(userId, id) })
    return res.deletedCount > 0
  },
  async putSnapshot(userId, recordId, data) {
    const { snapshots } = await db()
    await snapshots.updateOne(
      { _id: key(userId, recordId) },
      { $set: { data, updatedAt: Date.now() } },
      { upsert: true },
    )
  },
  async getSnapshot(userId, recordId) {
    const { snapshots } = await db()
    return (await snapshots.findOne({ _id: key(userId, recordId) }))?.data ?? null
  },
  async putUsage(entry) {
    const { usage } = await db()
    await usage.insertOne(entry)
  },
}
