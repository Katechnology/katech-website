import {
  CanvasTexture,
  Color,
  Mesh,
  MeshBasicNodeMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  RenderTarget,
  Scene,
  SRGBColorSpace,
  Vector2,
  WebGPURenderer,
  MathUtils,
} from 'three/webgpu'
import {
  abs,
  float,
  length,
  max,
  min,
  mix,
  sin,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  color as tslColor,
} from 'three/tsl'
import type { Assets } from '../assets'
import { aspectOf } from '../assets'
import type { FrameInfo, Stage } from '../stage'
import { inkSize, makeTitle, type WipeText } from '../text'
import { clamp01, cover, easeInOut, isMobile, lerp, remap } from '../util'
import type { Dict } from '../../i18n'

const BG_Z = -12

/** Screen rectangles measured on the painting (0..1, y from top). */
const RECTS = {
  web: { x0: 0.3605, x1: 0.6465, y0: 0.4295, y1: 0.7425 },
  video: { x0: 0.1745, x1: 0.2905, y0: 0.6145, y1: 0.7955 },
  app: { x0: 0.6735, x1: 0.7235, y0: 0.6805, y1: 0.8305 },
} as const
type DeviceKey = keyof typeof RECTS

const SITE_W = 1.63
const SITE_H = 1

/** Rounded-rectangle mask in uv space. */
function roundMask(aspect: number, radius: number) {
  const u = uv()
  const p = vec2(u.x.sub(0.5).mul(aspect), u.y.sub(0.5))
  const b = vec2(aspect * 0.5 - radius, 0.5 - radius)
  const q = abs(p).sub(b)
  const d = length(max(q, vec2(0, 0))).add(min(max(q.x, q.y), 0)).sub(radius)
  return smoothstep(0.004, -0.004, d)
}

export class Cafe implements Stage {
  scene = new Scene()
  camera = new PerspectiveCamera(35, 1, 0.1, 100)

  private bg: Mesh
  private bw = 1
  private bh = 1
  private screens: Record<DeviceKey, Mesh>
  private spot: Mesh
  private spotCenter = uniform(new Vector2(0.5, 0.5))
  private spotAmount = uniform(0)
  private spotRadius = uniform(0.12)
  private spotAspect = uniform(16 / 9)

  // website (rendered with Lettra into a render target)
  private siteScene = new Scene()
  private siteCam = new OrthographicCamera(-SITE_W / 2, SITE_W / 2, SITE_H / 2, -SITE_H / 2, 0.1, 10)
  private siteRT = new RenderTarget(1630, 1000, { samples: 4 })
  private siteDirty = true
  private siteName!: WipeText
  private siteTag!: WipeText
  private siteNav!: WipeText
  private siteBrand!: WipeText
  private siteCta!: WipeText
  private siteNameIn = 0

  // phone + tv are drawn with canvas 2D
  private phoneCanvas = document.createElement('canvas')
  private phoneTex: CanvasTexture
  private tvCanvas = document.createElement('canvas')
  private tvTex: CanvasTexture
  private lastCanvasDraw = -1
  private tvTime = uniform(0)

  private assets: Assets
  private dict!: Dict
  private shopName = ''
  private visible = false

