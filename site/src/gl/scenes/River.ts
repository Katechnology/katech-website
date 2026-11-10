import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicNodeMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector2,
  Color,
} from 'three/webgpu'
import { mix, sin, smoothstep, texture, time, uniform, uv, vec2 } from 'three/tsl'
import type { Assets } from '../assets'
import { aspectOf } from '../assets'
import type { FrameInfo, Stage } from '../stage'
import { makeTitle, type WipeText, inkSize } from '../text'
import { cover, damp, easeInOut, isMobile, lerp, remap, rng, viewSize } from '../util'
import type { Dict } from '../../i18n'

const BG_Z = -150
const HERO_EXT = 0.65
const TITLE_Z = -24
const BOAT_Z = -9
const WIND_Z = -36

interface Petal {
  mesh: Mesh
  base: { x: number; y: number; z: number }
  speed: number
  sway: number
  spin: number
  phase: number
  size: number
}

export class River implements Stage {
  scene = new Scene()
  camera = new PerspectiveCamera(35, 1, 0.1, 400)

  private hero: Mesh
  private sky: Mesh
  private boat: Mesh
  private petals: Petal[] = []
  private title!: WipeText
  private titleShadow!: WipeText
  private windTitle!: WipeText
  private words: WipeText[] = []
  private wordShadows: WipeText[] = []
  private skyY = 1
  private skyFeather = uniform(0.4)
  private vh = 1
  private ptr = new Vector2()
  private pointerS = new Vector2()
  private intro = 0
  private boatBase = new Vector2()
  private windPos = new Vector2()
  private assets: Assets
  private dict!: Dict

  constructor(assets: Assets) {
    this.assets = assets
    this.scene.background = new Color('#2a1a52')
    const { tex } = assets

    // Dawn backdrop with a quiet shimmer on the water. The plane extends above the painting;
    // that extension continues the painting's top sky as a soft gradient so the tilt-up has room
    // to cross-fade into the morning sky.
    const heroMat = new MeshBasicNodeMaterial()
    const u = uv()
    const imgV = u.y.mul(1 + HERO_EXT)
    const water = smoothstep(0.34, 0.02, imgV)
    const off = sin(imgV.mul(260).add(time.mul(1.4))).mul(0.0016).mul(water)
    const img = texture(tex.hero, vec2(u.x.add(off), imgV.min(0.995))).rgb
    // a soft, horizontally blurred continuation of the painting's top sky
    let top = texture(tex.hero, vec2(0.05, 0.97)).rgb
    for (let i = 1; i < 10; i++) top = top.add(texture(tex.hero, vec2(0.05 + i * 0.1, 0.97)).rgb)
    const avg = top.div(10)
    const near = texture(tex.hero, vec2(u.x, 0.97), 6).rgb // blurry mip of the same row
    const ext = mix(near, avg, smoothstep(1.0, 1.18, imgV))
    heroMat.colorNode = mix(img, ext, smoothstep(0.955, 1.0, imgV))
    this.hero = new Mesh(new PlaneGeometry(1, 1), heroMat)
    this.hero.position.z = BG_Z
    this.scene.add(this.hero)

    // Morning sky above, feathered into the dawn sky so the tilt-up reads as one world.
    const skyMat = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
    skyMat.colorNode = texture(tex.sky)
    skyMat.opacityNode = smoothstep(0.0, this.skyFeather, uv().y)
    this.sky = new Mesh(new PlaneGeometry(1, 1), skyMat)
    this.sky.position.z = BG_Z + 0.5
    this.sky.renderOrder = 1
    this.scene.add(this.sky)

    // Sampan bow in the foreground, in front of the title.
    const boatMat = new MeshBasicNodeMaterial({ map: tex.boat, transparent: true, depthWrite: false })
    this.boat = new Mesh(new PlaneGeometry(1, 1), boatMat)
    this.boat.position.z = BOAT_Z
    this.boat.renderOrder = 30
    this.scene.add(this.boat)

    // Petals: six painted kinds, shared materials.
    const petalMats = [0, 1, 2, 3, 4, 5].map(
      (i) =>
        new MeshBasicNodeMaterial({
          map: tex[`petal${i}`],
          transparent: true,
          depthWrite: false,
          side: DoubleSide,
        }),
    )
    const geo = new PlaneGeometry(1, 1)
    const r = rng(7)
    const petalGroup = new Group()
    for (let i = 0; i < 72; i++) {
      const mesh = new Mesh(geo, petalMats[i % 6])
      mesh.renderOrder = 20
      petalGroup.add(mesh)
      this.petals.push({
        mesh,
        base: { x: r() * 2 - 1, y: r(), z: lerp(-70, -4, Math.pow(r(), 0.7)) },
        speed: lerp(0.5, 1.3, r()),
        sway: lerp(0.4, 1.4, r()),
        spin: lerp(-1.6, 1.6, r()),
        phase: r() * Math.PI * 2,
        size: lerp(0.55, 1.15, r()),
      })
    }
    this.scene.add(petalGroup)
  }

