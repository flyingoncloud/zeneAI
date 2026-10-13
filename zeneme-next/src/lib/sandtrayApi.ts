import type { ExploreDirection, Report, SandtrayLayout, SandtrayRecord } from "@/types/sandtray"
import { withBase } from "@/lib/base-path"

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(withBase(url), {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error || "请求失败")
  return data as T
}

export const api = {
  listRecords: () => req<{ records: SandtrayRecord[] }>("/api/sandtray/records"),
  getRecord: (id: string) => req<{ record: SandtrayRecord }>(`/api/sandtray/records/${id}`),
  createRecord: (body: {
    name?: string
    story?: string
    layout: SandtrayLayout
    snapshot?: string
    direction?: ExploreDirection
    status?: "draft" | "pending"
  }) =>
    req<{ record: SandtrayRecord }>("/api/sandtray/records", { method: "POST", body: JSON.stringify(body) }),
  updateRecord: (id: string, patch: Partial<SandtrayRecord>) =>
    req<{ record: SandtrayRecord }>(`/api/sandtray/records/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  removeRecord: (id: string) => req<{ ok: boolean }>(`/api/sandtray/records/${id}`, { method: "DELETE" }),
  analyze: (id: string) => req<{ report: Report }>(`/api/sandtray/records/${id}/analyze`, { method: "POST" }),
}
