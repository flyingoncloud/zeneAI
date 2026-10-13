"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber"
import { Html, OrbitControls, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { useSandtray } from "@/stores/sandtray"
import { figureById } from "@/content/figures"
import { Terrain, WATER_LEVEL, isSculpt, smooth } from "./terrain"
import { LIFT_MAX, LIFT_MIN } from "@/types/sandtray"
import { CAM_START, FIGURE_YAW, HORIZON, makeSandMaterial, makeShadowTexture, makeSkirtGeometry, makeSkyGeometry } from "./scene"
import { Ripples, Seep, makeDepthTarget, makeWaterMaterial } from "./water"
import { sfx } from "@/lib/audio/sfx"
import { Sprite } from "@/components/sprite/Sprite"
import { useCopy } from "@/components/layout/LangProvider"
import { withBase } from "@/lib/base-path"
import { cn } from "@/lib/utils"

const DRACO = withBase("/draco/")
const COARSE = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
const MAP_KEYS = ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "aoMap"] as const

// 归一到 def.size 的高度、底面贴地、水平居中。贴图开启各向异性过滤，否则斜看会糊。
function useFigureModel(glb: string, size: number, maxWidth?: number, rot0?: [number, number, number], yaw0?: number) {
  const { scene } = useGLTF(withBase(glb), DRACO)
  const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy())

  return useMemo(() => {
    const obj = scene.clone(true)
    if (rot0) obj.rotation.set(...(rot0.map((d) => (d * Math.PI) / 180) as [number, number, number]))
    // 部分模型正面不是 +Z，按 yaw0 转正
    if (yaw0) obj.rotation.y += (yaw0 * Math.PI) / 180
    obj.updateMatrixWorld(true)

    // 尺寸以高度为主、占地为辅：size / max(高, 0.7×占地)。
    // 只按最长边，身长的动物会比高瘦的显得矮；
    // 只按高度，平放的物件（计算器、电话）会被放得过大。
    // 宽而矮的（彩虹 / 花园）再用 maxWidth 限制。
    const box = new THREE.Box3().setFromObject(obj)
    const s = new THREE.Vector3()
    box.getSize(s)
    const footprint = Math.max(s.x, s.z) || 1
    const measure = Math.max(s.y || 1, footprint * 0.7)
    const byWidth = maxWidth ? maxWidth / footprint : Infinity
    obj.scale.setScalar(Math.min(size / measure, byWidth))
    obj.updateMatrixWorld(true)

    const box2 = new THREE.Box3().setFromObject(obj)
    const c = new THREE.Vector3()
    box2.getCenter(c)
    obj.position.x -= c.x
    obj.position.z -= c.z
    obj.position.y -= box2.min.y
    // 记录半宽、半深和真实高度，供落地时在占地范围内采样沙面高度
    obj.userData.half = [(box2.max.x - box2.min.x) / 2, (box2.max.z - box2.min.z) / 2]
    obj.userData.height = box2.max.y - box2.min.y

    obj.traverse((m) => {
      if (!(m instanceof THREE.Mesh)) return
      m.castShadow = true
      m.receiveShadow = true
      for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
        if (!mat) continue
        for (const k of MAP_KEYS) {
          const t = (mat as THREE.MeshStandardMaterial)[k]
          if (t && t.anisotropy !== maxAniso) {
            t.anisotropy = maxAniso
            t.needsUpdate = true
          }
        }
      }
    })
    return obj
  }, [scene, size, maxWidth, rot0, yaw0, maxAniso])
}

const raycaster = new THREE.Raycaster()
const LONG_PRESS = 300
const handleRay = new THREE.Raycaster()
const handlePointer = new THREE.Vector2()
// 拖完沙具松手时，射线多半落在脚边沙面上，沙面 click 会取消选中。
// 记录拖动结束时刻，短时间内沙面不处理点空地取消选中。
let figureDragEndAt = 0
// 贴片默认法线 +Z，需转到地形法线
const DECAL_UP = new THREE.Vector3(0, 0, 1)
// 阴影贴片和选中圈比沙具宽，不参与拾取，否则在附近挖沙会误选沙具
const noPick = () => null
const decalNormal = new THREE.Vector3()
const screenPos = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)
const camDelta = new THREE.Vector3()
const camF = new THREE.Vector3()
const camR = new THREE.Vector3()
// 透视下沙具倾角补偿系数：0 = 关，1 = 完全补偿。补偿会让底面压不平沙面，默认关闭。
const TILT_FIX = 0
// 正交相机：竖直物体在画面边缘不会外倒（透视下边缘约 7~9°）。
// 代价是没有近大远小。?cam=persp 可切回透视。
const ORTHO = typeof window === "undefined" || new URLSearchParams(location.search).get("cam") !== "persp"
// 正交视锥按画布像素给出，可见世界高度 = 画布高 / zoom。
// ORTHO_WORLD_HEIGHT 取透视 32° 视野在默认机位下的竖直可视范围，用于换算等效 zoom。
// 落地高度：中心加前后左右四点取第二高的沙面。只看中心的话，
// 架在水坑上的桥会沉到坑底，两头插进岸里。
// 再下沉模型高度的 2%，避免沙面细微起伏把脚托在半空。
function groundY(terrain: Terrain, x: number, z: number, rotation: number, ud: { half?: number[]; height?: number }) {
  const [hx, hz] = ud.half ?? [0, 0]
  const c = Math.cos(rotation), s = Math.sin(rotation)
  const hs = [terrain.getHeightAt(x, z)]
  for (const [dx, dz] of [[hx * 0.8, 0], [-hx * 0.8, 0], [0, hz * 0.8], [0, -hz * 0.8]]) {
    hs.push(terrain.getHeightAt(x + dx * c + dz * s, z - dx * s + dz * c))
  }
  // 取第二高：桥两头搭岸即可架起；只有一角碰到沙堆的大件不会被整体抬起
  hs.sort((p, q) => q - p)
  let y = hs[1]
  // 不低于水面：船、桥浮在水上
  y = Math.max(y, WATER_LEVEL)
  const h = ud.height ?? 0
  // 公路等薄片比沙面起伏还薄，需略微抬高，否则会被沙子盖住
  return h < FLAT ? y + 0.04 : y - Math.min(h * 0.02, 0.04)
}
const FLAT = 0.2

