import {
  MeshBasicNodeMaterial,
  QuadMesh,
  RenderTarget,
  Vector2,
  WebGPURenderer,
  NoToneMapping,
} from 'three/webgpu'
import { float, mix, mx_noise_float, smoothstep, texture, uniform, uv, vec2, vec3, color as tslColor } from 'three/tsl'
import { loadAssets } from './assets'
import type { Stage } from './stage'
import { River } from './scenes/River'
import { Pond } from './scenes/Pond'
import { Cafe } from './scenes/Cafe'
import { Night } from './scenes/Night'
import { live, ui, type ChapterId } from '../store'
import { DICT } from '../i18n'

const ORDER = ['river', 'pond', 'cafe', 'night'] as const
type StageId = (typeof ORDER)[number]

interface Span {
  id: StageId
  top: number
  end: number
}

class EngineImpl {
  renderer!: WebGPURenderer
  stages!: Record<StageId, Stage>
  private river!: River
  private pond!: Pond
  private cafe!: Cafe
  private night!: Night
  private rtA!: RenderTarget
  private rtB!: RenderTarget
  private quad!: QuadMesh
  private mixU = uniform(0)
  private aspectU = uniform(1)
  private crossfadeU = uniform(0)
  private spans: Span[] = []
  private footerTop = Infinity
  private last = performance.now()
  private ndc = new Vector2()
  private started = false
  private width = 1
  private height = 1
  private activeStage: StageId = 'river'
  private canvas!: HTMLCanvasElement