  constructor(assets: Assets) {
    this.assets = assets
    this.scene.background = new Color('#2b1a14')
    const { tex } = assets

    const bgMat = new MeshBasicNodeMaterial()
    bgMat.colorNode = texture(tex.cafe)
    this.bg = new Mesh(new PlaneGeometry(1, 1), bgMat)
    this.bg.position.z = BG_Z
    this.scene.add(this.bg)

    // --- website RT scene ---
    this.siteCam.position.z = 5
    const paperMat = new MeshBasicNodeMaterial()
    paperMat.colorNode = texture(tex.paper).rgb.mul(vec3(1.0, 0.99, 0.97))
    const paper = new Mesh(new PlaneGeometry(SITE_W, SITE_H), paperMat)
    this.siteScene.add(paper)
    // photo card on the right: the dawn river, rounded
    const photoMat = new MeshBasicNodeMaterial({ transparent: true })
    const pa = 0.62 / 0.74
    const pu = uv()
    photoMat.colorNode = texture(tex.hero, vec2(pu.x.mul(0.42).add(0.05), pu.y.mul(0.85).add(0.1))).rgb
    photoMat.opacityNode = roundMask(pa, 0.05)
    const photo = new Mesh(new PlaneGeometry(0.62, 0.74), photoMat)
    photo.position.set(0.42, -0.06, 0.01)
    this.siteScene.add(photo)
    // CTA pill
    const ctaMat = new MeshBasicNodeMaterial({ transparent: true })
    ctaMat.colorNode = tslColor('#4B1D8F')
    ctaMat.opacityNode = roundMask(0.34 / 0.085, 0.0425)
    const cta = new Mesh(new PlaneGeometry(0.34, 0.085), ctaMat)
    cta.position.set(-0.53, -0.29, 0.01)
    cta.name = 'cta'
    this.siteScene.add(cta)
    // thin rule under the nav
    const ruleMat = new MeshBasicNodeMaterial()
    ruleMat.colorNode = tslColor('#2A0F5C')
    const rule = new Mesh(new PlaneGeometry(SITE_W - 0.16, 0.002), ruleMat)
    rule.position.set(0, 0.375, 0.01)
    this.siteScene.add(rule)
    // gold dot accent
    const dotMat = new MeshBasicNodeMaterial({ transparent: true })
    dotMat.colorNode = tslColor('#E8A33D')
    dotMat.opacityNode = roundMask(1, 0.5)
    const dot = new Mesh(new PlaneGeometry(0.03, 0.03), dotMat)
    dot.position.set(-0.75, 0.42, 0.01)
    dot.name = 'dot'
    this.siteScene.add(dot)

    // --- canvases ---
    this.phoneCanvas.width = 360
    this.phoneCanvas.height = 760
    this.phoneTex = new CanvasTexture(this.phoneCanvas)
    this.phoneTex.colorSpace = SRGBColorSpace
    this.tvCanvas.width = 640
    this.tvCanvas.height = 480
    this.tvTex = new CanvasTexture(this.tvCanvas)
    this.tvTex.colorSpace = SRGBColorSpace

    // --- screens mapped onto the painting ---
    const webMat = new MeshBasicNodeMaterial()
    webMat.colorNode = texture(this.siteRT.texture, vec2(uv().x, uv().y.oneMinus())).rgb
    const appMat = new MeshBasicNodeMaterial({ transparent: true })
    appMat.colorNode = texture(this.phoneTex).rgb
    appMat.opacityNode = roundMask(0.05 / 0.15, 0.03)
    // CRT: scanlines, vignette, slight barrel
    const tvMat = new MeshBasicNodeMaterial({ transparent: true })
    const tu = uv().sub(0.5)
    const r2 = tu.dot(tu)
    const bent = tu.mul(float(1).add(r2.mul(0.18))).add(0.5)
    const crt = texture(this.tvTex, bent).rgb
    const scan = sin(bent.y.mul(480 * 3.14159)).mul(0.06).add(0.94)
    const vig = smoothstep(0.62, 0.18, length(tu.mul(vec2(1.0, 1.15))))
    tvMat.colorNode = crt.mul(scan).mul(mix(float(0.55), float(1.06), vig)).add(vec3(0.02, 0.0, 0.04))
    tvMat.opacityNode = roundMask(1.25, 0.12)

    this.screens = {
      web: new Mesh(new PlaneGeometry(1, 1), webMat),
      app: new Mesh(new PlaneGeometry(1, 1), appMat),
      video: new Mesh(new PlaneGeometry(1, 1), tvMat),
    }
    for (const m of Object.values(this.screens)) {
      m.position.z = BG_Z + 0.01
      m.renderOrder = 2
      this.scene.add(m)
    }

    // spotlight dimmer over everything except the focused device
    const spotMat = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
    const su = uv()
    const sd = length(vec2(su.x.sub(this.spotCenter.x).mul(this.spotAspect), su.y.sub(this.spotCenter.y)))
    spotMat.colorNode = tslColor('#140a26')
    spotMat.opacityNode = smoothstep(this.spotRadius, this.spotRadius.mul(2.4), sd).mul(this.spotAmount).mul(0.62)
    this.spot = new Mesh(new PlaneGeometry(1, 1), spotMat)
    this.spot.position.z = BG_Z + 0.02
    this.spot.renderOrder = 3
    this.scene.add(this.spot)

    void this.tvTime
  }