// 已摆放沙具的模型，用于叠放：小沙具放到大沙具（花园、桥）上时站在它表面。
// bodiesVer 在任何沙具增删或移动时加一，其余沙具据此重算站立高度，平时不算。
const bodies = new Map<string, { obj: THREE.Object3D; foot: number }>()
let bodiesVer = 0
const supportRay = new THREE.Raycaster()
const DOWN = new THREE.Vector3(0, -1, 0)
const supportFrom = new THREE.Vector3()
const faceUp = new THREE.Vector3()
const SUPPORT_FROM = 40
// 从高处往下找比自己大的沙具上朝上的表面，取最低的一层：花园里是草地而不是树冠，桥上是桥面
function supportY(id: string, x: number, z: number, floor: number, foot: number) {
  const under = [...bodies].filter(([k, b]) => k !== id && b.foot > foot * 1.3).map(([, b]) => b.obj)
  if (!under.length) return -Infinity
  supportRay.set(supportFrom.set(x, floor + SUPPORT_FROM, z), DOWN)
  supportRay.far = SUPPORT_FROM
  let y = -Infinity
  for (const h of supportRay.intersectObjects(under, true)) {
    if (!h.face || h.point.y <= floor + 0.01) continue
    faceUp.copy(h.face.normal).transformDirection(h.object.matrixWorld)
    if (faceUp.y > 0.5) y = h.point.y
  }
  return y
}
const figureOf = (o: THREE.Object3D | null) => {
  for (let n = o; n; n = n.parent) for (const [k, b] of bodies) if (b.obj === n) return k
  return null
}

// 拖动时指针应对准沙具实际站立的高度，而不是坑底。
// 沙具架在坑沿 / 水面上时高于射线命中的沙面，直接用坑底交点会让沙具画在指针上方，
// 并在越过坑沿时跳变。
const dragHit = new THREE.Vector3()
function dragPoint(ray: THREE.Ray, sand: THREE.Mesh, terrain: Terrain, rotation: number, ud: { half?: number[]; height?: number }, lift: number) {
  raycaster.set(ray.origin, ray.direction)
  const hit = raycaster.intersectObject(sand, false)[0]
  if (!hit) return null
  const standY = (x: number, z: number) => Math.max(groundY(terrain, x, z, rotation, ud) + lift, terrain.getHeightAt(x, z) - 0.02)
  // 沿视线二分：从镜头一侧（落地高度之上）到命中沙面的点（落地高度上或之下），
  // 找视线与沙具站立高度的交点。迭代求平面交点在坑沿会振荡，二分稳定
  let lo = 0, hi = hit.distance
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2
    ray.at(mid, dragHit)
    if (dragHit.y > standY(dragHit.x, dragHit.z)) lo = mid
    else hi = mid
  }
  ray.at(hi, dragHit)
  return { x: dragHit.x, z: dragHit.z }
}

const ORTHO_WORLD_HEIGHT = 15.8
// 手机（按画面宽度判断）初始拉到最远，横向可见宽度
const MOBILE_WORLD_WIDTH = 18
const isNarrow = (width: number) => width < 640
const mobileZoom = (width: number) => Math.min(42, width / MOBILE_WORLD_WIDTH)
const camDir = new THREE.Vector3()
const SNAP_ASPECT = 1.6
const SNAP_MIN_SPAN = 8
const capCenter = new THREE.Vector3()
const dropRay = new THREE.Raycaster()
const dropPointer = new THREE.Vector2()

