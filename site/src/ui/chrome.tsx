import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { CONTACT, DICT } from '../i18n'
import { live, ui, useUI, type ChapterId } from '../store'
import { scrollToChapter } from '../scroll'

export function useDict() {
  return DICT[useUI('lang')]
}

/** Text that rolls to a copy of itself on hover (21st.dev Elevate navbar pattern). */
export function Swap({ children }: { children: ReactNode }) {
  return (
    <span className="swap">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  )
}

export function Mark({ className = '', white = false }: { className?: string; white?: boolean }) {
  return (
    <svg viewBox="0 0 220 200" className={className} aria-hidden="true">
      <g fill="none" stroke={white ? '#fff' : '#4B1D8F'} strokeWidth="30" strokeLinecap="round" strokeLinejoin="round">
        <path d="M56 34 V166" />
        <path d="M146 36 L64 107" />
        <path d="M62 114 C92 112 102 134 118 149 C128 158 140 161 150 161" />
      </g>
      <circle cx="186" cy="161" r="15" fill="#E8A33D" />
    </svg>
  )
}

/** Bright scenes get light pills, water and night get dark ones. */
export function useTone(): 'light' | 'dark' {
  const chapter = useUI('chapter')
  const phase = useUI('phase')
  if (chapter === 'river') return 'light'
  if (chapter === 'cafe' && phase === 'site') return 'light'
  return 'dark'
}

/* ---------------- Nav ---------------- */

