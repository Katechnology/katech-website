import { useSyncExternalStore } from 'react'
import type { Lang, ServiceKey } from './i18n'

export type ChapterId = 'river' | 'pond' | 'cafe' | 'night' | 'footer'

export interface UIState {
  lang: Lang
  /** Asset loading progress 0..1 */
  loaded: number
  ready: boolean
  /** Which chapter is dominant on screen. */
  chapter: ChapterId
  /** Sub-phase inside the chapter (scene-specific, discrete). */
  phase: string
  panel: ServiceKey | 'process' | null
  shopName: string
  pondAnswer: number | null
  reducedMotion: boolean
  glFailed: boolean
}

type Listener = () => void

function createStore<T extends object>(initial: T) {
  let state = initial
  const listeners = new Set<Listener>()
  return {
    get: () => state,
    set(patch: Partial<T>) {
      let changed = false
      for (const k in patch) {
        if (!Object.is(state[k], patch[k])) {
          changed = true
          break
        }
      }
      if (!changed) return
      state = { ...state, ...patch }
      listeners.forEach((l) => l())
    },
    subscribe(l: Listener) {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

const initialLang: Lang = (() => {
  try {
    const saved = localStorage.getItem('katech-lang')
    if (saved === 'vi' || saved === 'en') return saved
  } catch {
    /* storage blocked */
  }
  return 'vi'
})()

export const ui = createStore<UIState>({
  lang: initialLang,
  loaded: 0,
  ready: false,
  chapter: 'river',
  phase: 'hero',
  panel: null,
  shopName: '',
  pondAnswer: null,
  reducedMotion:
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  glFailed: false,
})

export function useUI<K extends keyof UIState>(key: K): UIState[K] {
  return useSyncExternalStore(ui.subscribe, () => ui.get()[key])
}

/** Continuous values (scroll progress etc.) bypass React. */
export const live = {
  /** Global scroll progress over the whole page 0..1 */
  progress: 0,
  /** Per-chapter local progress */
  local: { river: 0, pond: 0, cafe: 0, night: 0, footer: 0 } as Record<ChapterId, number>,
  listeners: new Set<() => void>(),
  emit() {
    this.listeners.forEach((l) => l())
  },
}