function Figure({ id, figureId, x, z, rotation, scale, lift, terrain, shadowTex, sandRef }: {
  id: string; figureId: string; x: number; z: number; rotation: number; scale: number; lift: number
  terrain: Terrain; shadowTex: THREE.Texture; sandRef: RefObject<THREE.Mesh | null>
}) {
  const meta = figureById.get(figureId)
  const select = useSandtray((s) => s.select)
  const update = useSandtray((s) => s.update)
  const setDragging = useSandtray((s) => s.setDragging)
  const selected = useSandtray((s) => s.selectedId) === id
  const size = meta?.size ?? 1.8
  const model = useFigureModel(meta?.glb ?? "", size * scale, meta?.maxWidth ? meta.maxWidth * scale : undefined, meta?.rot0, meta?.yaw0)
  const ring = size * scale * 0.42
  const foot = Math.max(...((model.userData.half as number[] | undefined) ?? [0]))
  useEffect(() => {
    bodies.set(id, { obj: model, foot })
    bodiesVer++
    return () => { bodies.delete(id); bodiesVer++ }
  }, [id, model, foot])
  const support = useRef(-Infinity)
  // 上次计算时的自身位置和全局版本；拖动中或刚变化后的下一帧（等别的沙具矩阵更新）再算一次
  const seen = useRef({ pose: "", ver: -1, again: false })
  // 手机上给小沙具脚下加一圈不可见的点击区
  const hitR = Math.max(ring * 0.9, 1.1)

  // 拖动只记落点，下一帧再移动：指针事件可达 120Hz，每次重算贴地会造成滞后
  const pending = useRef<{ x: number; z: number } | null>(null)
  // 触屏长按才开始拖动，轻点只选中
  const press = useRef<{ x: number; y: number; timer: ReturnType<typeof setTimeout> } | null>(null)
  const before = useRef<{ x: number; z: number } | null>(null)
  const startDrag = () => {
    const f = useSandtray.getState().layout.figures.find((v) => v.id === id)
    before.current = f ? { x: f.x, z: f.z } : null
    setDragging(id)
  }
  const endDrag = () => {
    const f = useSandtray.getState().layout.figures.find((v) => v.id === id)
    const b = before.current
    if (b && f && (b.x !== f.x || b.z !== f.z)) useSandtray.getState().pushUndo({ kind: "transform", id, before: b })
    before.current = null
  }
  const cancelPress = () => {
    if (press.current) clearTimeout(press.current.timer)
    press.current = null
  }
  const onDown = (e: ThreeEvent<PointerEvent>) => {
    // 指针下还压着更小的沙具时让给它，免得放进花园的小沙具点不到
    const smaller = e.intersections.some((h) => {
      const k = figureOf(h.object)
      return k && k !== id && (bodies.get(k)?.foot ?? Infinity) < foot
    })
    if (smaller) return
    e.stopPropagation()
    select(id)
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    if (e.pointerType === "mouse") return startDrag()
    cancelPress()
    setDragging("press")
    press.current = {
      x: e.nativeEvent.clientX,
      y: e.nativeEvent.clientY,
      timer: setTimeout(() => {
        press.current = null
        navigator.vibrate?.(12)
        startDrag()
      }, LONG_PRESS),
    }
  }
  // 拖动落点直接与沙面几何体求交：交点唯一且连续，坑内外都跟手。
  // 用假想水平面换算会在坑沿振荡（平面降低时交点反而更远）。
  const dragRay = useRef<THREE.Ray | null>(null)
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const p = press.current
    if (p && Math.hypot(e.nativeEvent.clientX - p.x, e.nativeEvent.clientY - p.y) > 10) {
      cancelPress()
      setDragging(null)
    }
    if (useSandtray.getState().draggingId !== id) return
    e.stopPropagation()
    // 这里只记射线，求交放到下一帧
    if (!dragRay.current) dragRay.current = new THREE.Ray()
    dragRay.current.copy(e.ray)
  }
  const onUp = (e: ThreeEvent<PointerEvent>) => {
    const dragging = useSandtray.getState().draggingId
    if (press.current || dragging === "press") {
      cancelPress()
      setDragging(null)
      figureDragEndAt = performance.now()
      return
    }
    if (dragging !== id) return
    e.stopPropagation()
    setDragging(null)
    endDrag()
    figureDragEndAt = performance.now()
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
  }
  useEffect(() => cancelPress, [])

  const group = useRef<THREE.Group>(null)
  const tilt = useRef<THREE.Group>(null)
  const decal = useRef<THREE.Mesh>(null)
  const settled = useRef(false)
  useFrame(({ camera }) => {
    if (dragRay.current && sandRef.current) {
      const hit = dragPoint(dragRay.current, sandRef.current, terrain, rotation, model.userData, lift)
      dragRay.current = null
      if (hit) pending.current = hit
    }
    if (pending.current) {
      const p = pending.current
      pending.current = null
      update(id, { x: p.x, z: p.z })
    }
    const g = group.current
    if (!g) return
    // 最低沉到脚下的沙面（坑底、水底），不会钻进地里
    // 坑沿处采样点高低不一，落地高度会突变，做平滑过渡
    const dragging = useSandtray.getState().draggingId === id
    const ground = groundY(terrain, x, z, rotation, model.userData)
    const pose = `${x},${z},${rotation},${scale}`
    const sn = seen.current
    if (pose !== sn.pose) bodiesVer++
    if (dragging || sn.again || pose !== sn.pose || bodiesVer !== sn.ver) {
      sn.again = !sn.again && !dragging
      sn.pose = pose
      sn.ver = bodiesVer
      support.current = supportY(id, x, z, ground, foot)
    }
    const targetY = Math.max(Math.max(ground, support.current) + lift, terrain.getHeightAt(x, z) - 0.02)
    const dy = targetY - g.position.y
    // 拖动中不做平滑，保持跟手
    g.position.y = Math.abs(dy) < 0.005 || !settled.current || dragging ? targetY : g.position.y + dy * 0.6
    settled.current = true
    // 绕视线轴滚一个小角度抵消透视外倒；不能把模型上轴对齐屏幕，那样等于朝镜头躺倒，脚会离地。
    if (tilt.current && TILT_FIX > 0) {
      const cam = camera as THREE.PerspectiveCamera
      camDelta.copy(g.position).sub(cam.position)
      cam.getWorldDirection(camF)
      camR.set(1, 0, 0).applyQuaternion(cam.quaternion)
      // tanθ = (横向偏移 × 镜头俯角分量) / 视深
      const theta = Math.atan2(camDelta.dot(camR) * UP.dot(camF), camDelta.dot(camF)) * TILT_FIX
      tilt.current.quaternion.setFromAxisAngle(camF, theta)
    }
    // 阴影贴片按落点坡度摆放，贴合沙丘坡面
    const d = decal.current
    if (d) {
      terrain.normalAt(x, z, decalNormal)
      d.quaternion.setFromUnitVectors(DECAL_UP, decalNormal)
      d.position.y = terrain.getHeightAt(x, z) - g.position.y + 0.02
    }
  })

  return (
    <group
      ref={group}
      position={[x, terrain.getHeightAt(x, z), z]}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onClick={(e: ThreeEvent<MouseEvent>) => e.stopPropagation()}
    >
      {/* 倾角补偿只作用于模型，接触阴影和选中圈仍贴沙面 */}
      <group ref={tilt}>
        <group rotation={[0, rotation, 0]}>
          <primitive object={model} />
        </group>
      </group>
      {COARSE && (
        <mesh position={[0, (size * scale) / 2, 0]} userData={{ hideInSnapshot: true }}>
          <cylinderGeometry args={[hitR, hitR, size * scale, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      )}
      {selected && <Handles id={id} ring={ring} sandRef={sandRef} terrain={terrain} ud={model.userData} />}
      {/* 太阳投影落在沙具背后，落地感来自接触阴影 */}
      <mesh ref={decal} renderOrder={1} raycast={noPick} visible={(model.userData.height ?? 1) >= FLAT}>
        <planeGeometry args={[size * scale * 1.15, size * scale * 1.15]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} opacity={0.9} />
      </mesh>
      {selected && (
        <mesh
          position={[0, 0.06, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={6}
          raycast={noPick}
          userData={{ hideInSnapshot: true }}
        >
          <ringGeometry args={[ring, ring * 1.14, 40]} />
          <meshBasicMaterial color="#1F8E50" transparent opacity={0.9} depthTest={false} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

// 选中后脚边的把手：左下拖动位置，右侧旋转角度
type HandleOp =
  | { kind: "move"; dx: number; dz: number; before: { x: number; z: number } }
  | { kind: "rotate"; cx: number; cy: number; a0: number; rot0: number; before: { rotation: number } }
  | { kind: "lift"; y0: number; lift0: number; ppu: number; before: { lift: number } }
const anchorPos = new THREE.Vector3()
const edgePos = new THREE.Vector3()
const camRight = new THREE.Vector3()

function Handles({ id, ring, sandRef, terrain, ud }: {
  id: string; ring: number; sandRef: RefObject<THREE.Mesh | null>; terrain: Terrain; ud: { half?: number[]; height?: number }
}) {
  const copy = useCopy()
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const anchor = useRef<THREE.Group>(null)
  const rotEl = useRef<HTMLButtonElement>(null)
  const liftEl = useRef<HTMLButtonElement>(null)
  const op = useRef<HandleOp | null>(null)

  const toScreen = (v: THREE.Vector3) => {
    const r = gl.domElement.getBoundingClientRect()
    const p = v.clone().project(camera)
    return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height }
  }
  const sandAt = (clientX: number, clientY: number) => {
    const r = gl.domElement.getBoundingClientRect()
    handlePointer.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
    handleRay.setFromCamera(handlePointer, camera)
    const f = figure()
    return sandRef.current && f ? dragPoint(handleRay.ray, sandRef.current, terrain, f.rotation, ud, f.lift ?? 0) : null
  }
  const figure = () => useSandtray.getState().layout.figures.find((f) => f.id === id)

  // 旋转把手随沙具屏幕尺寸定位，缩放视角后仍贴着选中圈
  useFrame(() => {
    const a = anchor.current
    const el = rotEl.current
    const le = liftEl.current
    if (!a || !el) return
    a.getWorldPosition(anchorPos)
    camRight.set(1, 0, 0).applyQuaternion(camera.quaternion)
    edgePos.copy(anchorPos).addScaledVector(camRight, ring)
    const p0 = toScreen(anchorPos)
    const p1 = toScreen(edgePos)
    const off = Math.hypot(p1.x - p0.x, p1.y - p0.y) + 8
    el.style.left = `${off}px`
    // 高度把手与旋转把手左右对称
    if (le) le.style.left = `${-off}px`
  })

  const down = (kind: HandleOp["kind"], e: React.PointerEvent<HTMLButtonElement>) => {
    const f = figure()
    if (!f || !anchor.current) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    if (kind === "move") {
      const hit = sandAt(e.clientX, e.clientY)
      if (!hit) return
      op.current = { kind, dx: f.x - hit.x, dz: f.z - hit.z, before: { x: f.x, z: f.z } }
    } else if (kind === "lift") {
      // 按当前位置 1 单位高度对应的屏幕像素，把拖动像素换算为抬高量
      anchor.current.getWorldPosition(anchorPos)
      const p0 = toScreen(anchorPos)
      const p1 = toScreen(edgePos.copy(anchorPos).setY(anchorPos.y + 1))
      const lift0 = f.lift ?? 0
      op.current = { kind, y0: e.clientY, lift0, ppu: Math.max(8, Math.abs(p1.y - p0.y)), before: { lift: lift0 } }
    } else {
      anchor.current.getWorldPosition(anchorPos)
      const c = toScreen(anchorPos)
      op.current = { kind, cx: c.x, cy: c.y, a0: Math.atan2(e.clientY - c.y, e.clientX - c.x), rot0: f.rotation, before: { rotation: f.rotation } }
    }
    useSandtray.getState().setDragging(kind === "move" ? id : "gesture")
  }
  const move = (e: React.PointerEvent<HTMLButtonElement>) => {
    const o = op.current
    if (!o) return
    e.stopPropagation()
    if (o.kind === "move") {
      const hit = sandAt(e.clientX, e.clientY)
      if (hit) useSandtray.getState().update(id, { x: hit.x + o.dx, z: hit.z + o.dz })
    } else if (o.kind === "lift") {
      const lift = Math.min(LIFT_MAX, Math.max(LIFT_MIN, o.lift0 + (o.y0 - e.clientY) / o.ppu))
      useSandtray.getState().update(id, { lift: Math.abs(lift) < 0.05 ? 0 : lift })
    } else {
      const a = Math.atan2(e.clientY - o.cy, e.clientX - o.cx)
      useSandtray.getState().update(id, { rotation: o.rot0 - (a - o.a0) })
    }
  }
  const up = (e: React.PointerEvent<HTMLButtonElement>) => {
    const o = op.current
    if (!o) return
    e.stopPropagation()
    op.current = null
    const f = figure()
    const s = useSandtray.getState()
    const changed = f && (o.kind === "move" ? f.x !== o.before.x || f.z !== o.before.z
      : o.kind === "lift" ? (f.lift ?? 0) !== o.before.lift : f.rotation !== o.before.rotation)
    if (changed) s.pushUndo({ kind: "transform", id, before: o.before })
    s.setDragging(null)
    figureDragEndAt = performance.now()
  }

  const btn =
    "pointer-events-auto absolute flex size-9 touch-none items-center justify-center rounded-full bg-white text-brand-dark shadow-[0_2px_8px_rgba(0,0,0,0.18)] lg:size-8"
  return (
    <group ref={anchor}>
      <Html zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
        <div className="relative size-0 select-none">
          <button
            type="button"
            aria-label={copy.ui.handles.move}
            onPointerDown={(e) => down("move", e)}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            className={cn(btn, "top-3 -left-4.5 lg:-left-4")}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5">
              <path d="M12 3v18M3 12h18M12 3l-2.6 2.6M12 3l2.6 2.6M12 21l-2.6-2.6M12 21l2.6-2.6M3 12l2.6-2.6M3 12l2.6 2.6M21 12l-2.6-2.6M21 12l-2.6 2.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <button
            ref={rotEl}
            type="button"
            aria-label={copy.ui.handles.rotate}
            onPointerDown={(e) => down("rotate", e)}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            className={cn(btn, "-top-4.5 lg:-top-4")}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5">
              <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <polyline points="19.8,3.8 19.8,8.2 15.4,8.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            ref={liftEl}
            type="button"
            aria-label={copy.ui.handles.lift}
            onPointerDown={(e) => down("lift", e)}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            className={cn(btn, "-top-4.5 -translate-x-full lg:-top-4")}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5">
              <path d="M12 3v18M12 3l-3.5 3.5M12 3l3.5 3.5M12 21l-3.5-3.5M12 21l3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </Html>
    </group>
  )
}

function Sand({ terrain, material, ripples, seep, pending, meshRef, onPlace }: {
  terrain: Terrain; material: THREE.Material; ripples: Ripples; seep: Seep; pending: boolean
  meshRef: RefObject<THREE.Mesh | null>; onPlace: (x: number, z: number) => void
}) {
  const sculpting = useRef<{ x: number; z: number } | null>(null)
  const held = useRef(0)
  // 沙声按笔尖移动距离触发，这里记录上一帧落点
  const lastPt = useRef<{ x: number; z: number } | null>(null)
  const touches = useMemo(() => new Set<number>(), [])
  const waterPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -WATER_LEVEL), [])
  const wp = useMemo(() => new THREE.Vector3(), [])
  const p = useMemo(() => new THREE.Vector3(), [])

  // 按住越久挖得越快
  useFrame((state, dt) => {
    seep.update(terrain, dt)
    const { tool, brush, strength, log } = useSandtray.getState()
    if (!sculpting.current || !isSculpt(tool)) {
      sfx.sculptEnd()
      lastPt.current = null
      return
    }
    held.current += dt
    const mult = 1 + 2.8 * smooth(Math.min(1, held.current / 1.5))
    const rate = tool === "mound" ? 3.4 : tool === "smooth" ? 1.6 : 1.7
    const { x, z } = sculpting.current
    terrain.apply(tool, x, z, brush, rate * strength * dt * mult)
    seep.touch(x, z, brush)
    log("sculpt", { tool, x, z, r: brush })

    // 传入这一帧的实际移动距离，而非平滑后的速度
    const moved = lastPt.current ? Math.hypot(x - lastPt.current.x, z - lastPt.current.z) : 0
    lastPt.current = { x, z }
    sfx.sculpt(tool, moved)
  })

  const at = (e: ThreeEvent<PointerEvent>) => terrain.clampToTray(p.copy(e.point))

  // 双指落下表示转视角 / 缩放，立即结束当前笔画
  useEffect(() => {
    const stop = () => { if (touches.size >= 2) sculpting.current = null }
    const down = (e: PointerEvent) => { if (e.pointerType !== "mouse") { touches.add(e.pointerId); stop() } }
    const up = (e: PointerEvent) => touches.delete(e.pointerId)
    window.addEventListener("pointerdown", down, true)
    window.addEventListener("pointerup", up, true)
    window.addEventListener("pointercancel", up, true)
    return () => {
      window.removeEventListener("pointerdown", down, true)
      window.removeEventListener("pointerup", up, true)
      window.removeEventListener("pointercancel", up, true)
    }
  }, [touches])

  const begin = (e: ThreeEvent<PointerEvent>) => {
    const { tool, pushUndo } = useSandtray.getState()
    // 已选中待放置的沙具时，点击用于放置而非塑沙
    if (pending || !isSculpt(tool)) return
    const hit = at(e)
    if (!hit) return
    e.stopPropagation()
    pushUndo({ kind: "terrain", heights: terrain.heights() })
    sculpting.current = { x: hit.x, z: hit.z }
    held.current = 0
    lastPt.current = null
    sfx.unlock()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const move = (e: ThreeEvent<PointerEvent>) => {
    if (sculpting.current) {
      const hit = at(e)
      if (hit) sculpting.current = { x: hit.x, z: hit.z }
      return
    }
    // 划过水面产生涟漪时才播放水声（水声另有更长的节流间隔）
    if (e.ray.intersectPlane(waterPlane, wp)) {
      if (ripples.tryAdd(wp.x, wp.z, terrain.getHeightAt(wp.x, wp.z))) sfx.water()
    }
  }
  const end = () => {
    sculpting.current = null
    sfx.sculptEnd()
  }

  return (
    <mesh
      ref={meshRef}
      geometry={terrain.geometry}
      material={material}
      receiveShadow
      onPointerDown={begin}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        // 有待放置沙具时直接放置，与当前工具无关；否则点空地取消选中
        if (pending) onPlace(e.point.x, e.point.z)
        else if (performance.now() - figureDragEndAt < 300) return
        else if (useSandtray.getState().selectedId) useSandtray.getState().select(null)
      }}
    />
  )
}

// 外延平沙 + 跟随相机的天穹，任何视角都看不到沙盘边缘
function Horizon({ material }: { material: THREE.Material }) {
  const skirt = useMemo(() => makeSkirtGeometry(), [])
  const sky = useMemo(() => makeSkyGeometry(), [])
  const dome = useRef<THREE.Mesh>(null)
  useFrame(({ camera }) => { dome.current?.position.copy(camera.position) })
  return (
    <>
      <mesh geometry={skirt} material={material} receiveShadow={false} />
      <mesh ref={dome} geometry={sky} renderOrder={-1}>
        <meshBasicMaterial vertexColors side={THREE.BackSide} depthWrite={false} fog={false} />
      </mesh>
    </>
  )
}

function Water({ meshRef, material }: { meshRef: RefObject<THREE.Mesh | null>; material: THREE.Material }) {
  return (
    <mesh ref={meshRef} material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_LEVEL, 0]} renderOrder={2}>
      <circleGeometry args={[70, 96]} />
    </mesh>
  )
}

// 每帧先隐藏水盘渲染深度，再正常渲染。设置了渲染优先级就必须自行 render。
const bufSize = new THREE.Vector2()

// 快照同样先渲深度再渲画面，否则水用的是上一机位的深度，会整片消失
type RenderFrame = (opts?: { fullWater?: boolean }) => void

function RenderPipeline({ waterRef, depthRT, water: rig, ripples, renderRef }: {
  waterRef: RefObject<THREE.Mesh | null>
  depthRT: THREE.WebGLRenderTarget
  water: ReturnType<typeof makeWaterMaterial>
  ripples: Ripples
  renderRef: RefObject<RenderFrame | null>
}) {
  const { gl, scene, camera, clock } = useThree()
  const draw = (now: number) => {
    const cam = camera as THREE.PerspectiveCamera
    const ortho = (camera as unknown as { isOrthographicCamera?: boolean }).isOrthographicCamera === true
    const water = waterRef.current
    if (water) {
      gl.getDrawingBufferSize(bufSize)
      if (depthRT.width !== bufSize.x || depthRT.height !== bufSize.y) {
        depthRT.setSize(Math.max(2, bufSize.x), Math.max(2, bufSize.y))
      }
      rig.sync(now, depthRT.width, depthRT.height, cam.near, cam.far, ortho)
      water.visible = false
      gl.setRenderTarget(depthRT)
      gl.render(scene, camera)
      gl.setRenderTarget(null)
      water.visible = true
    }
    gl.render(scene, camera)
  }
  useEffect(() => {
    renderRef.current = (opts) => {
      if (opts?.fullWater) rig.setSeep(false)
      draw(clock.elapsedTime)
      rig.setSeep(true)
    }
    return () => { renderRef.current = null }
  })
  useFrame(({ clock: c }) => {
    // 读 elapsedTime 属性而非 getElapsedTime()：后者内部调用 getDelta()，
    // 会吃掉本帧时间片，导致其他 useFrame 的 delta 接近零
    const now = c.elapsedTime
    ripples.tick(now)
    draw(now)
  }, 1)
  return null
}

function Lights() {
  const sun = useRef<THREE.DirectionalLight>(null)
  useEffect(() => {
    const l = sun.current
    if (!l) return
    // 4096 深度图在手机上占几十 MB，触屏减半。bias 须随像素尺寸同比放大，
    // 否则阴影会从脚下脱开并整体变淡
    const size = COARSE ? 2048 : 4096
    const k = 4096 / size
    l.shadow.mapSize.set(size, size)
    l.shadow.radius = 2.2
    l.shadow.bias = -0.00015 * k
    l.shadow.normalBias = 0.1 * k
    Object.assign(l.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 0.5, far: 60 })
    l.shadow.camera.updateProjectionMatrix()
  }, [])
  return (
    <>
      <hemisphereLight args={[0xfff4e0, 0xcfe3d2, 0.5]} />
      <directionalLight ref={sun} color={0xfff0d6} intensity={1.45} position={[7, 13, 6]} castShadow />
      <directionalLight color={0xd8e6ff} intensity={0.22} position={[-8, 6, -4]} />
    </>
  )
}

