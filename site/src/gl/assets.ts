import { SRGBColorSpace, Texture, TextureLoader, LinearMipmapLinearFilter } from 'three/webgpu'
import { loadFont, loadFontTexture } from 'lettra/three'
import type { MSDFFont } from 'lettra'

export interface FontAsset {
  font: MSDFFont
  map: Texture
}

export interface Assets {
  tex: Record<string, Texture>
  fonts: {
    serif: FontAsset
    serifBold: FontAsset
    serifItalic: FontAsset
    sans: FontAsset
  }
}

const small = typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) < 700

const IMAGES: Record<string, string> = {
  hero: small ? '/img/hero_dawn-sm.webp' : '/img/hero_dawn.webp',
  sky: small ? '/img/sky_morning-sm.webp' : '/img/sky_morning.webp',
  pond: small ? '/img/pond-sm.webp' : '/img/pond.webp',
  cafe: small ? '/img/cafe_desk-sm.webp' : '/img/cafe_desk.webp',
  night: small ? '/img/lantern_night-sm.webp' : '/img/lantern_night.webp',
  boat: '/img/boat.webp',
  paper: '/img/paper.webp',
  lantern: '/img/lantern.webp',
  koi0: '/img/koi0.webp',
  koi1: '/img/koi1.webp',
  koi2: '/img/koi2.webp',
  koi3: '/img/koi3.webp',
  petal0: '/img/petal0.webp',
  petal1: '/img/petal1.webp',
  petal2: '/img/petal2.webp',
  petal3: '/img/petal3.webp',
  petal4: '/img/petal4.webp',
  petal5: '/img/petal5.webp',
}

const FONTS = {
  serif: 'fraunces-400',
  serifBold: 'fraunces-600',
  serifItalic: 'fraunces-italic-400',
  sans: 'bvp-500',
} as const

export async function loadAssets(onProgress: (p: number) => void): Promise<Assets> {
  const loader = new TextureLoader()
  const total = Object.keys(IMAGES).length + Object.keys(FONTS).length
  let done = 0
  const tick = () => onProgress(++done / total)

  const tex: Record<string, Texture> = {}
  const imageJobs = Object.entries(IMAGES).map(async ([key, url]) => {
    const t = await loader.loadAsync(url)
    t.colorSpace = SRGBColorSpace
    t.minFilter = LinearMipmapLinearFilter
    t.generateMipmaps = true
    t.anisotropy = 4
    tex[key] = t
    tick()
  })

  const fontEntries = await Promise.all(
    (Object.entries(FONTS) as [keyof typeof FONTS, string][]).map(async ([key, base]) => {
      const [font, map] = await Promise.all([
        loadFont(`/fonts/${base}.json`),
        loadFontTexture(`/fonts/${base}.png`),
      ])
      tick()
      return [key, { font, map }] as const
    }),
  )
  await Promise.all(imageJobs)

  return { tex, fonts: Object.fromEntries(fontEntries) as Assets['fonts'] }
}

/** Natural aspect (w/h) of a loaded texture. */
export function aspectOf(t: Texture): number {
  const img = t.image as { width: number; height: number }
  return img.width / img.height
}
