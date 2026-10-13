import * as THREE from "three"
import { emptyZones, zoneOf, type View } from "@/lib/sandtray/zones"
import type { LayoutStats } from "@/types/sandtray"

// 沙面高度场：挖 / 堆 / 抹平直接改顶点高度，
// 颜色按相对原始沙面的高低计算。
export const TRAY = 130
export const SEG = 416
export const VW = SEG + 1
// 最深挖到 -5.2（水深约 4.3），最高堆到 11
export const H_MIN = -5.2
export const H_MAX = 11.0
export const SAND_BASE = 1.35
export const WATER_LEVEL = -0.95
// 沙的厚薄以「原始沙面」为参照上下分色
const SAND_REF = SAND_BASE

export const C_DRY = new THREE.Color(0xeed99e)
const C_CREST = new THREE.Color(0xfbf1d4)
const C_HOLLOW = new THREE.Color(0xcfb47a)
const C_WET = new THREE.Color(0xceb478)
const C_WETDEEP = new THREE.Color(0x9c8659)

export type Tool = "none" | "orbit" | "dig" | "mound" | "smooth"

export const isSculpt = (t: Tool): t is "dig" | "mound" | "smooth" => t === "dig" || t === "mound" || t === "smooth"

export const smooth = (t: number) => {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

export class Terrain {
  readonly geometry: THREE.PlaneGeometry
  readonly half = TRAY / 2
  // 未塑沙时不存高度场
  dirty = false
  private pos: THREE.BufferAttribute
  private col: THREE.BufferAttribute
  private x0: number
  private z0: number
  private dx: number
  private dz: number
  private tmp = new THREE.Color()

  constructor() {
    const g = new THREE.PlaneGeometry(TRAY, TRAY, SEG, SEG)
    g.rotateX(-Math.PI / 2)
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(VW * VW * 3), 3))
    this.geometry = g
    this.pos = g.attributes.position as THREE.BufferAttribute
    this.col = g.attributes.color as THREE.BufferAttribute
    this.x0 = this.pos.getX(0)
    this.z0 = this.pos.getZ(0)
    this.dx = this.pos.getX(1) - this.x0
    this.dz = this.pos.getZ(VW) - this.z0
    this.reset()
  }

  reset() {
    this.dirty = false
    for (let i = 0; i < this.pos.count; i++) this.pos.setY(i, SAND_BASE)
    this.undulate()
    this.pos.needsUpdate = true
    this.geometry.computeVertexNormals()
    this.colorize(0, SEG, 0, SEG)
  }

  // 极轻微起伏，避免沙面过于平整；振幅须很小，否则水下会被深度上色放大成锯齿
  private undulate() {
    const bump = (cx: number, cz: number, r: number, amp: number) => {
      for (let i = 0; i < this.pos.count; i++) {
        const x = this.pos.getX(i)
        const z = this.pos.getZ(i)
        const d2 = (x - cx) ** 2 + (z - cz) ** 2
        const k =
          Math.max(0, Math.min(1, (this.half - Math.abs(x)) / 1.2)) *
          Math.max(0, Math.min(1, (this.half - Math.abs(z)) / 1.2))
        const h = this.pos.getY(i) + amp * Math.exp(-d2 / (r * r)) * k
        this.pos.setY(i, Math.max(H_MIN, Math.min(H_MAX, h)))
      }
    }
    bump(-4.5, -4.0, 3.4, 0.025)
    bump(4.2, -4.4, 2.6, 0.018)
    for (let n = 0; n < 8; n++) {
      bump((Math.random() - 0.5) * 13, (Math.random() - 0.5) * 13, 1.8 + Math.random() * 1.4, (Math.random() - 0.5) * 0.018)
    }
  }

  heights(): number[] {
    const out = new Array<number>(this.pos.count)
    for (let i = 0; i < this.pos.count; i++) out[i] = this.pos.getY(i)
    return out
  }

  // 旧记录的网格更粗，按格子比例重采样，不能直接填入
  setHeights(rows: number[]) {
    if (!rows.length) return
    this.dirty = true
    if (rows.length === this.pos.count) {
      for (let i = 0; i < this.pos.count; i++) this.pos.setY(i, rows[i])
    } else {
      const srcVW = Math.round(Math.sqrt(rows.length))
      if (srcVW * srcVW !== rows.length) return
      for (let r = 0; r <= SEG; r++) {
        const sr = Math.min(srcVW - 1, Math.round((r / SEG) * (srcVW - 1)))
        for (let c = 0; c <= SEG; c++) {
          const sc = Math.min(srcVW - 1, Math.round((c / SEG) * (srcVW - 1)))
          this.pos.setY(r * VW + c, rows[sr * srcVW + sc])
        }
      }
    }
    this.pos.needsUpdate = true
    this.geometry.computeVertexNormals()
    this.colorize(0, SEG, 0, SEG)
  }

  getHeightAt(x: number, z: number) {
    let c = (x - this.x0) / this.dx
    let r = (z - this.z0) / this.dz
    c = Math.max(0, Math.min(SEG - 0.001, c))
    r = Math.max(0, Math.min(SEG - 0.001, r))
    const c0 = Math.floor(c)
    const r0 = Math.floor(r)
    const fc = c - c0
    const fr = r - r0
    const i = r0 * VW + c0
    const h00 = this.pos.getY(i)
    const h10 = this.pos.getY(i + 1)
    const h01 = this.pos.getY(i + VW)
    const h11 = this.pos.getY(i + VW + 1)
    return (h00 * (1 - fc) + h10 * fc) * (1 - fr) + (h01 * (1 - fc) + h11 * fc) * fr
  }

  // 保存时结算塑沙数据：挖低 / 堆高的面积与五区分布、最深最高、是否见水。
  // 只统计相对原始沙面有明显变化的格子，不计天然起伏。
  sculptStats(view?: View) {
    const cell = (TRAY / SEG) ** 2
    const dugZones = emptyZones()
    const piledZones = emptyZones()
    let dug = 0
    let piled = 0
    let lo = SAND_REF
    let hi = SAND_REF
    for (let i = 0; i < this.pos.count; i++) {
      const h = this.pos.getY(i)
      const d = h - SAND_REF
      if (h < lo) lo = h
      if (h > hi) hi = h
      if (Math.abs(d) <= 0.05) continue
      const zone = zoneOf(this.pos.getX(i), this.pos.getZ(i), view)
      if (d < 0) { dug += cell; dugZones[zone] += cell }
      else { piled += cell; piledZones[zone] += cell }
    }
    const round = (v: number) => +v.toFixed(2)
    const roundZones = (z: Record<string, number>) =>
      Object.fromEntries(Object.entries(z).map(([k, v]) => [k, round(v)])) as typeof dugZones
    return {
      dugArea: round(dug),
      piledArea: round(piled),
      dugZones: roundZones(dugZones),
      piledZones: roundZones(piledZones),
      maxDepth: round(Math.max(0, SAND_REF - lo)),
      maxHeight: round(Math.max(0, hi - SAND_REF)),
      water: lo < WATER_LEVEL,
    } satisfies Pick<LayoutStats, "dugArea" | "piledArea" | "dugZones" | "piledZones" | "maxDepth" | "maxHeight" | "water">
  }

  // 被挖 / 堆过的范围（xz），供快照取景使用
  sculptedBounds() {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
    for (let i = 0; i < this.pos.count; i++) {
      if (Math.abs(this.pos.getY(i) - SAND_REF) <= 0.05) continue
      const x = this.pos.getX(i)
      const z = this.pos.getZ(i)
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (z < minZ) minZ = z
      if (z > maxZ) maxZ = z
    }
    return minX === Infinity ? null : { minX, maxX, minZ, maxZ }
  }

  // 地形在这一点的法线，用来把脚下的阴影贴片贴着坡度放
  normalAt(x: number, z: number, out: THREE.Vector3) {
    const e = 0.6
    const hx = this.getHeightAt(x + e, z) - this.getHeightAt(x - e, z)
    const hz = this.getHeightAt(x, z + e) - this.getHeightAt(x, z - e)
    return out.set(-hx, 2 * e, -hz).normalize()
  }

  // 可塑区为圆形，超出半径的落点夹回边界，与笔刷收边一致
  clampToTray(p: THREE.Vector3) {
    const d = Math.hypot(p.x, p.z)
    if (d > this.half + 0.2) return null
    if (d > this.half) {
      p.x *= this.half / d
      p.z *= this.half / d
    }
    return p
  }

  apply(tool: Tool, cx: number, cz: number, radius: number, amount: number) {
    this.dirty = true
    const EDGE_FADE = Math.min(3.4, this.half * 0.3)
    // 堆高上限是相对原始沙面的增量；用绝对高度会让小笔刷一开始就堆不动
    const pileCap = Math.min(H_MAX - SAND_REF, 2.6 + radius * 2.4)
    const cMin = Math.max(0, Math.floor((cx - radius - this.x0) / this.dx))
    const cMax = Math.min(SEG, Math.ceil((cx + radius - this.x0) / this.dx))
    const rMin = Math.max(0, Math.floor((cz - radius - this.z0) / this.dz))
    const rMax = Math.min(SEG, Math.ceil((cz + radius - this.z0) / this.dz))

    for (let r = rMin; r <= rMax; r++) {
      for (let c = cMin; c <= cMax; c++) {
        const i = r * VW + c
        const x = this.pos.getX(i)
        const z = this.pos.getZ(i)
        const d2 = (x - cx) ** 2 + (z - cz) ** 2
        if (d2 > radius * radius) continue
        const t = Math.sqrt(d2) / radius
        const w = (1 - t * t) ** 3 // 边缘值与斜率都归零，不留笔刷环痕
        const k = smooth((this.half - Math.hypot(x, z)) / EDGE_FADE) // 圆形平滑收边
        let h = this.pos.getY(i)
        if (tool === "smooth") h += (SAND_REF - h) * Math.min(0.85, w * 1.5 * k * amount * 3)
        else if (tool === "mound") {
          const rise = Math.max(0, h - SAND_REF)
          // 越高增量越小以自然收顶；保留 0.12 下限，到顶后仍可缓慢增加
          h += amount * w * k * Math.max(0.12, 1 - rise / pileCap)
        } else h -= amount * w * k
        this.pos.setY(i, Math.max(H_MIN, Math.min(H_MAX, h)))
      }
    }
    this.blur(cMin, cMax, rMin, rMax, cx, cz, radius)
    this.pos.needsUpdate = true
    this.geometry.computeVertexNormals()
    this.colorize(cMin, cMax, rMin, rMax)
  }

  // 磨掉挖堆留下的网格棱角：笔刷内 8 邻域弱权重多遍平滑，只去高频，不填坑
  private blur(cMin: number, cMax: number, rMin: number, rMax: number, cx: number, cz: number, radius: number) {
    for (let pass = 0; pass < 3; pass++) {
      for (let r = Math.max(1, rMin); r <= Math.min(SEG - 1, rMax); r++) {
        for (let c = Math.max(1, cMin); c <= Math.min(SEG - 1, cMax); c++) {
          const i = r * VW + c
          const x = this.pos.getX(i)
          const z = this.pos.getZ(i)
          if ((x - cx) ** 2 + (z - cz) ** 2 > radius * radius) continue
          const avg =
            (this.pos.getY(i - 1) +
              this.pos.getY(i + 1) +
              this.pos.getY(i - VW) +
              this.pos.getY(i + VW) +
              this.pos.getY(i - 1 - VW) +
              this.pos.getY(i + 1 - VW) +
              this.pos.getY(i - 1 + VW) +
              this.pos.getY(i + 1 + VW)) *
            0.125
          this.pos.setY(i, this.pos.getY(i) * 0.84 + avg * 0.16)
        }
      }
    }
  }

  // 颜色分层：沙脊（亮）、沙坑（暗）、湿沙、深湿沙。水下不画蓝，由水盘按水深叠加。
  // 颜色只取决于顶点高度，塑沙时只需刷新笔刷范围。
  private colorize(cMin: number, cMax: number, rMin: number, rMax: number) {
    const tmp = this.tmp
    for (let r = rMin; r <= rMax; r++) {
      for (let c = cMin; c <= cMax; c++) {
        const i = r * VW + c
        const h = this.pos.getY(i)
        const rel = h - SAND_REF
        tmp.copy(C_DRY)
        // 灵敏度不宜过高，否则笔刷边缘被平滑略微拉低后，沙丘周围会出现一圈暗影
        if (rel > 0) tmp.lerp(C_CREST, Math.min(1, rel / 6.0) * 0.62)
        else tmp.lerp(C_HOLLOW, Math.min(1, -rel / 3.2) * 0.85)
        if (h < 0) tmp.lerp(C_WET, Math.min(1, -h / 0.35))
        if (h < WATER_LEVEL) tmp.lerp(C_WETDEEP, Math.min(1, (WATER_LEVEL - h) / 2.0))
        this.col.setXYZ(i, tmp.r, tmp.g, tmp.b)
      }
    }
    this.col.needsUpdate = true
  }
}

// 高度场量化为 int16 后 deflate，平坦沙面压缩后仅几 KB
export async function encodeHeights(heights: number[]): Promise<string> {
  const buf = new Int16Array(heights.length)
  for (let i = 0; i < heights.length; i++) buf[i] = Math.round(heights[i] * 1000)
  const stream = new Blob([buf.buffer as ArrayBuffer]).stream().pipeThrough(new CompressionStream("deflate-raw"))
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer())
  let s = ""
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

export async function decodeHeights(encoded: string): Promise<number[]> {
  const bin = atob(encoded)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const stream = new Blob([bytes.buffer as ArrayBuffer]).stream().pipeThrough(new DecompressionStream("deflate-raw"))
  const out = new Int16Array(await new Response(stream).arrayBuffer())
  return Array.from(out, (v) => v / 1000)
}