// RoomEnvironment 偏亮，直接使用会让沙面发白，强度标定为 0.2
const ENV_INTENSITY = 0.20

function setEnvironment(scene: THREE.Scene, env: THREE.Texture | null) {
  scene.environment = env
  scene.environmentIntensity = env ? ENV_INTENSITY : 1
}

function RoomEnv() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    setEnvironment(scene, env)
    return () => { setEnvironment(scene, null); env.dispose(); pmrem.dispose() }
  }, [gl, scene])
  return null
}

// 保存时的沙盘快照。固定机位在内容偏向一侧时会截偏甚至截空，
// 因此先对准沙具与塑沙区域的中心、退到刚好框住，拍完再还原。
// 朝向沿用当前视角。
function Capture({ targetRef, terrain, renderRef }: {
  targetRef: RefObject<(() => string) | null>
  terrain: Terrain
  renderRef: RefObject<RenderFrame | null>
}) {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    targetRef.current = () => {
      const cam = camera as THREE.PerspectiveCamera & { isOrthographicCamera?: boolean; zoom: number }
      const pos = cam.position.clone()
      const quat = cam.quaternion.clone()
      const zoom0 = cam.zoom

      // 报告中快照为 16:10，按此比例取景裁图，避免竖屏下被裁掉上下
      const W = gl.domElement.clientWidth, H = gl.domElement.clientHeight
      const cropW = Math.min(W, H * SNAP_ASPECT), cropH = cropW / SNAP_ASPECT

      // 在相机画面平面内求沙具（脚到头）与塑沙区域的范围
      const pts: THREE.Vector3[] = []
      for (const f of useSandtray.getState().layout.figures) {
        const s = (figureById.get(f.figureId)?.size ?? 1.8) * f.scale
        const h = terrain.getHeightAt(f.x, f.z) + (f.lift ?? 0)
        const r = s * 0.5
        pts.push(
          new THREE.Vector3(f.x - r, h, f.z - r), new THREE.Vector3(f.x + r, h, f.z - r),
          new THREE.Vector3(f.x - r, h, f.z + r), new THREE.Vector3(f.x + r, h, f.z + r),
          new THREE.Vector3(f.x, h + s, f.z),
        )
      }
      const dug = terrain.sculptedBounds()
      if (dug) {
        for (const [x, z] of [[dug.minX, dug.minZ], [dug.maxX, dug.minZ], [dug.minX, dug.maxZ], [dug.maxX, dug.maxZ]]) {
          pts.push(new THREE.Vector3(x, terrain.getHeightAt(x, z), z))
        }
      }

      if (pts.length) {
        cam.getWorldDirection(camDir)
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion)
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion)
        let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity, depth = 0
        for (const p of pts) {
          const u = p.dot(right), v = p.dot(up)
          u0 = Math.min(u0, u); u1 = Math.max(u1, u)
          v0 = Math.min(v0, v); v1 = Math.max(v1, v)
          depth += p.dot(camDir)
        }
        depth /= pts.length
        // 四周留白；视野不小于 SNAP_MIN_SPAN，避免单件沙具撑满画面
        let spanU = Math.max((u1 - u0) * 1.25, SNAP_MIN_SPAN)
        let spanV = (v1 - v0) * 1.25
        if (spanU / spanV < SNAP_ASPECT) spanU = spanV * SNAP_ASPECT
        else spanV = spanU / SNAP_ASPECT
        const center = capCenter
          .copy(right).multiplyScalar((u0 + u1) / 2)
          .addScaledVector(up, (v0 + v1) / 2)
          .addScaledVector(camDir, depth)
        if (cam.isOrthographicCamera) {
          cam.zoom = cropW / spanU
          cam.position.copy(center).addScaledVector(camDir, -60)
          cam.updateProjectionMatrix()
        } else {
          const vFov = (cam.fov * Math.PI) / 180
          const dist = (spanV / 2) / Math.tan(vFov / 2) * (H / cropH)
          cam.position.copy(center).addScaledVector(camDir, -Math.min(34, Math.max(7, dist)))
        }
        cam.updateMatrixWorld()
      }

      // 选中圈等界面元素不入镜
      const hidden: THREE.Object3D[] = []
      scene.traverse((o) => {
        if (o.visible && o.userData.hideInSnapshot) { o.visible = false; hidden.push(o) }
      })
      // 拍涨满后的水面，而非渗水中途
      if (renderRef.current) renderRef.current({ fullWater: true })
      else gl.render(scene, camera)
      const k = gl.domElement.width / W
      const out = document.createElement("canvas")
      out.width = Math.round(Math.min(960, cropW * k))
      out.height = Math.round(out.width / SNAP_ASPECT)
      out.getContext("2d")?.drawImage(
        gl.domElement,
        ((W - cropW) / 2) * k, ((H - cropH) / 2) * k, cropW * k, cropH * k,
        0, 0, out.width, out.height,
      )
      const url = out.toDataURL("image/webp", 0.8)
      for (const o of hidden) o.visible = true
      cam.position.copy(pos)
      cam.quaternion.copy(quat)
      if (cam.zoom !== zoom0) { cam.zoom = zoom0; cam.updateProjectionMatrix() }
      cam.updateMatrixWorld()
      if (renderRef.current) renderRef.current()
      else gl.render(scene, camera)
      return url
    }
    return () => { targetRef.current = null }
  }, [gl, scene, camera, targetRef, terrain, renderRef])
  return null
}