  setLang(d: Dict) {
    this.dict = d
    const { fonts } = this.assets
    const firstBuild = !this.title
    if (firstBuild) {
      this.title = makeTitle(fonts.serif, d.hero.title, { color: '#FFFFFF', em: 1, lineHeight: 54, band: 0.4 })
      this.titleShadow = makeTitle(fonts.serif, d.hero.title, { color: '#2A0F5C', em: 1, lineHeight: 54, band: 0.4 })
      this.titleShadow.uniforms.opacity.value = 0.28
      this.titleShadow.mesh.renderOrder = 9
      this.scene.add(this.titleShadow.mesh)
      this.windTitle = makeTitle(fonts.serif, d.wind.title, { color: '#2A0F5C', em: 1, lineHeight: 54 })
      this.scene.add(this.title.mesh, this.windTitle.mesh)
      d.wind.words.forEach((w, i) => {
        const shadow = makeTitle(fonts.serifItalic, w, { color: '#2A0F5C', em: 1, align: 'center' })
        shadow.uniforms.opacity.value = 0.22
        const word = makeTitle(fonts.serifItalic, w, {
          color: i === 3 ? '#E8A33D' : '#FFFFFF',
          em: 1,
          align: 'center',
        })
        word.uniforms.wipeIn.value = 1
        shadow.uniforms.wipeIn.value = 1
        word.mesh.renderOrder = 25
        shadow.mesh.renderOrder = 24
        this.words.push(word)
        this.wordShadows.push(shadow)
        this.scene.add(shadow.mesh, word.mesh)
      })
    } else {
      this.title.setText(d.hero.title)
      this.titleShadow.setText(d.hero.title)
      this.windTitle.setText(d.wind.title)
      d.wind.words.forEach((w, i) => {
        this.words[i].setText(w)
        this.wordShadows[i].setText(w)
      })
    }
    this.layout()
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.layout()
  }

