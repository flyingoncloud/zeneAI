import * as THREE from "three"
import { TRAY, WATER_LEVEL, type Terrain } from "./terrain"

const MAX_RIP = 12
const RIP_LIFE = 2.8

// 指针划过水面产生的涟漪：每条记录圆心 / 起始时刻 / 振幅，着色器按扩散的波前计算高度。
// 只改高度和法线，不叠加白色亮斑。
export class Ripples {
  readonly data = Array.from({ length: MAX_RIP }, () => new THREE.Vector4(0, 0, 0, 0))
  private next = 0
  private last = { x: 1e9, z: 1e9, t: -1 }
  // 涟漪时刻须与着色器 uTime 同一时间轴，由渲染循环传入
  private now = 0

  // 只在有水处起波纹，并做节流。
  // 返回是否产生了涟漪，调用方据此播放水声。
  tryAdd(x: number, z: number, groundHeight: number, amp = 0.042) {
    if (Math.hypot(x, z) > 26.5) return false
    if (groundHeight > WATER_LEVEL - 0.03) return false
    if (this.now - this.last.t < 0.085) return false
    if (Math.hypot(x - this.last.x, z - this.last.z) < 0.55) return false
    this.last = { x, z, t: this.now }
    this.data[this.next % MAX_RIP].set(x, z, this.now, amp)
    this.next++
    return true
  }

  tick(now: number) {
    this.now = now
    for (const v of this.data) if (v.w > 0 && now - v.z > RIP_LIFE) v.w = 0
  }
}

// 挖到水位以下时，水从坑底逐渐上涨。
// 每个连通的坑有独立水面，从挖穿时的坑底随时间上涨；继续挖深不会拉低水面。
// 着色器从水深中扣除距水位的差值，呈现水从坑底往上漫的效果。
const SEEP_N = 512
const SEEP_MAX = 8
const SEEP_RISE = 0.3
// 刚挖穿时水面略低于坑底，延迟一会儿才露出
const SEEP_DELAY = 0.8
const DRY = -1e9
// 读档时已存在的坑，水是满的
const FULL = 1e9

export class Seep {
  readonly data = new Uint8Array(SEEP_N * SEEP_N)
  readonly texture = new THREE.DataTexture(this.data, SEEP_N, SEEP_N, THREE.RedFormat, THREE.UnsignedByteType)
  private box: { c0: number; c1: number; r0: number; r1: number } | null = null
  // 每格的水面高度（DRY = 干的，FULL = 读档时就有水）
  private level = new Float32Array(SEEP_N * SEEP_N).fill(FULL)
  private height = new Float32Array(SEEP_N * SEEP_N)
  private shown = new Float32Array(SEEP_N * SEEP_N)
  private seen = new Uint8Array(SEEP_N * SEEP_N)
  private queue = new Int32Array(SEEP_N * SEEP_N)

  constructor() {
    this.texture.magFilter = THREE.LinearFilter
    this.texture.minFilter = THREE.LinearFilter
    this.texture.needsUpdate = true
  }

  private cell(v: number) {
    return Math.max(0, Math.min(SEEP_N - 1, Math.floor(((v + TRAY / 2) / TRAY) * SEEP_N)))
  }

  touch(x: number, z: number, r: number) {
    const c0 = this.cell(x - r - 1), c1 = this.cell(x + r + 1)
    const r0 = this.cell(z - r - 1), r1 = this.cell(z + r + 1)
    const b = this.box
    this.box = b
      ? { c0: Math.min(b.c0, c0), c1: Math.max(b.c1, c1), r0: Math.min(b.r0, r0), r1: Math.max(b.r1, r1) }
      : { c0, c1, r0, r1 }
  }

