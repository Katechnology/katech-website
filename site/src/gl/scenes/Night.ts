import {
  AdditiveBlending,
  Color,
  Group,
  Mesh,
  MeshBasicNodeMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector2,
} from 'three/webgpu'
import { floor, fract, length, sin, smoothstep, step, texture, time as tslTime, uniform, uv, vec2, color as tslColor } from 'three/tsl'
import type { Assets } from '../assets'
import { aspectOf } from '../assets'
import type { FrameInfo, Stage } from '../stage'
import { inkSize, makeTitle, type WipeText } from '../text'
import { clamp01, cover, damp, easeInOut, easeOut, isMobile, lerp, remap, rng, viewSize } from '../util'
import type { Dict } from '../../i18n'

const BG_Z = -40
const TITLE_Z = -18

interface Floater {
  group: Group
  lantern: Mesh
  glow: Mesh
  x: number
  z: number
  phase: number
  drift: number
}

export class Night implements Stage {
  scene = new Scene()
  camera = new PerspectiveCamera(35, 1, 0.1, 200)

  private bg: Mesh
  private lines: WipeText[] = []
  private floaters: Floater[] = []
  private sent: { group: Group; text: WipeText; born: number; lantern: Mesh; glow: Mesh } | null = null
  private assets: Assets
  private ptr = new Vector2()
  private pointerS = new Vector2()
  private now = 0
  private waterY = -1

  constructor(assets: Assets) {
    this.assets = assets
    this.scene.background = new Color('#120A24')
    const { tex } = assets

    const mat = new MeshBasicNodeMaterial()
    const u = uv()
    const water = smoothstep(0.42, 0.05, u.y)
    const off = sin(u.y.mul(320).add(tslTime.mul(1.1))).mul(0.0022).mul(water)
    // sparse twinkling stars in the upper sky: one candidate per cell, hashed
    const cell = floor(u.mul(vec2(260, 150)))
    const h = fract(sin(cell.dot(vec2(12.9898, 78.233))).mul(43758.5453))
    const local = fract(u.mul(vec2(260, 150))).sub(0.5)
    const dot = smoothstep(0.16, 0.0, length(local))
    const twinkle = sin(tslTime.mul(h.mul(3).add(1)).add(h.mul(40))).mul(0.5).add(0.5)
    const stars = step(0.982, h).mul(dot).mul(twinkle).mul(smoothstep(0.62, 0.85, u.y)).mul(0.55)
    mat.colorNode = texture(tex.night, vec2(u.x.add(off), u.y)).rgb.add(stars)
    this.bg = new Mesh(new PlaneGeometry(1, 1), mat)
    this.bg.position.z = BG_Z
    this.scene.add(this.bg)

    const r = rng(23)
    for (let i = 0; i < 9; i++) this.floaters.push(this.makeLantern(r() * 1.8 - 0.9, lerp(-36, -17, r()), r() * 6, lerp(0.15, 0.4, r())))
  }

