import * as THREE from "three"
import { C_DRY, SAND_BASE, TRAY } from "./terrain"

// 天空渐变：地平线暖沙色，往上过渡到天蓝。雾与地平线同色，天地之间无接缝
export const HORIZON = 0xd9cba4

// 默认机位及对应朝向（与 OrbitControls 的方位角 / 极角同一口径）
export const CAM_START: [number, number, number] = [-9.9, 12.9, 22.1]
export const CAM_VIEW = {
  yaw: Math.atan2(CAM_START[0], CAM_START[2]),
  polar: Math.atan2(Math.hypot(CAM_START[0], CAM_START[2]), CAM_START[1] + 0.1),
}
// 沙具放下时朝一侧偏转，露出侧身；与缩略图角度一致
export const FIGURE_YAW = (35 * Math.PI) / 180

const SKYMID = 0xcfe0ea
const SKYTOP = 0x8fc0e8

// 沙面材质：着色器按颗粒计算明暗色差和稀疏微反光
export function makeSandMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0,
    envMapIntensity: 0.32,
  })
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uGCell = { value: 0.018 } // 单颗粒尺寸（世界单位），越小越细
    sh.vertexShader =
      "varying vec3 vWPos;\n" +
      sh.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\n  vWPos = (modelMatrix * vec4(transformed,1.0)).xyz;",
      )
    const head =
      "varying vec3 vWPos;\nuniform float uGCell;\n" +
      "float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }\n"
    sh.fragmentShader =
      head +
      sh.fragmentShader
        // 水下淡化颗粒色差
        .replace(
          "#include <color_fragment>",
          "#include <color_fragment>\n  float _uw = 1.0 - smoothstep(-1.1, -0.7, vWPos.y);\n" +
            "  { vec2 gid=floor(vWPos.xz/uGCell); float g=hash21(gid+3.1); diffuseColor.rgb *= mix(0.82 + 0.34*g, 1.0, _uw); }",
        )
        // 水下不出反光点
        .replace(
          "#include <roughnessmap_fragment>",
          "#include <roughnessmap_fragment>\n  { vec2 gid=floor(vWPos.xz/uGCell); float g=hash21(gid+1.7); roughnessFactor *= mix(0.8 + 0.4*g, 1.0, _uw); float sp=hash21(gid+7.3); if(sp>0.9955 && _uw<0.5) roughnessFactor=0.14; }",
        )
        .replace(
          "#include <metalnessmap_fragment>",
          "#include <metalnessmap_fragment>\n  { vec2 gid=floor(vWPos.xz/uGCell); float sp=hash21(gid+7.3); if(sp>0.9955 && _uw<0.5) metalnessFactor=0.45; }",
        )
  }
  return mat
}

// 主沙面(130)之外铺到 600 的外延平沙，几何体须延伸到雾之外，否则会露边
export function makeSkirtGeometry() {
  const outer = 600
  const inner = TRAY / 2 - 0.05
  const shape = new THREE.Shape()
  shape.moveTo(-outer, -outer)
  shape.lineTo(outer, -outer)
  shape.lineTo(outer, outer)
  shape.lineTo(-outer, outer)
  shape.lineTo(-outer, -outer)
  const hole = new THREE.Path()
  hole.moveTo(-inner, -inner)
  hole.lineTo(inner, -inner)
  hole.lineTo(inner, inner)
  hole.lineTo(-inner, inner)
  hole.lineTo(-inner, -inner)
  shape.holes.push(hole)
  const geo = new THREE.ShapeGeometry(shape)
  geo.rotateX(-Math.PI / 2)
  const n = geo.attributes.position.count
  const col = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    col[i * 3] = C_DRY.r
    col[i * 3 + 1] = C_DRY.g
    col[i * 3 + 2] = C_DRY.b
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3))
  geo.translate(0, SAND_BASE, 0)
  return geo
}

// 跟随相机的渐变天穹球，地平线作为水平参照。
// 顶点色 MeshBasic 与地面雾色使用同一套色调映射，避免接缝。
export function makeSkyGeometry() {
  const R = 400
  const geo = new THREE.SphereGeometry(R, 48, 24)
  const p = geo.attributes.position
  const col = new Float32Array(p.count * 3)
  const cH = new THREE.Color(HORIZON)
  const cM = new THREE.Color(SKYMID)
  const cT = new THREE.Color(SKYTOP)
  const tmp = new THREE.Color()
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / R
    const a = Math.max(0, Math.min(1, y / 0.035)) // 过渡带压薄，天地交界看得出来
    tmp.copy(cH).lerp(cM, a * a * (3 - 2 * a))
    const b = Math.max(0, Math.min(1, (y - 0.035) / 0.45))
    tmp.lerp(cT, b * b * (3 - 2 * b))
    col[i * 3] = tmp.r
    col[i * 3 + 1] = tmp.g
    col[i * 3 + 2] = tmp.b
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3))
  return geo
}

// 脚下的接触阴影。太阳在右后上方，投影基本被沙具挡住，落地感靠这张贴片，
// 中心要实、边缘收得快，否则近看像浮着。
export function makeShadowTexture() {
  const c = document.createElement("canvas")
  c.width = c.height = 256
  const g = c.getContext("2d")!
  const rg = g.createRadialGradient(128, 128, 4, 128, 128, 128)
  rg.addColorStop(0, "rgba(52,44,26,.62)")
  rg.addColorStop(0.42, "rgba(52,44,26,.34)")
  rg.addColorStop(0.72, "rgba(52,44,26,.11)")
  rg.addColorStop(1, "rgba(52,44,26,0)")
  g.fillStyle = rg
  g.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(c)
}
