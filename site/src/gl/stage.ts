import type { PerspectiveCamera, Scene, Vector2, WebGPURenderer } from 'three/webgpu'
import type { Dict } from '../i18n'

export interface FrameInfo {
  /** Local chapter progress 0..1 */
  t: number
  dt: number
  time: number
  reduced: boolean
}

export interface Stage {
  scene: Scene
  camera: PerspectiveCamera
  resize(w: number, h: number): void
  update(f: FrameInfo): void
  /** Called once per frame before the stage is rendered (sub render targets). */
  prerender?(renderer: WebGPURenderer): void
  pointer?(ndc: Vector2, kind: 'move' | 'down' | 'leave'): void
  setLang(d: Dict): void
  /** Discrete phase for the UI layer. */
  phase(t: number): string
}