  private makeLantern(x: number, z: number, phase: number, drift: number): Floater {
    const group = new Group()
    const glowMat = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending })
    const flick = uniform(1)
    const g = length(uv().sub(0.5).mul(vec2(1, 1.6)))
    glowMat.colorNode = tslColor('#FFB34A').mul(smoothstep(0.5, 0.0, g).mul(0.55).mul(flick))
    const glow = new Mesh(new PlaneGeometry(1, 1), glowMat)
    glow.scale.set(3.2, 2.2, 1)
    glow.position.y = 0.1
    glow.renderOrder = 6
    const lm = new MeshBasicNodeMaterial({ map: this.assets.tex.lantern, transparent: true, depthWrite: false })
    const lantern = new Mesh(new PlaneGeometry(1, 1), lm)
    lantern.scale.set(1.5, 1.5 / aspectOf(this.assets.tex.lantern), 1)
    lantern.renderOrder = 7
    group.add(glow, lantern)
    this.scene.add(group)
    group.userData.flick = flick
    return { group, lantern, glow, x, z, phase, drift }
  }

  setLang(d: Dict) {
    const parts = d.night.title.split('\n')
    const f = this.assets.fonts
    if (!this.lines.length) {
      parts.forEach((p, i) => {
        const last = i === parts.length - 1
        const t = makeTitle(last ? f.serifItalic : f.serif, p, {
          color: last ? '#E8A33D' : '#FFF7EC',
          em: 1,
          anchor: 'baseline-left',
          band: 0.35,
        })
        this.lines.push(t)
        this.scene.add(t.mesh)
      })
    } else {
      parts.forEach((p, i) => this.lines[i]?.setText(p))
    }
    this.layout()
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.layout()
  }

  private layout() {
    const v = viewSize(this.camera, -BG_Z)
    const c = cover(aspectOf(this.assets.tex.night), v.w, v.h, 1.08)
    this.bg.scale.set(c.w, c.h, 1)
    // water line of the painting is ~ 40% from the bottom
    this.waterY = -c.h / 2 + c.h * 0.36
    if (!this.lines.length) return
    const mobile = isMobile()
    const tv = viewSize(this.camera, -TITLE_Z)
    const widest = Math.max(...this.lines.map((l) => inkSize(l, 1).w))
    const em = Math.min((mobile ? tv.w * 0.78 : tv.w * 0.34) / widest, tv.h * 0.11)
    const lh = em * 1.12
    const sx = mobile ? 0.11 : 0.08
    const sy = mobile ? 0.16 : 0.24
    this.lines.forEach((l, i) => {
      l.mesh.scale.setScalar(em)
      l.mesh.position.set((sx - 0.5) * tv.w, (0.5 - sy) * tv.h - em * 0.8 - i * lh, TITLE_Z)
    })
    const bottom = sy + (em * 0.8 + (this.lines.length - 1) * lh + em * 0.3) / tv.h
    document.documentElement.style.setProperty('--night-title-bottom', `${(bottom * 100).toFixed(2)}vh`)
  }

  phase(t: number) {
    return t < 0.15 ? 'enter' : 'night'
  }

  pointer(ndc: Vector2, kind: 'move' | 'down' | 'leave') {
    if (kind === 'leave') this.ptr.set(0, 0)
    else this.ptr.copy(ndc)
  }

  /** Float a lantern carrying the visitor's message across the river. */
  release(message: string) {
    const f = this.assets.fonts
    if (this.sent) {
      this.scene.remove(this.sent.group)
      this.sent.text.dispose({ map: false })
    }
    const short = message.length > 60 ? message.slice(0, 58).trimEnd() + '…' : message
    const fl = this.makeLantern(0, -6, 0, 0)
    const text = makeTitle(f.sans, short, { color: '#FFF7EC', em: 0.22, align: 'center', maxWidth: 680 })
    text.mesh.position.y = 1.0
    text.uniforms.wipeIn.value = 0
    fl.group.add(text.mesh)
    this.floaters.pop()
    this.sent = { group: fl.group, text, born: this.now, lantern: fl.lantern, glow: fl.glow }
  }

  update({ t, dt, time, reduced }: FrameInfo) {
    this.now = time
    const cam = this.camera
    this.pointerS.x = damp(this.pointerS.x, reduced ? 0 : this.ptr.x, 2.5, dt)
    this.pointerS.y = damp(this.pointerS.y, reduced ? 0 : this.ptr.y, 2.5, dt)
    cam.position.set(this.pointerS.x * 0.6, this.pointerS.y * 0.3 + lerp(0.6, -0.2, t), 0)

    this.lines.forEach((l, i) => {
      const a = 0.06 + i * 0.07
      l.uniforms.wipeIn.value = reduced ? (t > 0.05 ? 1 : 0) : easeInOut(remap(t, a, a + 0.16))
    })

    for (const f of this.floaters) {
      const z = f.z
      const v = viewSize(cam, -z)
      const y = this.waterY * (-z / -BG_Z) * 0.98
      const bob = reduced ? 0 : Math.sin(time * 0.9 + f.phase) * 0.05
      const x = (f.x * v.w) / 2 + (reduced ? 0 : ((time * f.drift * 0.1) % 2) - 1) * 0
      f.group.position.set(x + Math.sin(time * 0.05 + f.phase) * 0.4, y + bob, z)
      f.group.rotation.z = reduced ? 0 : Math.sin(time * 0.7 + f.phase) * 0.04
      const flick = f.group.userData.flick as { value: number }
      flick.value = reduced ? 1 : 0.85 + Math.sin(time * 7 + f.phase * 3) * 0.08 + Math.sin(time * 13 + f.phase) * 0.05
    }

    if (this.sent) {
      const age = time - this.sent.born
      const k = easeOut(clamp01(age / 9))
      const g = this.sent.group
      const startY = this.waterY * (6 / -BG_Z) - 0.4
      g.position.set(Math.sin(age * 0.4) * 0.3, lerp(startY, this.waterY * (30 / -BG_Z), k) + (reduced ? 0 : Math.sin(age * 1.4) * 0.04), lerp(-6, -30, k))
      this.sent.text.uniforms.wipeIn.value = easeOut(clamp01(age / 0.9))
      this.sent.text.uniforms.wipeOut.value = remap(age, 6, 8.5)
      const flick = g.userData.flick as { value: number }
      flick.value = 0.9 + Math.sin(time * 8) * 0.08
    }
  }
}
