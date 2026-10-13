import type { SandtrayRecord } from "@/types/sandtray"

export type Store = {
  list(userId: string): Promise<SandtrayRecord[]>
  get(userId: string, id: string): Promise<SandtrayRecord | null>
  put(userId: string, record: SandtrayRecord): Promise<void>
  remove(userId: string, id: string): Promise<boolean>
  // 快照与记录分开存储，读取记录时不必带上图片
  putSnapshot(userId: string, recordId: string, dataUrl: string): Promise<void>
  getSnapshot(userId: string, recordId: string): Promise<string | null>
  // AI 调用记录，用于统计用量
  putUsage(entry: Record<string, unknown>): Promise<void>
}
