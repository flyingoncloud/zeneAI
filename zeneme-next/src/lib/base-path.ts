// 子路径部署（如 /app）时为路径加前缀。
// Next 只会自动处理 Link / Image / 路由，硬编码的 public 路径和 fetch 需经此函数。
// NEXT_PUBLIC_BASE_PATH 为空时原样返回。
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

export const withBase = (path: string) => (path.startsWith("/") ? BASE_PATH + path : path)