  setLang(d: Dict) {
    this.dict = d
    const f = this.assets.fonts
    const name = this.shopName || d.cafe.namePlaceholder
    if (!this.siteName) {
      this.siteName = makeTitle(f.serifBold, name, { color: '#2A0F5C', em: 0.15, anchor: 'baseline-left' })
      this.siteTag = makeTitle(f.serifItalic, d.cafe.siteTagline, { color: '#4B1D8F', em: 0.052, anchor: 'baseline-left' })
      this.siteNav = makeTitle(f.sans, d.cafe.siteNav.join('     '), { color: '#2A0F5C', em: 0.034, anchor: 'baseline-left' })
      this.siteBrand = makeTitle(f.serifBold, name, { color: '#2A0F5C', em: 0.042, anchor: 'baseline-left' })
      this.siteCta = makeTitle(f.sans, d.cafe.siteCta, { color: '#FFF7EC', em: 0.034 })
      for (const t of [this.siteTag, this.siteNav, this.siteBrand, this.siteCta]) t.uniforms.wipeIn.value = 1
      this.siteName.uniforms.wipeIn.value = 1
      this.siteScene.add(this.siteName.mesh, this.siteTag.mesh, this.siteNav.mesh, this.siteBrand.mesh, this.siteCta.mesh)
    } else {
      this.siteTag.setText(d.cafe.siteTagline)
      this.siteNav.setText(d.cafe.siteNav.join('     '))
      this.siteCta.setText(d.cafe.siteCta)
      this.setShopName(this.shopName)
    }
    this.layoutSite()
    this.siteDirty = true
    this.lastCanvasDraw = -1
  }

  setShopName(name: string) {
    this.shopName = name.trim().slice(0, 28)
    if (!this.siteName || !this.dict) return
    const shown = this.shopName || this.dict.cafe.namePlaceholder
    this.siteName.setText(shown)
    this.siteBrand.setText(shown)
    this.layoutSite()
    this.siteNameIn = 0
    this.siteDirty = true
    this.lastCanvasDraw = -1
  }

  private layoutSite() {
    const left = -SITE_W / 2 + 0.09
    // shrink the big name so long names still fit the left column
    const maxW = 0.82
    this.siteName.mesh.scale.setScalar(0.15)
    const w = inkSize(this.siteName, 0.15).w
    if (w > maxW) this.siteName.mesh.scale.setScalar((0.15 * maxW) / w)
    this.siteName.mesh.position.set(left, 0.02, 0.02)
    this.siteTag.mesh.position.set(left + 0.004, -0.1, 0.02)
    this.siteBrand.mesh.position.set(left + 0.04, 0.405, 0.02)
    const bw = inkSize(this.siteBrand, 0.042).w
    if (bw > 0.5) this.siteBrand.mesh.scale.setScalar((0.042 * 0.5) / bw)
    const nw = inkSize(this.siteNav, 0.034).w
    this.siteNav.mesh.position.set(SITE_W / 2 - 0.09 - nw, 0.405, 0.02)
    const cta = this.siteScene.getObjectByName('cta')!
    cta.position.set(left + 0.17, -0.24, 0.01)
    this.siteCta.mesh.position.set(left + 0.17, -0.24, 0.02)
    this.siteScene.getObjectByName('dot')!.position.set(left + 0.012, 0.418, 0.01)
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    const v = this.viewAt(-BG_Z)
    const c = cover(aspectOf(this.assets.tex.cafe), v.w, v.h, 1.02)
    this.bg.scale.set(c.w, c.h, 1)
    this.bw = c.w
    this.bh = c.h
    this.spot.scale.set(c.w, c.h, 1)
    this.spotAspect.value = c.w / c.h
    for (const k of Object.keys(RECTS) as DeviceKey[]) {
      const r = RECTS[k]
      const m = this.screens[k]
      m.scale.set((r.x1 - r.x0) * c.w, (r.y1 - r.y0) * c.h, 1)
      m.position.x = ((r.x0 + r.x1) / 2 - 0.5) * c.w
      m.position.y = (0.5 - (r.y0 + r.y1) / 2) * c.h
    }
  }

