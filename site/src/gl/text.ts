import { createText, wipe, scramble, composeEffects } from 'lettra/three'
import type { TextHandle } from 'lettra/three'
import type { FontAsset } from './assets'

export type WipeText = TextHandle<ReturnType<typeof wipe>>

export interface TitleOptions {
  color: string
  align?: 'left' | 'center' | 'right'
  /** World height of one em. */
  em: number
  lineHeight?: number
  letterSpacing?: number
  maxWidth?: number
  band?: number
  anchor?: 'ink-center' | 'baseline-left'
  /** wipe coordinate: across ink width (default) or line by line. */
  byLine?: boolean
}

/**
 * A Lettra title with a wipe effect. Text shares the font's atlas, so it never
 * owns (or disposes) the map.
 */
export function makeTitle(fa: FontAsset, text: string, o: TitleOptions): WipeText {
  const effect = wipe({ band: o.band ?? 0.35 })
  const handle = createText({
    font: fa.font,
    map: fa.map,
    text,
    layout: {
      align: o.align ?? 'left',
      lineHeight: o.lineHeight,
      letterSpacing: o.letterSpacing,
      maxWidth: o.maxWidth,
    },
    geometry: { anchor: o.anchor ?? 'ink-center' },
    material: { fill: o.color, effect },
  })
  handle.mesh.scale.setScalar(o.em)
  handle.uniforms.wipeIn.value = 0
  handle.uniforms.wipeOut.value = 0
  handle.mesh.renderOrder = 10
  return handle
}

/** Scramble + wipe: used for the AI reply that "decodes" on the pond. */
export function makeScrambleText(fa: FontAsset, text: string, o: TitleOptions) {
  const sc = scramble({
    font: fa.font,
    chars: 'abcdeghiklmnopqrstuvxyáàảãạâấầêếềôốồơớờưứừđ',
    rate: 18,
  })
  const wp = wipe({ band: o.band ?? 0.25 })
  const handle = createText({
    font: fa.font,
    map: fa.map,
    text,
    layout: { align: o.align ?? 'left', lineHeight: o.lineHeight, maxWidth: o.maxWidth },
    geometry: { anchor: o.anchor ?? 'baseline-left' },
    material: { fill: o.color, effect: composeEffects(sc, wp) },
  })
  handle.mesh.scale.setScalar(o.em)
  handle.mesh.renderOrder = 10
  return { handle, scrambleFx: sc }
}

/** Ink width/height in world units for a text whose mesh scale is `em`. */
export function inkSize(h: { layout: { width: number; height: number; metrics: { fontSize: number } } }, em: number) {
  const fs = h.layout.metrics.fontSize || 64
  return { w: (h.layout.width / fs) * em, h: (h.layout.height / fs) * em }
}
