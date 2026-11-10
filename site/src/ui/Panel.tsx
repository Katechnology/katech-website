import { useEffect, useRef } from 'react'
import { ui, useUI } from '../store'
import { lockScroll, scrollToChapter } from '../scroll'
import { Swap, useDict } from './chrome'

export function Panel() {
  const d = useDict()
  const panel = useUI('panel')
  const closeRef = useRef<HTMLButtonElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)
  const open = panel !== null

  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement
      lockScroll(true)
      setTimeout(() => closeRef.current?.focus(), 50)
    } else {
      lockScroll(false)
      lastFocus.current?.focus?.()
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && ui.set({ panel: null })
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  const close = () => ui.set({ panel: null })
  const svc = panel && panel !== 'process' ? d.panels[panel] : null
  const proc = d.panels.process

  return (
    <div className={`fixed inset-0 z-[45] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={close}
        className={`absolute inset-0 bg-night/40 backdrop-blur-[2px] transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={svc ? svc.title : proc.title}
        className={`absolute right-0 top-0 flex h-full w-full max-w-[34rem] flex-col overflow-y-auto bg-paper text-ink shadow-2xl transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] md:rounded-l-[28px] ${open ? 'translate-x-0' : 'translate-x-full'}`}
        data-lenis-prevent
      >
        <div className="flex items-center justify-between px-7 pt-6">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-hue">{svc ? svc.kicker : proc.kicker}</p>
          <button
            ref={closeRef}
            onClick={close}
            className="grid h-9 w-9 place-items-center rounded-full bg-ink/[0.06] text-ink transition-colors hover:bg-ink/[0.12]"
            aria-label={d.panels.close}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 px-7 pb-8 pt-8">
          {svc ? (
            <>
              <h2 className="font-serif text-[40px] leading-[1.02] tracking-[-0.025em] md:text-[46px]">{svc.title}</h2>
              <p className="mt-5 text-[16px] leading-[1.65] text-ink/80">{svc.body}</p>
              <ul className="mt-7 divide-y divide-ink/10 border-y border-ink/10">
                {svc.items.map((it) => (
                  <li key={it} className="flex items-center gap-3 py-3.5 text-[15px]">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-gold" />
                    {it}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h2 className="font-serif text-[40px] leading-[1.02] tracking-[-0.025em] md:text-[46px]">{proc.title}</h2>
              <ol className="mt-8 space-y-6">
                {proc.steps.map(([t, body], i) => (
                  <li key={t} className="grid grid-cols-[2.5rem_1fr] gap-3">
                    <span className="font-serif text-[28px] italic leading-none text-gold">{i + 1}</span>
                    <div>
                      <h3 className="font-serif text-[22px] leading-tight">{t}</h3>
                      <p className="mt-1.5 text-[15px] leading-[1.6] text-ink/75">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-10 grid grid-cols-2 gap-2">
                {(['web', 'app', 'video', 'ai'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => ui.set({ panel: k })}
                    className="rounded-2xl border border-ink/10 p-4 text-left transition-colors hover:border-hue/40 hover:bg-white/60"
                  >
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-hue">{d.panels[k].kicker}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="sticky bottom-0 border-t border-ink/10 bg-paper/95 px-7 py-5 backdrop-blur">
          <button
            onClick={() => {
              close()
              setTimeout(() => scrollToChapter('night', 0.2), 300)
            }}
            className="swap-host inline-flex h-12 w-full items-center justify-center rounded-full bg-ink text-[15px] font-semibold text-cream"
          >
            <Swap>{d.panels.cta} →</Swap>
          </button>
        </div>
      </aside>
    </div>
  )
}