// 选中后的直接操作：桌面滚轮调大小；触屏双指捏合调大小、转动调角度
const SC_MIN = 0.5, SC_MAX = 2.2
function Gestures({ terrain }: { terrain: Terrain }) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const setDragging = useSandtray((s) => s.setDragging)
  useEffect(() => {
    const el = gl.domElement
    const pts = new Map<number, { x: number; y: number }>()
    let start: { d: number; a: number; sc: number; rot: number } | null = null
    let snap: { id: string; scale: number; rotation: number } | null = null
    let timer: ReturnType<typeof setTimeout> | undefined

    const current = () => {
      const s = useSandtray.getState()
      if (!s.selectedId) return null
      const f = s.layout.figures.find((x) => x.id === s.selectedId)
      return f ?? null
    }
    const begin = () => {
      const f = current()
      if (f && !snap) snap = { id: f.id, scale: f.scale, rotation: f.rotation }
    }
    const end = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const f = current()
        if (snap && f && f.id === snap.id && (f.scale !== snap.scale || f.rotation !== snap.rotation)) {
          useSandtray.getState().pushUndo({
            kind: "transform",
            id: snap.id,
            before: { scale: snap.scale, rotation: snap.rotation },
          })
        }
        snap = null
      }, 420)
    }

    const onWheel = (e: WheelEvent) => {
      const f = current()
      if (!f) return
      e.preventDefault()
      e.stopPropagation()
      begin()
      const scale = Math.max(SC_MIN, Math.min(SC_MAX, f.scale * (e.deltaY < 0 ? 1.07 : 0.93)))
      useSandtray.getState().update(f.id, { scale })
      end()
    }
    const pair = () => {
      const [a, b] = [...pts.values()]
      return { d: Math.hypot(a.x - b.x, a.y - b.y), a: Math.atan2(b.y - a.y, b.x - a.x) }
    }
    // 选中沙具的屏幕位置：双指离它较远时交给视角控制
    const onScreen = (f: { x: number; z: number }) => {
      const r = gl.domElement.getBoundingClientRect()
      screenPos.set(f.x, terrain.getHeightAt(f.x, f.z) + 0.6, f.z).project(camera)
      return {
        x: r.left + ((screenPos.x + 1) / 2) * r.width,
        y: r.top + ((1 - screenPos.y) / 2) * r.height,
      }
    }

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const f = current()
      if (pts.size === 2 && f) {
        const [a, b] = [...pts.values()]
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        const p = onScreen(f)
        // 双指落在别处时为转视角 / 缩放，不修改沙具
        if (Math.hypot(mid.x - p.x, mid.y - p.y) > 150) return
        const g = pair()
        start = { ...g, sc: f.scale, rot: f.rotation }
        setDragging("gesture")
        begin()
      }
    }
    const onMove = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const f = current()
      if (!start || pts.size !== 2 || !f || start.d <= 10) return
      e.preventDefault()
      e.stopPropagation()
      const g = pair()
      useSandtray.getState().update(f.id, {
        scale: Math.max(SC_MIN, Math.min(SC_MAX, start.sc * (g.d / start.d))),
        rotation: start.rot - (g.a - start.a),
      })
    }
    const onUp = (e: PointerEvent) => {
      pts.delete(e.pointerId)
      if (pts.size < 2 && start) {
        start = null
        setDragging(null)
        end()
      }
    }

    el.addEventListener("wheel", onWheel, { passive: false, capture: true })
    el.addEventListener("pointerdown", onDown, true)
    el.addEventListener("pointermove", onMove, true)
    el.addEventListener("pointerup", onUp, true)
    el.addEventListener("pointercancel", onUp, true)
    return () => {
      clearTimeout(timer)
      el.removeEventListener("wheel", onWheel, true)
      el.removeEventListener("pointerdown", onDown, true)
      el.removeEventListener("pointermove", onMove, true)
      el.removeEventListener("pointerup", onUp, true)
      el.removeEventListener("pointercancel", onUp, true)
    }
  }, [gl, camera, terrain, setDragging])
  return null
}