  async init(canvas: HTMLCanvasElement) {
    if (this.started) return
    this.started = true
    this.canvas = canvas
    try {
      this.renderer = new WebGPURenderer({ canvas, antialias: true, alpha: false })
      await this.renderer.init()
    } catch (e) {
      console.error(e)
      ui.set({ glFailed: true, ready: true })
      return
    }
    const r = this.renderer
    r.toneMapping = NoToneMapping
    r.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))

    const assets = await loadAssets((p) => ui.set({ loaded: p * 0.9 }))
    this.river = new River(assets)
    this.pond = new Pond(assets)
    this.cafe = new Cafe(assets)
    this.night = new Night(assets)
    this.stages = { river: this.river, pond: this.pond, cafe: this.cafe, night: this.night }

    // Canvas fonts for the device screens.
    await document.fonts?.ready

    const d = DICT[ui.get().lang]
    for (const s of Object.values(this.stages)) s.setLang(d)

    this.rtA = new RenderTarget(1, 1, { samples: 4 })
    this.rtB = new RenderTarget(1, 1, { samples: 4 })
    const mat = new MeshBasicNodeMaterial()
    const u = uv()
    const centered = u.sub(0.5)
    const m = this.mixU
    const uvA = centered.mul(float(1).sub(m.mul(0.06))).add(0.5)
    const uvB = centered.div(float(1).add(float(1).sub(m).mul(0.08))).add(0.5)
    const a = texture(this.rtA.texture, uvA)
    const b = texture(this.rtB.texture, uvB)
    // painterly dissolve: low-frequency noise front with a warm rim
    const n = mx_noise_float(vec3(u.x.mul(this.aspectU).mul(2.2), u.y.mul(2.2), m.mul(0.6)))
      .mul(0.5)
      .add(0.5)
      .add(mx_noise_float(vec3(u.x.mul(this.aspectU).mul(9), u.y.mul(9), float(3))).mul(0.08))
    const w = float(0.16)
    const front = m.mul(float(1).add(w.mul(2))).sub(w)
    const k = smoothstep(n.sub(w), n.add(w), front)
    const kk = mix(k, m, this.crossfadeU)
    const rim = kk.mul(float(1).sub(kk)).mul(4).mul(float(1).sub(this.crossfadeU))
    mat.colorNode = mix(a.rgb, b.rgb, kk).add(tslColor('#E8A33D').mul(rim).mul(0.28))
    this.quad = new QuadMesh(mat)
    void vec2

    this.resize()
    window.addEventListener('resize', () => this.resize())
    window.addEventListener('pointermove', (e) => this.onPointer(e, 'move'), { passive: true })
    window.addEventListener('pointerdown', (e) => this.onPointer(e, 'down'), { passive: true })
    document.addEventListener('pointerleave', (e) => this.onPointer(e as PointerEvent, 'leave'))

    // Compile pipelines before the reveal.
    for (const s of Object.values(this.stages)) {
      try {
        await r.compileAsync(s.scene, s.camera)
      } catch {
        /* compiled lazily on first frame */
      }
    }
    ui.set({ loaded: 1 })
    r.setAnimationLoop(() => this.frame())
    ui.subscribe(() => this.onUi())
    setTimeout(() => ui.set({ ready: true }), 250)
  }

  private lastLang = ui.get().lang
  private onUi() {
    const s = ui.get()
    if (s.lang !== this.lastLang && this.stages) {
      this.lastLang = s.lang
      const d = DICT[s.lang]
      for (const st of Object.values(this.stages)) st.setLang(d)
    }
  }

  measure() {
    this.spans = []
    const vh = window.innerHeight
    for (const id of ORDER) {
      const el = document.querySelector<HTMLElement>(`[data-chapter="${id}"]`)
      if (!el) continue
      const top = el.offsetTop
      this.spans.push({ id, top, end: top + el.offsetHeight - vh })
    }
    const footer = document.querySelector<HTMLElement>('[data-chapter="footer"]')
    this.footerTop = footer ? footer.offsetTop : Infinity
  }

  private resize() {
    if (!this.renderer) return
    const w = window.innerWidth
    const h = window.innerHeight
    this.width = w
    this.height = h
    this.renderer.setSize(w, h, false)
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    const pr = this.renderer.getPixelRatio()
    this.rtA.setSize(Math.round(w * pr), Math.round(h * pr))
    this.rtB.setSize(Math.round(w * pr), Math.round(h * pr))
    this.aspectU.value = w / h
    for (const s of Object.values(this.stages)) s.resize(w, h)
    this.measure()
  }

  private onPointer(e: PointerEvent, kind: 'move' | 'down' | 'leave') {
    if (!this.stages) return
    const target = e.target as HTMLElement | null
    if (kind === 'down' && target?.closest('button, a, input, textarea, [data-ui]')) return
    this.ndc.set((e.clientX / this.width) * 2 - 1, -(e.clientY / this.height) * 2 + 1)
    this.stages[this.activeStage].pointer?.(this.ndc, kind)
  }

  /** Where we are: one stage, or a hand-off between two. */
  private locate(y: number) {
    const vh = this.height
    for (let i = 0; i < this.spans.length; i++) {
      const s = this.spans[i]
      const local = Math.min(1, Math.max(0, (y - s.top) / Math.max(1, s.end - s.top)))
      live.local[s.id as ChapterId] = local
      if (y <= s.end) return { a: s.id, ta: local, b: null as StageId | null, u: 0 }
      const next = this.spans[i + 1]
      if (next && y < next.top) {
        const u = (y - s.end) / vh
        return { a: s.id, ta: 1, b: next.id, u }
      }
    }
    const lastSpan = this.spans[this.spans.length - 1]
    return { a: lastSpan?.id ?? 'river', ta: 1, b: null, u: 0 }
  }

  private frame() {
    const now = performance.now()
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    const time = now / 1000
    const reduced = ui.get().reducedMotion
    const y = window.scrollY
    const docH = document.documentElement.scrollHeight - this.height
    live.progress = docH > 0 ? y / docH : 0

    if (!this.spans.length) this.measure()
    const loc = this.locate(y)
    const dominant: StageId = loc.b && loc.u > 0.5 ? loc.b : loc.a
    this.activeStage = dominant
    const inFooter = y + this.height * 0.5 > this.footerTop
    const st = this.stages[dominant]
    const tDom = dominant === loc.a ? loc.ta : 0
    ui.set({
      chapter: inFooter ? 'footer' : (dominant as ChapterId),
      phase: inFooter ? 'footer' : loc.b && dominant === loc.b ? 'enter' : st.phase(tDom),
    })
    live.emit()

    if (y >= this.footerTop) return // footer fully covers the canvas

    const r = this.renderer
    this.cafe.setVisible(loc.a === 'cafe' || loc.b === 'cafe')
    const sa = this.stages[loc.a]
    sa.update({ t: loc.ta, dt, time, reduced })
    sa.prerender?.(r)
    if (!loc.b) {
      r.setRenderTarget(null)
      r.render(sa.scene, sa.camera)
      return
    }
    const sb = this.stages[loc.b]
    sb.update({ t: 0, dt, time, reduced })
    sb.prerender?.(r)
    r.setRenderTarget(this.rtA)
    r.render(sa.scene, sa.camera)
    r.setRenderTarget(this.rtB)
    r.render(sb.scene, sb.camera)
    r.setRenderTarget(null)
    this.mixU.value = loc.u
    this.crossfadeU.value = reduced ? 1 : 0
    this.quad.render(r)
  }

  // ---- actions from the UI ----
  ask(i: number) {
    this.pond?.ask(i)
  }
  setShopName(name: string) {
    this.cafe?.setShopName(name)
  }
  release(message: string) {
    this.night?.release(message)
  }
}

export const engine = new EngineImpl()