  private viewAt(d: number) {
    const h = 2 * d * Math.tan(MathUtils.degToRad(this.camera.fov) / 2)
    return { w: h * this.camera.aspect, h }
  }

  /** Camera z (relative to BG) that makes a device rect fill the viewport. */
  private frameFor(k: DeviceKey, fill = 1) {
    const r = RECTS[k]
    const w = (r.x1 - r.x0) * this.bw
    const h = (r.y1 - r.y0) * this.bh
    const tanH = Math.tan(MathUtils.degToRad(this.camera.fov) / 2)
    // smallest distance at which the rect covers the view (so no painting shows)
    const dh = h / (2 * tanH)
    const dw = w / (2 * tanH * this.camera.aspect)
    // landscape: cover the viewport; portrait: fit the width so the whole page reads
    const dCover = (this.camera.aspect < 1 ? Math.max(dh, dw) : Math.min(dh, dw)) * fill
    return {
      x: ((r.x0 + r.x1) / 2 - 0.5) * this.bw,
      y: (0.5 - (r.y0 + r.y1) / 2) * this.bh,
      z: BG_Z + dCover,
    }
  }

  phase(t: number) {
    if (t < 0.24) return 'site'
    if (t < 0.4) return 'pull'
    if (t < 0.58) return 'web'
    if (t < 0.76) return 'app'
    if (t < 0.94) return 'video'
    return 'leave'
  }

  focusOf(t: number): { key: DeviceKey | null; amt: number } {
    const seg = (a: number, b: number) => Math.min(remap(t, a, a + 0.05), 1 - remap(t, b - 0.05, b))
    const w = seg(0.4, 0.58)
    const a = seg(0.58, 0.76)
    const v = seg(0.76, 0.94)
    if (w > 0) return { key: 'web', amt: w }
    if (a > 0) return { key: 'app', amt: a }
    if (v > 0) return { key: 'video', amt: v }
    return { key: null, amt: 0 }
  }

  setVisible(v: boolean) {
    this.visible = v
  }

  prerender(renderer: WebGPURenderer) {
    if (this.siteDirty || this.siteNameIn < 1) {
      const prev = renderer.getRenderTarget()
      renderer.setRenderTarget(this.siteRT)
      renderer.render(this.siteScene, this.siteCam)
      renderer.setRenderTarget(prev)
      this.siteDirty = false
    }
  }