// 视角默认锁定，开启「转视角」后才可旋转；缩放始终可用
function Controls() {
  const dragging = useSandtray((s) => s.draggingId)
  const orbit = useSandtray((s) => s.tool) === "orbit"
  const width = useThree((s) => s.size.width)
  return (
    <OrbitControls
      // 转视角计入动作流水（节流在 store 中）
      onChange={(e) => {
        useSandtray.getState().log("camera")
        const c = e?.target as unknown as { getAzimuthalAngle?: () => number; getPolarAngle?: () => number } | undefined
        if (c?.getAzimuthalAngle && c.getPolarAngle) useSandtray.setState({ view: { yaw: c.getAzimuthalAngle(), polar: c.getPolarAngle() } })
      }}
      // 拖动或双指调整沙具时禁用相机控制
      enabled={!dragging}
      enableDamping
      dampingFactor={0.12}
      rotateSpeed={0.55}
      zoomSpeed={0.9}
      enablePan={false}
      target={[0, -0.1, 0]}
      minDistance={14}
      maxDistance={46}
      // 正交相机靠 zoom 缩放；下限不宜过小，否则缩远后只剩空沙
      minZoom={isNarrow(width) ? mobileZoom(width) : 42}
      maxZoom={140}
      maxPolarAngle={1.126}
      touches={{ ONE: orbit ? THREE.TOUCH.ROTATE : undefined, TWO: orbit ? THREE.TOUCH.DOLLY_ROTATE : THREE.TOUCH.DOLLY_PAN }}
      mouseButtons={{
        LEFT: orbit ? THREE.MOUSE.ROTATE : undefined,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: orbit ? THREE.MOUSE.ROTATE : undefined,
      }}
    />
  )
}

