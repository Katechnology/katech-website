import Lenis from 'lenis'
import { ui } from './store'

let lenis: Lenis | null = null

export function startScroll() {
  if (lenis || ui.get().reducedMotion) return
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, autoRaf: true })
}

export function scrollToChapter(id: string, offsetVh = 0) {
  const el = document.querySelector<HTMLElement>(`[data-chapter="${id}"]`)
  if (!el) return
  const y = el.offsetTop + offsetVh * window.innerHeight
  if (lenis) lenis.scrollTo(y, { duration: 2.2 })
  else window.scrollTo({ top: y, behavior: ui.get().reducedMotion ? 'auto' : 'smooth' })
}

export function lockScroll(lock: boolean) {
  if (!lenis) {
    document.documentElement.style.overflow = lock ? 'hidden' : ''
    return
  }
  if (lock) lenis.stop()
  else lenis.start()
}