  update(terrain: Terrain, dt: number) {
    const b = this.box
    if (!b) return
    const N = SEEP_N
    const { level, height, shown, seen, queue } = this
    const step = TRAY / N
    const c0 = Math.max(2, b.c0), c1 = Math.min(N - 3, b.c1)
    const r0 = Math.max(2, b.r0), r1 = Math.min(N - 3, b.r1)
    const inBox = (i: number) => {
      const r = (i / N) | 0, c = i - r * N
      return r >= r0 && r <= r1 && c >= c0 && c <= c1
    }

    for (let r = r0; r <= r1; r++) {
      const z = -TRAY / 2 + (r + 0.5) * step
      for (let c = c0; c <= c1; c++) {
        const i = r * N + c
        const h = terrain.getHeightAt(-TRAY / 2 + (c + 0.5) * step, z)
        height[i] = h
        seen[i] = 0
        if (h >= WATER_LEVEL) level[i] = DRY
      }
    }

    // 按连通的坑分组，每组一个水面：新坑从坑底以下开始，已有的坑沿用原水面，随时间上涨
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const start = r * N + c
        if (seen[start] || height[start] >= WATER_LEVEL) continue
        let head = 0, tail = 0
        queue[tail++] = start
        seen[start] = 1
        let bottom = Infinity, prev = DRY
        while (head < tail) {
          const i = queue[head++]
          bottom = Math.min(bottom, height[i])
          prev = Math.max(prev, level[i])
          for (let k = 0; k < 4; k++) {
            const j = i + (k === 0 ? -1 : k === 1 ? 1 : k === 2 ? -N : N)
            if (!seen[j] && inBox(j) && height[j] < WATER_LEVEL) { seen[j] = 1; queue[tail++] = j }
          }
        }
        const l = Math.min(WATER_LEVEL, (prev === DRY ? bottom - SEEP_DELAY : prev) + SEEP_RISE * dt)
        for (let k = 0; k < tail; k++) level[queue[k]] = l
      }
    }

    // 岸边向外补两圈，干格子取周围（含对角）湿格子的水面，使插值后的岸线平滑
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { const i = r * N + c; shown[i] = level[i] }
    for (let pass = 0; pass < 2; pass++) {
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const i = r * N + c
          if (level[i] !== DRY || (pass === 1 && shown[i] !== DRY)) continue
          let best = DRY
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const j = i + dr * N + dc
              if (j !== i && inBox(j)) best = Math.max(best, pass === 0 ? level[j] : shown[j])
            }
          }
          if (pass === 0) shown[i] = best
          else if (best !== DRY) shown[i] = best
        }
      }
    }

    let changed = false
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const i = r * N + c
        const l = shown[i]
        // 挖穿那一帧渗水尚未计算，远离水的干格子标为无水，避免先按满水闪一下
        const v = l === DRY ? 255 : Math.round((Math.min(SEEP_MAX, Math.max(0, WATER_LEVEL - l)) / SEEP_MAX) * 255)
        if (v !== this.data[i]) { this.data[i] = v; changed = true }
      }
    }
    if (changed) this.texture.needsUpdate = true
  }

  dispose() { this.texture.dispose() }
}

type WaterUniforms = {
  uTime: { value: number }
  uRes: { value: THREE.Vector2 }
  uNear: { value: number }
  uFar: { value: number }
  // 正交与透视相机的深度换算不同，以此切换
  uOrtho: { value: number }
}