function Scene({ terrain, captureRef, placeRef, activeFigureId, onPlaced }: {
  terrain: Terrain
  captureRef: RefObject<(() => string) | null>
  placeRef: RefObject<((clientX: number, clientY: number) => boolean) | null>
  activeFigureId: string | null
  onPlaced: () => void
}) {
  // 旧记录中可能有已不在沙具库里的沙具，跳过不渲染
  const figures = useSandtray((s) => s.layout.figures).filter((f) => figureById.has(f.figureId))
  const place = useSandtray((s) => s.place)
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const sandRef = useRef<THREE.Mesh>(null)

  const sandMat = useMemo(() => makeSandMaterial(), [])
  const shadowTex = useMemo(() => makeShadowTexture(), [])
  const ripples = useMemo(() => new Ripples(), [])
  const depthRT = useMemo(() => makeDepthTarget(), [])
  const seep = useMemo(() => new Seep(), [])
  const renderRef = useRef<RenderFrame | null>(null)
  const water = useMemo(() => makeWaterMaterial(depthRT.depthTexture!, ripples, seep), [depthRT, ripples, seep])
  const waterRef = useRef<THREE.Mesh>(null)

  useEffect(() => () => {
    sandMat.dispose()
    shadowTex.dispose()
    water.material.dispose()
    depthRT.dispose()
    seep.dispose()
  }, [sandMat, shadowTex, water, depthRT, seep])

  const onPlace = (x: number, z: number) => {
    if (!activeFigureId) return
    // 默认朝镜头再侧转 FIGURE_YAW。按相机朝向而非相机位置计算，
    // 否则两侧的沙具朝向会各偏几度，成排摆放时呈散开状
    camera.getWorldDirection(camDir)
    const rotation = Math.atan2(-camDir.x, -camDir.z) + FIGURE_YAW
    place({ id: `${activeFigureId}-${Date.now()}`, figureId: activeFigureId, x, z, rotation, scale: 1 })
    onPlaced()
  }

  // 沙具卡片拖入沙盘：松手时按屏幕坐标向沙面投射射线
  useEffect(() => {
    placeRef.current = (clientX, clientY) => {
      if (!activeFigureId || !sandRef.current) return false
      const r = gl.domElement.getBoundingClientRect()
      if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return false
      dropPointer.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
      dropRay.setFromCamera(dropPointer, camera)
      const hit = dropRay.intersectObject(sandRef.current, false)[0]
      if (!hit) return false
      onPlace(hit.point.x, hit.point.z)
      return true
    }
    return () => { placeRef.current = null }
  })

  return (
    <>
      <fog attach="fog" args={[HORIZON, 110, 300]} />
      <Lights />
      <RoomEnv />
      <Horizon material={sandMat} />
      <Sand terrain={terrain} material={sandMat} ripples={ripples} seep={seep} pending={!!activeFigureId} meshRef={sandRef} onPlace={onPlace} />
      <Water meshRef={waterRef} material={water.material} />
      {/* 每件沙具单独一个 Suspense，共用会导致新沙具加载时整组卸载、
          所有沙具闪烁 */}
      {figures.map((f) => (
        <Suspense key={f.id} fallback={null}>
          <Figure
            id={f.id}
            figureId={f.figureId}
            x={f.x}
            z={f.z}
            rotation={f.rotation}
            scale={f.scale}
            lift={f.lift ?? 0}
            terrain={terrain}
            shadowTex={shadowTex}
            sandRef={sandRef}
          />
        </Suspense>
      ))}
      <Controls />
      <Gestures terrain={terrain} />
      <Capture targetRef={captureRef} terrain={terrain} renderRef={renderRef} />
      <RenderPipeline waterRef={waterRef} depthRT={depthRT} water={water} ripples={ripples} renderRef={renderRef} />
    </>
  )
}

