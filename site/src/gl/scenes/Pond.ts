import {
  Color,
  Mesh,
  MeshBasicNodeMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector2,
  Vector4,
} from 'three/webgpu'
import {
  abs,
  exp,
  float,
  length,
  mix,
  positionLocal,
  sin,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  color as tslColor,
  pow,
} from 'three/tsl'
import type { Assets } from '../assets'
import { aspectOf } from '../assets'
import type { FrameInfo, Stage } from '../stage'
import { inkSize, makeScrambleText, makeTitle, type WipeText } from '../text'
import { clamp01, cover, damp, easeInOut, easeOut, isMobile, lerp, remap, rng, viewSize } from '../util'
import type { Dict } from '../../i18n'

const POND_Z = -20
const RIPPLES = 8

interface Koi {
  mesh: Mesh
  shadow: Mesh
  pos: Vector2
  heading: number
  speed: number
  wander: number
  phase: { value: number }
  beat: { value: number }
  len: number
}

export class Pond implements Stage {
  scene = new Scene()
  camera = new PerspectiveCamera(35, 1, 0.1, 200)

  private pond: Mesh
  private aspectU = uniform(16 / 9)
  private nowU = uniform(0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private ripples: any[] = []
  private nextRipple = 0
  private koi: Koi[] = []
  private pw = 1
  private ph = 1
  private title!: WipeText
  private question!: WipeText
  private answer!: ReturnType<typeof makeScrambleText>
  private askedAt = -100
  private asked = -1
  private attract = new Vector2()
  private attractUntil = -1
  private pointerW = new Vector2()
  private pointerActive = false
  private lastMoveRipple = 0
  private assets: Assets
  private dict!: Dict
  private now = 0
  private answerAnchor = new Vector2()
  private ambientTimer = 0

  constructor(assets: Assets) {
    this.assets = assets
    this.scene.background = new Color('#0d3b33')
    const { tex } = assets

    for (let i = 0; i < RIPPLES; i++) this.ripples.push(uniform(new Vector4(0, 0, -100, 0)))

    // Water: painted pond + ring ripples that bend the image and catch light.
    const mat = new MeshBasicNodeMaterial()
    const u = uv()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let disp: any = vec2(0, 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let shine: any = float(0)
    for (const r of this.ripples) {
      const d = vec2(u.x.sub(r.x).mul(this.aspectU), u.y.sub(r.y))
      const dist = length(d)
      const age = this.nowU.sub(r.z).max(0)
      const front = age.mul(0.16)
      const env = exp(abs(dist.sub(front)).mul(-26)).mul(exp(age.mul(-0.75))).mul(r.w)
      const wave = sin(dist.mul(110).sub(age.mul(10))).mul(env)
      disp = disp.add(d.div(dist.add(0.0005)).mul(wave).mul(0.0075))
      shine = shine.add(wave.max(0).mul(0.16))
    }
    const amb = vec2(sin(u.y.mul(38).add(this.nowU.mul(0.9))), sin(u.x.mul(31).add(this.nowU.mul(0.7)))).mul(0.0012)
    const base = texture(tex.pond, u.add(disp).add(amb))
    mat.colorNode = base.rgb.add(vec3(0.75, 0.95, 0.85).mul(shine))
    this.pond = new Mesh(new PlaneGeometry(1, 1), mat)
    this.pond.position.z = POND_Z
    this.scene.add(this.pond)

    // Koi: painted sprites whose tails swish in the vertex stage.
    const r = rng(11)
    const geo = new PlaneGeometry(1, 1, 1, 12)
    const water = tslColor('#1d5f52')
    for (let i = 0; i < 7; i++) {
      const map = tex[`koi${i % 4}`]
      const phase = uniform(r() * 10)
      const beat = uniform(6)
      const ty = uv().y // 1 = head, 0 = tail
      const bend = pow(float(1).sub(ty), 1.6)
      const swish = sin(phase.add(ty.mul(4.2))).mul(0.16).mul(bend)
      const m = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
      const t = texture(map)
      m.colorNode = mix(t.rgb, water, 0.22)
      m.opacityNode = t.a.mul(0.92)
      m.positionNode = positionLocal.add(vec3(swish, 0, 0))
      const mesh = new Mesh(geo, m)
      mesh.renderOrder = 5

      const sm = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
      sm.colorNode = vec3(0.02, 0.12, 0.1)
      sm.opacityNode = t.a.mul(0.28)
      sm.positionNode = positionLocal.add(vec3(swish, 0, 0))
      const shadow = new Mesh(geo, sm)
      shadow.renderOrder = 4

      this.scene.add(shadow, mesh)
      this.koi.push({
        mesh,
        shadow,
        pos: new Vector2(lerp(-0.3, 0.3, r()), lerp(-0.3, 0.3, r())),
        heading: r() * Math.PI * 2,
        speed: lerp(0.8, 1.2, r()),
        wander: r() * 100,
        phase,
        beat,
        len: lerp(0.85, 1.15, r()),
      })
    }
  }

  setLang(d: Dict) {
    this.dict = d
    const { fonts } = this.assets
    if (!this.title) {
      this.title = makeTitle(fonts.serifBold, d.pond.title, { color: '#F3FBF4', em: 1 })
      this.question = makeTitle(fonts.sans, ' ', { color: '#CDEBDD', em: 1, anchor: 'baseline-left', band: 0.2 })
      this.answer = makeScrambleText(fonts.serifItalic, ' ', { color: '#FFF6E2', em: 1, lineHeight: 57, maxWidth: 620 })
      this.scene.add(this.title.mesh, this.question.mesh, this.answer.handle.mesh)
    } else {
      this.title.setText(d.pond.title)
      if (this.asked >= 0) this.ask(this.asked, true)
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
    const v = viewSize(this.camera, -POND_Z)
    const c = cover(aspectOf(this.assets.tex.pond), v.w, v.h, 1.12)
    this.pond.scale.set(c.w, c.h, 1)
    this.pw = c.w
    this.ph = c.h
    this.aspectU.value = c.w / c.h
    const mobile = isMobile()

    const ink = inkSize(this.title, 1)
    const em = (mobile ? v.w * 0.82 : v.w * 0.36) / ink.w
    this.title.mesh.scale.setScalar(em)
    const sx = mobile ? 0.5 : 0.3
    const sy = mobile ? 0.16 : 0.36
    this.title.mesh.position.set((sx - 0.5) * v.w, (0.5 - sy) * v.h, POND_Z + 0.5)
    const bottom = sy + (ink.h * em) / 2 / v.h
    document.documentElement.style.setProperty('--pond-title-bottom', `${(bottom * 100).toFixed(2)}vh`)

    // Conversation column
    const qEm = mobile ? v.h * 0.026 : v.h * 0.03
    const aEm = mobile ? v.h * 0.044 : v.h * 0.055
    this.question.mesh.scale.setScalar(qEm)
    this.answer.handle.mesh.scale.setScalar(aEm)
    const ax = mobile ? 0.08 : 0.56
    const ay = mobile ? 0.3 : 0.36
    this.question.mesh.position.set((ax - 0.5) * v.w, (0.5 - ay) * v.h, POND_Z + 0.6)
    this.answer.handle.mesh.position.set((ax - 0.5) * v.w, (0.5 - ay) * v.h - qEm * 2.2, POND_Z + 0.6)
    // wrap width in baked px so the answer fits the column
    const colW = mobile ? v.w * 0.84 : v.w * 0.36
    this.answerWrap = (colW / aEm) * 48
    this.answerAnchor.set((ax - 0.5) * v.w + colW * 0.4, (0.5 - ay) * v.h - qEm * 4)

    const koiLen = (mobile ? 0.13 : 0.16) * v.h
    for (const k of this.koi) {
      const a = aspectOf(k.mesh.material instanceof MeshBasicNodeMaterial ? this.assets.tex.koi0 : this.assets.tex.koi0)
      k.mesh.scale.set(koiLen * k.len * a, koiLen * k.len, 1)
      k.shadow.scale.copy(k.mesh.scale)
    }
  }
  private answerWrap = 800

  phase(t: number) {
    return t < 0.12 ? 'enter' : 'pond'
  }

  /** Customer asks the sample shop question i. */
  ask(i: number, silent = false) {
    const qa = this.dict.pond.qa[i]
    if (!qa) return
    this.asked = i
    this.question.setText(`${this.dict.pond.customer}: ${qa.q}`)
    this.answer.handle.setText(qa.a, { maxWidth: this.answerWrap, lineHeight: 57 })
    if (silent) return
    this.askedAt = this.now
    this.attract.copy(this.answerAnchor)
    this.attractUntil = this.now + 3.5
    this.ripple(this.toUv(this.answerAnchor), 1.2)
  }

  private toUv(world: Vector2) {
    return new Vector2(world.x / this.pw + 0.5, world.y / this.ph + 0.5)
  }

  private ripple(uvp: Vector2, amp = 1) {
    const r = this.ripples[this.nextRipple++ % RIPPLES]
    r.value.set(uvp.x, uvp.y, this.now, amp)
  }

  pointer(ndc: Vector2, kind: 'move' | 'down' | 'leave') {
    const v = viewSize(this.camera, -POND_Z - this.camera.position.z * -1)
    if (kind === 'leave') {
      this.pointerActive = false
      return
    }
    this.pointerW.set((ndc.x * v.w) / 2 + this.camera.position.x, (ndc.y * v.h) / 2 + this.camera.position.y)
    this.pointerActive = true
    if (kind === 'down') this.ripple(this.toUv(this.pointerW), 1.1)
    else if (this.now - this.lastMoveRipple > 0.45) {
      this.lastMoveRipple = this.now
      this.ripple(this.toUv(this.pointerW), 0.35)
    }
  }

  update({ t, dt, time, reduced }: FrameInfo) {
    if (!this.title) return
    this.now = time
    this.nowU.value = time
    const cam = this.camera
    cam.position.set(Math.sin(time * 0.1) * 0.15, Math.cos(time * 0.13) * 0.1, lerp(1.5, -1.5, t))

    const enter = easeInOut(remap(t, 0.04, 0.22))
    this.title.uniforms.wipeIn.value = reduced ? 1 : enter
    this.title.uniforms.wipeOut.value = remap(t, 0.9, 1)

    // Conversation reveal: question wipes in, answer decodes (scramble → text).
    const since = time - this.askedAt
    const qIn = this.asked < 0 ? 0 : reduced ? 1 : easeOut(clamp01(since / 0.5))
    this.question.uniforms.wipeIn.value = qIn
    const aU = this.answer.handle.uniforms as unknown as Record<string, { value: number }>
    aU.wipeIn.value = this.asked < 0 ? 0 : reduced ? 1 : easeOut(clamp01((since - 0.35) / 0.7))
    aU.scramble.value = reduced ? 0 : 1 - easeInOut(clamp01((since - 0.5) / 1.4))
    const out = remap(t, 0.9, 1)
    this.question.uniforms.wipeOut.value = out
    aU.wipeOut.value = out

    // Ambient ripples (a drop now and then).
    if (!reduced) {
      this.ambientTimer -= dt
      if (this.ambientTimer <= 0) {
        this.ambientTimer = lerp(1.6, 3.2, Math.random())
        this.ripple(new Vector2(lerp(0.15, 0.85, Math.random()), lerp(0.15, 0.85, Math.random())), 0.5)
      }
    }

    // Koi
    const v = viewSize(cam, -POND_Z)
    const rx = v.w * 0.36
    const ry = v.h * 0.34
    const baseSpeed = v.h * 0.07
    for (const k of this.koi) {
      if (reduced) {
        k.phase.value = 0
      } else {
        k.wander += dt * 0.4
        let target: Vector2 | null = null
        if (time < this.attractUntil) target = this.attract
        else if (this.pointerActive) target = this.pointerW
        let desired = k.heading + Math.sin(k.wander * 1.7) * 0.9 * dt
        let speed = baseSpeed * k.speed
        if (target) {
          const dx = target.x - k.pos.x
          const dy = target.y - k.pos.y
          const dist = Math.hypot(dx, dy)
          if (dist > v.h * 0.08) {
            desired = Math.atan2(dy, dx)
            speed *= 1.7
          }
        }
        // soft bounds: steer back toward the centre ellipse
        const ex = k.pos.x / rx
        const ey = k.pos.y / ry
        if (ex * ex + ey * ey > 1) desired = Math.atan2(-k.pos.y, -k.pos.x)
        let diff = desired - k.heading
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        k.heading += Math.max(-1, Math.min(1, diff)) * dt * 1.8
        k.pos.x += Math.cos(k.heading) * speed * dt
        k.pos.y += Math.sin(k.heading) * speed * dt
        k.phase.value += dt * (4 + speed / baseSpeed * 3)
      }
      k.mesh.position.set(k.pos.x, k.pos.y, POND_Z + 0.2)
      k.mesh.rotation.z = k.heading - Math.PI / 2
      k.shadow.position.set(k.pos.x + v.h * 0.012, k.pos.y - v.h * 0.018, POND_Z + 0.1)
      k.shadow.rotation.z = k.mesh.rotation.z
      const fade = enter
      ;(k.mesh.material as MeshBasicNodeMaterial).opacity = fade
    }
    void damp
  }
}