  update({ t, time, dt, reduced }: FrameInfo) {
    if (!this.siteName) return
    const cam = this.camera
    const mobile = isMobile()

    // Website name pops in with a wipe whenever it changes
    if (this.siteNameIn < 1) {
      this.siteNameIn = Math.min(1, this.siteNameIn + dt * 2.2)
      this.siteName.uniforms.wipeIn.value = reduced ? 1 : easeInOut(this.siteNameIn)
    }

    // Camera: start inside the monitor (the website fills the screen), pull back to the café,
    // then lean toward each device in turn.
    const full = { x: 0, y: 0, z: 0 }
    const site = this.frameFor('web', 0.985)
    const pull = easeInOut(remap(t, 0.2, 0.42))
    let x = lerp(site.x, full.x, pull)
    let y = lerp(site.y, full.y, pull)
    let z = lerp(site.z, full.z, pull)
    const f = this.focusOf(t)
    if (f.key) {
      const fr = this.frameFor(f.key)
      const lean = easeInOut(f.amt) * (mobile ? 0.8 : 0.38)
      const leanZ = f.key === 'web' ? lean * 0.55 : lean
      x = lerp(x, fr.x, lean)
      y = lerp(y, fr.y, lean)
      z = lerp(z, fr.z + (f.key === 'web' ? 6 : 3.2), leanZ)
      // On phones, keep the device in the upper half so the caption can sit below.
      if (mobile) y -= lean * this.bh * 0.06
      const r = RECTS[f.key]
      this.spotCenter.value.set((r.x0 + r.x1) / 2, 1 - (r.y0 + r.y1) / 2)
      this.spotRadius.value = f.key === 'web' ? 0.17 : f.key === 'video' ? 0.09 : 0.06
    }
    this.spotAmount.value = f.key ? easeInOut(f.amt) : 0
    const sway = reduced ? 0 : Math.sin(time * 0.3) * 0.03
    cam.position.set(x + sway, y, z)

    // Animated device canvases (~20 fps while visible)
    if (this.visible && time - this.lastCanvasDraw > 0.05) {
      this.lastCanvasDraw = time
      this.drawPhone(time, reduced)
      this.drawTv(time, reduced)
      this.phoneTex.needsUpdate = true
      this.tvTex.needsUpdate = true
    }
    void clamp01
  }