export function Nav() {
  const d = useDict()
  const lang = useUI('lang')
  const ready = useUI('ready')
  const setLang = (l: 'vi' | 'en') => {
    ui.set({ lang: l })
    try {
      localStorage.setItem('katech-lang', l)
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l
  }
  const tone = useTone()
  const pill = 'pill swap-host whitespace-nowrap rounded-full px-4 h-9 inline-flex items-center text-[13px] font-medium tracking-[-0.01em]'
  return (
    <header
      data-ui
      data-tone={tone}
      className={`fixed top-3 left-1/2 z-40 -translate-x-1/2 transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
    >
      <nav aria-label="Katech" className="flex items-center gap-1.5">
        <button className={`${pill} gap-2 pl-2.5`} onClick={() => scrollToChapter('river')} aria-label="Katech — lên đầu trang">
          <span className={`grid h-6 w-6 place-items-center rounded-full ${tone === 'light' ? 'bg-ink' : 'bg-white'}`}>
            <Mark className="h-3.5 w-3.5" white={tone === 'light'} />
          </span>
          <span className="font-semibold">katech</span>
        </button>
        <button className={`${pill} max-sm:hidden`} onClick={() => scrollToChapter('river', 2.6)}>
          <Swap>{d.nav.services}</Swap>
        </button>
        <button className={`${pill} max-sm:hidden`} onClick={() => ui.set({ panel: 'process' })}>
          <Swap>{d.nav.process}</Swap>
        </button>
        <button className={pill} onClick={() => scrollToChapter('night', 0.2)}>
          <Swap>{d.nav.contact}</Swap>
        </button>
        <div className="pill ml-0.5 flex h-9 items-center rounded-full p-1 text-[12px] font-semibold" role="group" aria-label="Language">
          {(['vi', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`h-7 rounded-full px-2.5 uppercase transition-colors ${
                lang === l ? (tone === 'light' ? 'bg-ink text-white' : 'bg-white text-ink') : 'opacity-70 hover:opacity-100'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </nav>
    </header>
  )
}

/* ---------------- Scene rail (adapted from 21st.dev "Scroll Bars", vertical) ---------------- */

const CHAPTER_IDS: ChapterId[] = ['river', 'pond', 'cafe', 'night']

export function Rail() {
  const d = useDict()
  const ready = useUI('ready')
  const chapter = useUI('chapter')
  const progress = useMotionValue(0)
  const [marks, setMarks] = useState<number[]>([0, 0.25, 0.5, 0.75])
  const TRACK = 180
  const raw = useTransform(progress, [0, 1], [0, TRACK])
  const y = useSpring(raw, { stiffness: 200, damping: 24 })

  useEffect(() => {
    const onLive = () => progress.set(live.progress)
    live.listeners.add(onLive)
    const measure = () => {
      const docH = document.documentElement.scrollHeight - innerHeight
      setMarks(
        CHAPTER_IDS.map((id) => {
          const el = document.querySelector<HTMLElement>(`[data-chapter="${id}"]`)
          return el && docH > 0 ? el.offsetTop / docH : 0
        }),
      )
    }
    measure()
    addEventListener('resize', measure)
    const t = setTimeout(measure, 800)
    return () => {
      live.listeners.delete(onLive)
      removeEventListener('resize', measure)
      clearTimeout(t)
    }
  }, [progress])

  const ticks = Array.from({ length: 31 }, (_, i) => i / 30)
  return (
    <nav
      data-ui
      aria-label={d.chapters.join(', ')}
      className={`fixed left-4 top-1/2 z-30 -translate-y-1/2 transition-opacity duration-700 max-md:hidden ${ready && chapter !== 'footer' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="relative" style={{ height: TRACK }}>
        {ticks.map((p) => (
          <span key={p} className="absolute left-0 h-px w-2 bg-white/35" style={{ top: p * TRACK }} />
        ))}
        {marks.map((m, i) => (
          <button
            key={CHAPTER_IDS[i]}
            onClick={() => scrollToChapter(CHAPTER_IDS[i], i === 0 ? 0 : 0.05)}
            className="group absolute -left-1 flex h-4 items-center"
            style={{ top: m * TRACK - 8 }}
            aria-current={chapter === CHAPTER_IDS[i] ? 'step' : undefined}
          >
            <span className={`h-[2px] rounded-full transition-all duration-500 ${chapter === CHAPTER_IDS[i] ? 'w-5 bg-gold' : 'w-3.5 bg-white/80 group-hover:w-5'}`} />
            <span className="glass ml-2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {d.chapters[i === 0 ? 0 : i + 1]}
            </span>
          </button>
        ))}
        <motion.span className="absolute -left-1 h-[3px] w-6 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,.8)]" style={{ y }} />
      </div>
    </nav>
  )
}

/* ---------------- Bottom pill ---------------- */

export function BottomPill() {
  const d = useDict()
  const ready = useUI('ready')
  const phase = useUI('phase')
  const chapter = useUI('chapter')
  const [copied, setCopied] = useState(false)
  const hero = chapter === 'river' && phase === 'hero'
  const hidden = chapter === 'footer' || (chapter === 'night' && phase === 'night')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT.phone.replace(/\s/g, ''))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      location.href = CONTACT.phoneHref
    }
  }
  return (
    <div data-ui className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className={`fade ${ready && hero ? 'on' : ''} absolute bottom-0`}>
        <button
          onClick={() => scrollToChapter('river', 1.2)}
          data-tone="light"
          className="swap-host inline-flex h-9 items-center gap-2 rounded-full pl-4 pr-1.5 text-[13px] font-medium"
          style={{ background: 'rgb(255 255 255 / .62)', color: '#2A0F5C', border: '1px solid rgb(255 255 255 / .85)', backdropFilter: 'blur(14px)' }}
        >
          <Swap>{d.scrollDown}</Swap>
          <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-white">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
        </button>
      </div>
      <div className={`fade ${ready && !hero && !hidden ? 'on' : ''} flex items-center gap-1.5`}>
        <a
          href={CONTACT.phoneHref}
          className="glass-dark swap-host inline-flex h-10 items-center gap-3 rounded-full px-4 font-mono text-[12.5px] text-cream"
        >
          <span className="text-gold">›</span>
          <Swap>
            {d.pill.label} <span className="text-white/50">·</span> {CONTACT.phone}
          </Swap>
        </a>
        <button
          onClick={copy}
          aria-label={d.pill.copy}
          className="glass-dark grid h-10 w-10 place-items-center rounded-full text-cream transition-colors hover:text-gold"
        >
          {copied ? (
            <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
              <path d="m3 8.5 3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
              <rect x="5" y="5" width="8.5" height="8.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10.5 3.2A1.7 1.7 0 0 0 9 2.5H4.2A1.7 1.7 0 0 0 2.5 4.2V9a1.7 1.7 0 0 0 .7 1.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          )}
          <span className="sr-only" aria-live="polite">
            {copied ? d.pill.copied : ''}
          </span>
        </button>
      </div>
    </div>
  )
}

/* ---------------- Loader ---------------- */

export function Loader() {
  const d = useDict()
  const ready = useUI('ready')
  const loaded = useUI('loaded')
  const [gone, setGone] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setGone(true), 1200)
    return () => clearTimeout(t)
  }, [ready])
  if (gone) return null
  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-50 grid place-items-center bg-paper text-ink transition-[opacity,visibility] duration-1000 ${ready ? 'invisible opacity-0' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="grid h-16 w-16 place-items-center rounded-[18px] bg-ink">
          <svg viewBox="0 0 220 200" className="h-9 w-9" aria-hidden="true">
            <g fill="none" stroke="#fff" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round">
              <path className="k-stroke" d="M56 34 V166" />
              <path className="k-stroke" d="M146 36 L64 107" />
              <path className="k-stroke" d="M62 114 C92 112 102 134 118 149 C128 158 140 161 150 161" />
            </g>
            <circle className="k-dot" cx="186" cy="161" r="15" fill="#E8A33D" />
          </svg>
        </div>
        <p className="font-serif text-[19px] tracking-[-0.01em]">{d.loader}</p>
        <div className="h-px w-40 overflow-hidden bg-ink/15">
          <div className="h-full bg-hue transition-[width] duration-300" style={{ width: `${Math.round(loaded * 100)}%` }} />
        </div>
      </div>
      <p className="absolute bottom-6 font-mono text-[11px] text-ink/55">{d.loaderHint}</p>
    </div>
  )
}
