// 沙盘五区：中心 + 四角。前端统计与后端 AI 输入共用这一套划分。
export type ZoneKey = "center" | "topLeft" | "topRight" | "bottomLeft" | "bottomRight"

export const ZONE_KEYS: ZoneKey[] = ["center", "topLeft", "topRight", "bottomLeft", "bottomRight"]

// 区域名会经 prompt 进入报告正文，必须与界面语言一致
export const ZONE_LABEL: Record<"zh" | "en", Record<ZoneKey, string>> = {
  zh: {
    center: "中心",
    topLeft: "左上",
    topRight: "右上",
    bottomLeft: "左下",
    bottomRight: "右下",
  },
  en: {
    center: "centre",
    topLeft: "top-left",
    topRight: "top-right",
    bottomLeft: "bottom-left",
    bottomRight: "bottom-right",
  },
}

// 中心区半径（沙具默认高度约 1.8）
export const CENTER_RADIUS = 2.6

// 保存时的镜头朝向：yaw 绕竖轴的方位角，polar 离竖直方向的角度（three 的 spherical）
export type View = { yaw: number; polar: number }

// 区域按用户保存时屏幕上看到的样子分：屏幕右边就是右，屏幕下方（离镜头近）就是下。
// 斜着看时地面前后方向在屏幕上会被压扁，所以前后距离按俯角换算成屏幕距离再判断中心。
// 未保存朝向的旧记录按地面坐标计算。
export function zoneOf(x: number, z: number, view?: View): ZoneKey {
  const yaw = view?.yaw ?? 0
  const squash = view ? Math.cos(view.polar) : 1
  const c = Math.cos(yaw), s = Math.sin(yaw)
  const right = x * c - z * s
  const near = x * s + z * c
  if (Math.hypot(right, near * squash) < CENTER_RADIUS) return "center"
  if (near < 0) return right < 0 ? "topLeft" : "topRight"
  return right < 0 ? "bottomLeft" : "bottomRight"
}

export function emptyZones(): Record<ZoneKey, number> {
  return { center: 0, topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 }
}