  private layout() {
    if (!this.title) return
    const cam = this.camera
    const mobile = isMobile()
    const bg = viewSize(cam, -BG_Z)
    const heroSize = cover(aspectOf(this.assets.tex.hero), bg.w, bg.h, 1.1)
    const H = heroSize.h
    this.hero.scale.set(heroSize.w, H * (1 + HERO_EXT), 1)
    this.hero.position.y = (H * HERO_EXT) / 2
    const skyAspect = aspectOf(this.assets.tex.sky)
    const skyW = heroSize.w
    const skyH = Math.max(skyW / skyAspect, bg.h * 1.15)
    this.sky.scale.set(skyW, skyH, 1)
    // sky starts a little above the painting's top edge and is opaque by the end of the extension
    const skyBottom = H / 2 + H * 0.08
    this.sky.position.y = skyBottom + skyH / 2
    this.skyFeather.value = (H * (0.5 + HERO_EXT) - skyBottom) / skyH
    this.skyY = this.sky.position.y - skyH * 0.04

    // Hero title: right column on desktop, upper centre on phones.
    const tv = viewSize(cam, -TITLE_Z)
    this.vh = tv.h
    const ink = inkSize(this.title, 1)
    const targetW = mobile ? tv.w * 0.84 : tv.w * 0.4
    const em = targetW / ink.w
    this.title.mesh.scale.setScalar(em)
    const sx = mobile ? 0.5 : 0.71
    const sy = mobile ? 0.25 : 0.33
    this.title.mesh.position.set((sx - 0.5) * tv.w, (0.5 - sy) * tv.h, TITLE_Z)
    this.titleShadow.mesh.scale.setScalar(em)
    this.titleShadow.mesh.position.set((sx - 0.5) * tv.w + em * 0.025, (0.5 - sy) * tv.h - em * 0.035, TITLE_Z - 0.05)
    // Tell the HTML layer where the title ends (screen px from top).
    const bottomFrac = sy + (ink.h * em) / 2 / tv.h
    document.documentElement.style.setProperty('--hero-title-bottom', `${(bottomFrac * 100).toFixed(2)}vh`)
    document.documentElement.style.setProperty('--hero-title-left', `${((sx - (ink.w * em) / 2 / tv.w) * 100).toFixed(2)}vw`)
    document.documentElement.style.setProperty('--hero-title-width', `${(((ink.w * em) / tv.w) * 100).toFixed(2)}vw`)

    // Boat
    const bv = viewSize(cam, -BOAT_Z)
    const bw = mobile ? bv.w * 1.0 : bv.w * 0.4
    const bh = bw / aspectOf(this.assets.tex.boat)
    this.boat.scale.set(bw, bh, 1)
    this.boatBase.set(-bv.w / 2 + bw * (mobile ? 0.4 : 0.3), -bv.h / 2 + bh * (mobile ? 0.28 : 0.3))

    // Wind title sits in the sky, left on desktop.
    const wv = viewSize(cam, -WIND_Z)
    const wink = inkSize(this.windTitle, 1)
    const wem = (mobile ? wv.w * 0.8 : wv.w * 0.36) / wink.w
    this.windTitle.mesh.scale.setScalar(wem)
    const wsx = mobile ? 0.5 : 0.3
    const wsy = mobile ? 0.24 : 0.4
    this.windPos.set((wsx - 0.5) * wv.w, (0.5 - wsy) * wv.h)
    const wbottom = wsy + (wink.h * wem) / 2 / wv.h
    document.documentElement.style.setProperty('--wind-title-bottom', `${(wbottom * 100).toFixed(2)}vh`)

    // Service words
    this.words.forEach((w, i) => {
      const s = (mobile ? 1.6 : 2.6) * (i === 3 ? 1.4 : 1)
      w.mesh.scale.setScalar(s)
      this.wordShadows[i].mesh.scale.setScalar(s)
    })
  }

  phase(t: number) {
    if (t < 0.28) return 'hero'
    if (t < 0.5) return 'ascend'
    if (t < 0.72) return 'wind'
    return 'words'
  }

  pointer(ndc: Vector2, kind: 'move' | 'down' | 'leave') {
    if (kind === 'leave') this.ptr.set(0, 0)
    else this.ptr.copy(ndc)
  }