  private drawPhone(time: number, reduced: boolean) {
    const c = this.phoneCanvas.getContext('2d')!
    const W = c.canvas.width
    const H = c.canvas.height
    const d = this.dict.cafe
    const name = this.shopName || d.namePlaceholder
    c.fillStyle = '#FBF7F1'
    c.fillRect(0, 0, W, H)
    // header
    c.fillStyle = '#4B1D8F'
    c.fillRect(0, 0, W, 190)
    c.fillStyle = 'rgba(255,255,255,.75)'
    c.font = '500 22px "Be Vietnam Pro", sans-serif'
    c.fillText('9:41', 26, 42)
    c.fillStyle = '#E8A33D'
    c.beginPath()
    c.arc(W - 36, 34, 7, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#FFFFFF'
    c.font = '600 34px "Fraunces", serif'
    this.fitText(c, name, 26, 112, W - 52)
    c.fillStyle = 'rgba(255,255,255,.8)'
    c.font = '500 22px "Be Vietnam Pro", sans-serif'
    c.fillText(d.phone.title, 26, 154)
    // week row
    const sel = reduced ? 4 : Math.floor(time / 1.6) % 7
    d.phone.days.forEach((day, i) => {
      const x = 22 + i * 46
      const on = i === sel
      c.fillStyle = on ? '#4B1D8F' : '#EFE7F7'
      this.roundRect(c, x, 220, 40, 66, 14)
      c.fill()
      c.fillStyle = on ? '#FFFFFF' : '#2A0F5C'
      c.font = '500 16px "Be Vietnam Pro", sans-serif'
      c.textAlign = 'center'
      c.fillText(day, x + 20, 246)
      c.font = '600 20px "Be Vietnam Pro", sans-serif'
      c.fillText(String(10 + i), x + 20, 274)
      c.textAlign = 'left'
    })
    // time slots
    const slots = ['07:00', '08:30', '10:00', '11:30', '17:00', '18:30', '19:00', '20:30']
    const pick = reduced ? 6 : (Math.floor(time / 0.8) + sel) % slots.length
    slots.forEach((s, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = 22 + col * 162
      const y = 316 + row * 74
      const on = i === pick
      c.fillStyle = on ? '#E8A33D' : '#FFFFFF'
      c.strokeStyle = on ? '#E8A33D' : '#E2D6EF'
      c.lineWidth = 2
      this.roundRect(c, x, y, 150, 58, 16)
      c.fill()
      c.stroke()
      c.fillStyle = on ? '#2A0F5C' : '#4B1D8F'
      c.font = '600 22px "Be Vietnam Pro", sans-serif'
      c.fillText(s, x + 44, y + 37)
    })
    // toast
    const cycle = reduced ? 1 : (time % 3.2) / 3.2
    const show = cycle > 0.5 ? Math.min(1, (cycle - 0.5) * 6) : 0
    if (show > 0) {
      const y = H - 40 - 70 * show
      c.globalAlpha = show
      c.fillStyle = '#2A0F5C'
      this.roundRect(c, 22, y, W - 44, 64, 20)
      c.fill()
      c.fillStyle = '#FFF7EC'
      c.font = '600 22px "Be Vietnam Pro", sans-serif'
      c.fillText(`${d.phone.booked}  ${slots[pick]}`, 44, y + 40)
      c.globalAlpha = 1
    }
  }

  private drawTv(time: number, reduced: boolean) {
    const c = this.tvCanvas.getContext('2d')!
    const W = c.canvas.width
    const H = c.canvas.height
    const img = this.assets.tex.hero.image as CanvasImageSource & { width: number; height: number }
    const loop = reduced ? 0.3 : (time % 8) / 8
    // Ken Burns over the dawn river
    const zoom = 1.25 + loop * 0.25
    const sw = img.width / zoom
    const sh = (sw * (H - 80)) / W
    const sx = (img.width - sw) * (0.2 + loop * 0.5)
    const sy = (img.height - sh) * 0.55
    c.drawImage(img, sx, sy, sw, sh, 0, 0, W, H - 80)
    // lower-third title
    const lt = Math.min(1, Math.max(0, (loop - 0.15) * 5)) * (1 - Math.max(0, (loop - 0.85) * 6))
    c.globalAlpha = lt
    c.fillStyle = 'rgba(42,15,92,.82)'
    c.fillRect(28, H - 190, 360, 78)
    c.fillStyle = '#E8A33D'
    c.fillRect(28, H - 190, 8, 78)
    c.fillStyle = '#FFF7EC'
    c.font = '600 30px "Fraunces", serif'
    this.fitText(c, this.shopName || this.dict.cafe.namePlaceholder, 52, H - 150, 320)
    c.font = '500 18px "Be Vietnam Pro", sans-serif'
    c.fillStyle = 'rgba(255,247,236,.8)'
    c.fillText('Huế · 2026', 52, H - 124)
    c.globalAlpha = 1
    // editing timeline
    c.fillStyle = '#1a1030'
    c.fillRect(0, H - 80, W, 80)
    const clips = [
      [0, 0.22, '#7B4FD0'],
      [0.23, 0.48, '#4B1D8F'],
      [0.49, 0.71, '#E8A33D'],
      [0.72, 1, '#9C6BE8'],
    ] as const
    for (const [a, b, col] of clips) {
      c.fillStyle = col
      this.roundRect(c, 14 + a * (W - 28), H - 60, (b - a) * (W - 28) - 4, 26, 6)
      c.fill()
    }
    c.fillStyle = 'rgba(255,255,255,.25)'
    for (let i = 0; i < 40; i++) c.fillRect(14 + i * ((W - 28) / 40), H - 26, 2, i % 5 === 0 ? 12 : 6)
    const ph = 14 + loop * (W - 28)
    c.fillStyle = '#FFFFFF'
    c.fillRect(ph - 1.5, H - 74, 3, 66)
  }

  private fitText(c: CanvasRenderingContext2D, s: string, x: number, y: number, maxW: number) {
    let text = s
    while (c.measureText(text).width > maxW && text.length > 3) text = text.slice(0, -2) + '…'
    c.fillText(text, x, y)
  }

  private roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    c.beginPath()
    c.moveTo(x + r, y)
    c.arcTo(x + w, y, x + w, y + h, r)
    c.arcTo(x + w, y + h, x, y + h, r)
    c.arcTo(x, y + h, x, y, r)
    c.arcTo(x, y, x + w, y, r)
    c.closePath()
  }
}