// 深度软边水：先把除水以外的场景深度渲进 RT，水盘据此算每像素真实水深，
// 岸边渐隐消掉硬交线的锯齿，再按水深从浅青 mix 到深蓝。
export function makeWaterMaterial(depthTexture: THREE.DepthTexture, ripples: Ripples, seep: Seep) {
  const seepOn = { value: 1 }
  const uniforms: WaterUniforms = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(2, 2) },
    uNear: { value: 0.1 },
    uFar: { value: 2000 },
    uOrtho: { value: 0 },
  }
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    // 过于光滑时太阳高光会缩成窄束，正交相机下整片水同时进出高光，造成全屏闪亮
    roughness: 0.42,
    metalness: 0,
    transparent: true,
    opacity: 1,
    // 正交相机下整片水的反射方向一致：俯视时反射环境贴图亮顶，贴近地平线时菲涅尔拉满，
    // 两种情况都会糊成一层白膜。因此关闭环境反射，
    // 高光改用下方自算的菲涅尔，偏淡蓝且封顶。
    envMapIntensity: 0,
    depthWrite: false,
  })
  material.onBeforeCompile = (sh) => {
    sh.uniforms.tDepth = { value: depthTexture }
    sh.uniforms.uRes = uniforms.uRes
    sh.uniforms.uNear = uniforms.uNear
    sh.uniforms.uFar = uniforms.uFar
    sh.uniforms.uOrtho = uniforms.uOrtho
    sh.uniforms.uTime = uniforms.uTime
    sh.uniforms.uRip = { value: ripples.data }
    sh.uniforms.uSeep = { value: seep.texture }
    sh.uniforms.uSeepOn = seepOn
    sh.uniforms.uShallow = { value: new THREE.Color(0x49b7dd) }
    sh.uniforms.uDeep = { value: new THREE.Color(0x0a4f8c) }
    // 掠射角上抬的那一点亮，用淡蓝不用白
    sh.uniforms.uSky = { value: new THREE.Color(0x7fb4d8) }
    sh.vertexShader =
      "varying vec3 vWP;\n" +
      sh.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\n  vWP = (modelMatrix * vec4(transformed,1.0)).xyz;",
      )
    // 标准材质不一定包含 packing，需自行引入以使用 perspectiveDepthToViewZ；重复引入会编译失败
    const packing = sh.fragmentShader.includes("#include <packing>") ? "" : "#include <packing>"
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        ${packing}
        varying vec3 vWP;
        uniform float uTime;
        uniform vec4 uRip[${MAX_RIP}];   // xy=圆心 z=起始时刻 w=振幅
        uniform sampler2D tDepth;
        uniform vec2 uRes;
        uniform float uNear;
        uniform float uFar;
        uniform float uOrtho;
        uniform vec3 uShallow;
        uniform vec3 uDeep;
        uniform vec3 uSky;
        uniform sampler2D uSeep;
        uniform float uSeepOn;
        float waveH(vec2 p){
          float h = 0.008*sin(p.x*0.85 + uTime*0.50) * sin(p.y*1.05 - uTime*0.38);
          for(int i=0;i<${MAX_RIP};i++){
            vec4 r = uRip[i];
            if(r.w <= 0.0) continue;
            float age = uTime - r.z;
            if(age < 0.0 || age > ${RIP_LIFE.toFixed(1)}) continue;
            float d = length(p - r.xy);
            float dr = d - age * 1.25;                  // 波前向外扩散
            float env = exp(-dr*dr/0.32) * (1.0 - age/${RIP_LIFE.toFixed(1)});
            h += r.w * env * sin(dr * 5.6);
          }
          return h;
        }`,
      )
      .replace(
        "#include <normal_fragment_begin>",
        `#include <normal_fragment_begin>
        { vec2 _p = vWP.xz; const float _e = 0.06;
          float _h0 = waveH(_p);
          vec2 _g = vec2(waveH(_p + vec2(_e,0.0)) - _h0, waveH(_p + vec2(0.0,_e)) - _h0) / _e;
          normal = normalize(normal + vec3(-_g.x, 0.0, -_g.y) * 0.6);   // 波面斜率扰动法线
        }
        // 自己算的菲涅尔：越贴近水平看越亮一点，但封顶，永远不会盖成白茫茫一片。
        // 放在这里是因为 color_fragment 比法线早，那时候 normal 还没算出来。
        {
          float _f = min(pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 5.0), 0.6);
          diffuseColor.rgb = mix(diffuseColor.rgb, uSky, _f * 0.3);
          diffuseColor.a = min(1.0, diffuseColor.a + _f * 0.25);
        }`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float _sd = texture2D(tDepth, gl_FragCoord.xy / uRes).x;
        float _sceneVZ = mix(perspectiveDepthToViewZ(_sd, uNear, uFar), orthographicDepthToViewZ(_sd, uNear, uFar), uOrtho);
        float _fragVZ  = mix(perspectiveDepthToViewZ(gl_FragCoord.z, uNear, uFar), orthographicDepthToViewZ(gl_FragCoord.z, uNear, uFar), uOrtho);
        float _wd = _fragVZ - _sceneVZ;                                // 该像素处的真实水深
        // 渗水按视线打到的那一点沙面取；纹理里是竖直方向差多少，水深是沿视线量的，按倾角换算
        {
          vec3 _fwd = mix(normalize(vWP - cameraPosition), -vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]), uOrtho);
          vec2 _hit = vWP.xz + _fwd.xz * max(_wd, 0.0);
          _wd -= uSeepOn * texture2D(uSeep, _hit / ${TRAY.toFixed(1)} + 0.5).r * ${SEEP_MAX.toFixed(1)} / max(0.2, -_fwd.y);
        }
        float _t  = clamp(_wd / 3.4, 0.0, 1.0);
        diffuseColor.rgb = mix(uShallow, uDeep, _t);
        // 岸边渐隐 + 越深越不透。压太低的话沙色透上来，深水会发白
        diffuseColor.a = smoothstep(0.0, 0.16, _wd) * (0.5 + 0.4*_t);
        diffuseColor.rgb *= 1.0 + waveH(vWP.xz) * 3.0;                  // 波峰略亮波谷略暗，没有任何加白
      `,
      )
  }
  return {
    material,
    // 每帧更新时间、画布尺寸和相机近远裁剪面
    setSeep(on: boolean) { seepOn.value = on ? 1 : 0 },
    sync(now: number, width: number, height: number, near: number, far: number, ortho: boolean) {
      uniforms.uTime.value = now
      uniforms.uRes.value.set(width, height)
      uniforms.uNear.value = near
      uniforms.uFar.value = far
      uniforms.uOrtho.value = ortho ? 1 : 0
    },
  }
}

export function makeDepthTarget() {
  const rt = new THREE.WebGLRenderTarget(2, 2, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
  })
  rt.depthTexture = new THREE.DepthTexture(2, 2)
  rt.depthTexture.type = THREE.UnsignedIntType
  return rt
}
