import { MathUtils, PerspectiveCamera } from 'three/webgpu'

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
/** Maps x from [a,b] to [0,1], clamped. */
export const remap = (x: number, a: number, b: number) => clamp01((x - a) / (b - a))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const smooth = (t: number) => t * t * (3 - 2 * t)
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeIn = (t: number) => t * t * t
/** Frame-rate independent exponential smoothing. */
export const damp = (a: number, b: number, lambda: number, dt: number) =>
  lerp(a, b, 1 - Math.exp(-lambda * dt))

/** Visible width/height of the frustum at a given distance in front of the camera. */
export function viewSize(cam: PerspectiveCamera, distance: number) {
  const h = 2 * distance * Math.tan(MathUtils.degToRad(cam.fov) / 2)
  return { w: h * cam.aspect, h }
}

/** Scale (w,h) of a plane with image aspect `imgAspect` that covers a view of (vw,vh). */
export function cover(imgAspect: number, vw: number, vh: number, margin = 1) {
  const viewAspect = vw / vh
  if (viewAspect > imgAspect) return { w: vw * margin, h: (vw / imgAspect) * margin }
  return { w: vh * imgAspect * margin, h: vh * margin }
}

/** Deterministic pseudo-random for stable layouts. */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768