// 显存紧张时手机会回收 WebGL 上下文，画面变空白且不再绘制。
// 必须 preventDefault，否则浏览器不会尝试恢复。
function ContextGuard({ onLost, onRestored }: { onLost: () => void; onRestored: () => void }) {
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    const el = gl.domElement
    const lost = (e: Event) => {
      e.preventDefault()
      onLost()
    }
    const restored = () => {
      onRestored()
      // 阴影图随上下文丢失，恢复后须标脏，否则场景没有阴影
      gl.shadowMap.needsUpdate = true
      invalidate()
    }
    el.addEventListener("webglcontextlost", lost)
    el.addEventListener("webglcontextrestored", restored)
    return () => {
      el.removeEventListener("webglcontextlost", lost)
      el.removeEventListener("webglcontextrestored", restored)
    }
  }, [gl, invalidate, onLost, onRestored])
  return null
}

// 浏览器的 3D 能力：none = 不支持 WebGL，直接提示；software = 硬件加速被关，能画但可能很慢，交给超时判断
type GlSupport = "ok" | "software" | "none"
function detectGl(): GlSupport {
  try {
    const c = document.createElement("canvas")
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null
    if (!gl) return "none"
    const info = gl.getExtension("WEBGL_debug_renderer_info")
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ""
    gl.getExtension("WEBGL_lose_context")?.loseContext()
    return /swiftshader|llvmpipe|software|basic render/i.test(name) ? "software" : "ok"
  } catch {
    return "none"
  }
}
const STUCK_MS = 12000

// 3D 画不出来时的提示：多半是浏览器关掉了硬件加速
function GlHint() {
  const t = useCopy().sandtray.noGl
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#e9e2c9] px-8 text-center">
      <Sprite speech={t.title} className="w-24" />
      <p className="text-base font-semibold text-[#3b3a30]">{t.title}</p>
      <p className="max-w-sm text-sm leading-6 text-[#6b6450]">{t.hint}</p>
      <button type="button" onClick={() => location.reload()} className="mt-1 h-10 rounded-full bg-brand px-6 text-sm font-semibold text-white">
        {t.reload}
      </button>
    </div>
  )
}

// 场景画出第二帧后通知外层撤掉加载画面（第一帧常在着色器编译时卡住）
function Ready({ onReady }: { onReady: () => void }) {
  const n = useRef(0)
  useFrame(() => {
    if (++n.current === 2) onReady()
  })
  return null
}

export function SandtrayCanvas({ activeFigureId, captureRef, placeRef, terrain, onPlaced }: {
  activeFigureId: string | null
  captureRef: RefObject<(() => string) | null>
  placeRef: RefObject<((clientX: number, clientY: number) => boolean) | null>
  terrain: Terrain
  onPlaced: () => void
}) {
  const copy = useCopy()
  const [lost, setLost] = useState(false)
  const onLost = useCallback(() => setLost(true), [])
  const onRestored = useCallback(() => setLost(false), [])
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const [gl] = useState<GlSupport>(() => (typeof window === "undefined" ? "ok" : detectGl()))
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    if (ready) return
    const t = setTimeout(() => setStuck(true), STUCK_MS)
    return () => clearTimeout(t)
  }, [ready])
  const blocked = stuck && !ready

  if (gl === "none") return <GlHint />

  return (
    <>
    <Canvas
      orthographic={ORTHO}
      // 透视模式用 32° 视野减轻两侧外倒（45° 时边缘约 9.4°，32° 约 7°），
      // 机位按 tan 比例后撤以保持构图
      camera={
        ORTHO
          // 正交近远裁剪面须罩住整个场景（外延沙面 ±600，天穹半径 400），
          // far 过小会切开远处，露出一条天色带
          ? { position: CAM_START, zoom: 52, near: -1000, far: 2000 }
          : { position: CAM_START, fov: 32 }
      }
      onCreated={({ camera, size }) => {
        // 按画布尺寸换算初始 zoom
        if (ORTHO) {
          const cam = camera as THREE.OrthographicCamera
          cam.zoom = isNarrow(size.width) ? mobileZoom(size.width) : size.height / ORTHO_WORLD_HEIGHT
          cam.updateProjectionMatrix()
        }
      }}
      // 触屏 DPR 上限 1.5：像素量约为 2 的 0.56 倍，画质差别很小
      dpr={COARSE ? [1, 1.5] : [1, 2]}
      shadows
      gl={{ preserveDrawingBuffer: true, toneMappingExposure: 1.1 }}
      scene={{ background: new THREE.Color(HORIZON) }}
    >
      <ContextGuard onLost={onLost} onRestored={onRestored} />
      <Scene terrain={terrain} captureRef={captureRef} placeRef={placeRef} activeFigureId={activeFigureId} onPlaced={onPlaced} />
      <Suspense fallback={null}>
        <Ready onReady={onReady} />
      </Suspense>
    </Canvas>
    {blocked && !ready ? (
      <GlHint />
    ) : (
      <div
        aria-hidden={ready}
        className={`pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#e9e2c9] transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}
      >
        <Sprite speech={copy.sandtray.preparing} className="w-24" />
        <p className="text-sm text-[#6b6450]">{copy.sandtray.preparing}</p>
      </div>
    )}
    {lost && (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-white/95 px-8 text-center">
        <p className="text-base font-semibold text-black">{copy.sandtray.lost.title}</p>
        <p className="text-sm text-ink-muted">{copy.sandtray.lost.hint}</p>
        <button
          type="button"
          onClick={() => location.reload()}
          className="mt-1 h-10 rounded-full bg-brand px-6 text-sm font-semibold text-white"
        >
          {copy.sandtray.lost.reload}
        </button>
      </div>
    )}
    </>
  )
}