  update({ t, dt, time: now, reduced }: FrameInfo) {
    if (!this.title) return
    const cam = this.camera
    this.intro = Math.min(1, this.intro + dt * 0.55)

    const ascend = easeInOut(remap(t, 0.24, 0.54))
    const flow = remap(t, 0.7, 1)

    this.pointerS.x = damp(this.pointerS.x, this.ptr.x, 3, dt)
    this.pointerS.y = damp(this.pointerS.y, this.ptr.y, 3, dt)
    const px = reduced ? 0 : this.pointerS.x
    const py = reduced ? 0 : this.pointerS.y

    cam.position.set(px * 0.9, lerp(0, this.skyY, ascend) + py * 0.5, 0)
    cam.rotation.set(py * 0.012 + ascend * 0.02, -px * 0.02, 0)

    // Hero title: wipe in on load, wipe out as we rise.
    const titleIn = reduced ? 1 : easeInOut(Math.min(1, Math.max(0, this.intro * 1.3 - 0.25)))
    this.title.uniforms.wipeIn.value = titleIn
    this.title.uniforms.wipeOut.value = remap(t, 0.2, 0.34)
    this.titleShadow.uniforms.wipeIn.value = titleIn
    this.titleShadow.uniforms.wipeOut.value = this.title.uniforms.wipeOut.value

    // Boat bobs gently; slides down as we rise.
    const bob = reduced ? 0 : Math.sin(now * 0.9) * 0.04
    // The boat lives in hero world space, so it scrolls away (fast, it's close) as we rise.
    this.boat.position.set(this.boatBase.x + px * 0.25, this.boatBase.y + bob, BOAT_Z)
    this.boat.rotation.z = reduced ? 0 : Math.sin(now * 0.7) * 0.012

    // Wind title appears once we're in the sky, then makes room for the words.
    const wd = this.windPos
    this.windTitle.mesh.position.set(wd.x, this.skyY + wd.y, WIND_Z)
    this.windTitle.uniforms.wipeIn.value = reduced ? (t > 0.5 ? 1 : 0) : easeInOut(remap(t, 0.46, 0.58))
    this.windTitle.uniforms.wipeOut.value = remap(t, 0.7, 0.8)

    // Service words fly past the camera through the petals.
    const mobile = isMobile()
    const lanes = mobile
      ? [
          [-1.4, 1.6],
          [1.3, -1.2],
          [-1.1, -2.6],
          [0.4, 0.4],
        ]
      : [
          [-4.2, 1.8],
          [4.6, -1.4],
          [-3.4, -2.6],
          [1.6, 0.6],
        ]
    this.words.forEach((w, i) => {
      const k = Math.max(0, Math.min(1, flow * 1.55 - i * 0.18))
      const z = lerp(-80, 4, easeInOut(k))
      const [lx, ly] = lanes[i]
      w.mesh.position.set(lx, this.skyY + ly, z)
      this.wordShadows[i].mesh.position.set(lx + 0.06, this.skyY + ly - 0.1, z - 0.05)
      const fadeIn = remap(z, -80, -55)
      const fadeOut = 1 - remap(z, -9, -2)
      const o = k <= 0 ? 0 : fadeIn * fadeOut
      w.uniforms.opacity.value = o
      this.wordShadows[i].uniforms.opacity.value = o * 0.22
      w.mesh.visible = this.wordShadows[i].mesh.visible = o > 0.001
    })

    // Petals drift down and sideways; during the flow they rush toward the camera.
    const spanY = this.skyY + this.vh * 2.4
    const rush = flow * 46
    for (const p of this.petals) {
      const fall = reduced ? 0 : now * p.speed * 0.9
      const y = ((p.base.y * spanY - fall) % spanY + spanY) % spanY - this.vh * 1.0
      let z = p.base.z + rush
      if (z > -2) z = -70 + ((z + 70) % 68)
      const spread = viewSize(cam, -z).w * 0.62
      const sway = reduced ? 0 : Math.sin(now * p.sway + p.phase) * 1.2
      p.mesh.position.set(p.base.x * spread + sway, y, z)
      p.mesh.rotation.z = p.phase + (reduced ? 0 : now * p.spin)
      const flip = reduced ? 1 : Math.cos(now * p.sway * 1.3 + p.phase)
      p.mesh.scale.set(p.size * flip * 1.1, p.size * 1.1, 1)
      p.mesh.rotation.x = reduced ? 0 : Math.sin(now * 0.8 + p.phase) * 0.6
    }
  }

  getDict() {
    return this.dict
  }
}
