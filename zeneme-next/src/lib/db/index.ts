import "server-only"
import { fileStore } from "./file"
import { mongoStore } from "./mongo"
import type { Store } from "./types"

// 配置 MONGODB_URI 时使用 Mongo，否则使用本地文件存储
export const store: Store = process.env.MONGODB_URI ? mongoStore : fileStore
