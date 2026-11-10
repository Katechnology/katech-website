import { useEffect, useRef, useState } from 'react'
import { CONTACT } from '../i18n'
import { ui, useUI } from '../store'
import { engine } from '../gl/Engine'
import { Swap, useDict, useTone } from './chrome'

const more = 'pill swap-host inline-flex h-8 items-center gap-2 rounded-full pl-1.5 pr-3.5 text-[12.5px] font-medium'

function MoreButton({ onClick, label }: { onClick: () => void; label: string }) {
  const tone = useTone()
  return (
    <span data-tone={tone}>
    <button className={more} onClick={onClick}>
      <span className={`grid h-5 w-5 place-items-center rounded-full ${tone === 'light' ? 'bg-ink text-white' : 'bg-white text-ink'}`}>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M5 1.5v7M1.5 5h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <Swap>{label}</Swap>
    </button>
    </span>
  )
}

function useOn(chapter: string, phases?: string[]) {
  const c = useUI('chapter')
  const p = useUI('phase')
  const ready = useUI('ready')
  return ready && c === chapter && (!phases || phases.includes(p))
}

/* ---------- Dawn ---------- */
export function HeroCopy() {
  const d = useDict()
  const on = useOn('river', ['hero'])
  return (
    <div
      className={`fade ${on ? 'on' : ''} fixed z-20 max-md:inset-x-6 md:max-w-[min(30rem,var(--hero-title-width))]`}
      style={{ top: 'calc(var(--hero-title-bottom) + 2.2vh)', left: 'max(1.5rem, var(--hero-title-left))' }}
    >
      <p className="text-[15px] font-medium leading-[1.55] text-ink md:text-[16.5px] [text-shadow:0_1px_12px_rgb(255_255_255/0.6)]">{d.hero.sub}</p>
    </div>
  )
}

/* ---------- Morning wind ---------- */
export function WindCopy() {
  const d = useDict()
  const on = useOn('river', ['wind'])
  return (
    <div
      className={`fade ${on ? 'on' : ''} fixed z-20 left-6 right-6 md:left-[12vw] md:right-auto md:max-w-[26rem]`}
      style={{ top: 'calc(var(--wind-title-bottom) + 4vh)' }}
    >
      <p className="text-[15px] leading-[1.55] text-ink md:text-[16px]">{d.wind.sub}</p>
      <div className="mt-4">
        <MoreButton label={d.nav.process} onClick={() => ui.set({ panel: 'process' })} />
      </div>
    </div>
  )
}

/* ---------- Lotus pond (AI) ---------- */
export function PondUI() {
  const d = useDict()
  const on = useOn('pond', ['pond'])
  const answered = useUI('pondAnswer')
  return (
    <div
      className={`fade ${on ? 'on' : ''} fixed z-20 left-6 right-6 md:left-[12vw] md:right-auto md:max-w-[25rem]`}
      style={{ top: 'calc(var(--pond-title-bottom) + 2.5vh)' }}
    >
      <p className="scene-text text-[15px] leading-[1.55] text-white/95 md:text-[16px] max-md:hidden">{d.pond.sub}</p>
      <div className="md:mt-6 max-md:fixed max-md:inset-x-4 max-md:bottom-20">
        <p className="scene-text mb-2.5 font-mono text-[11.5px] uppercase tracking-[0.08em] text-white/80">{d.pond.ask}</p>
        <div className="flex flex-wrap gap-2">
          {d.pond.qa.map((qa, i) => (
            <button
              key={i}
              data-ui
              onClick={() => {
                ui.set({ pondAnswer: i })
                engine.ask(i)
              }}
              aria-pressed={answered === i}
              className={`rounded-full px-3.5 py-2 text-left text-[13.5px] font-medium transition-all duration-300 ${
                answered === i ? 'bg-cream text-ink shadow-lg' : 'glass text-white hover:bg-white/30'
              }`}
            >
              {qa.q}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <p className="scene-text text-[11.5px] text-white/70">{d.pond.note}</p>
        </div>
        <div className="mt-4">
          <MoreButton label={d.readMore} onClick={() => ui.set({ panel: 'ai' })} />
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {answered !== null ? `${d.pond.shop}: ${d.pond.qa[answered].a}` : ''}
      </p>
    </div>
  )
}

/* ---------- Café (website / app / video) ---------- */
export function CafeUI() {
  const d = useDict()
  const phase = useUI('phase')
  const onSite = useOn('cafe', ['site'])
  const onDevice = useOn('cafe', ['web', 'app', 'video'])
  const [name, setName] = useState(ui.get().shopName)
  const idx = phase === 'app' ? 1 : phase === 'video' ? 2 : 0
  const dev = d.cafe.devices[idx]
  const lastDev = useRef(dev)
  if (onDevice) lastDev.current = dev
  const shown = lastDev.current
  return (
    <>
      <div className={`fade ${onSite ? 'on' : ''} fixed inset-x-0 bottom-24 z-20 flex justify-center px-4`}>
        <label data-ui className="glass-dark flex w-full max-w-md items-center gap-3 rounded-full py-1.5 pl-5 pr-1.5">
          <span className="shrink-0 font-mono text-[11.5px] uppercase tracking-[0.06em] text-gold">{d.cafe.typeName}</span>
          <input
            value={name}
            maxLength={28}
            onChange={(e) => {
              setName(e.target.value)
              ui.set({ shopName: e.target.value })
              engine.setShopName(e.target.value)
            }}
            placeholder={d.cafe.namePlaceholder}
            className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2 font-serif text-[16px] text-cream placeholder:text-cream/45 focus:bg-white/15 focus:outline-none"
          />
        </label>
      </div>
      <div className={`fade ${onDevice ? 'on' : ''} fixed z-20 bottom-24 left-4 right-4 md:left-[6vw] md:right-auto md:bottom-[10vh] md:max-w-[24rem]`}>
        <div key={shown.key} className="glass-dark rounded-[22px] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-gold">0{idx + 1} — {shown.title}</p>
          <h3 className="mt-2 font-serif text-[30px] leading-[1.05] tracking-[-0.02em] text-cream md:text-[36px]">{shown.title}</h3>
          <p className="mt-2.5 text-[14.5px] leading-[1.55] text-cream/85">{shown.line}</p>
          <div className="mt-4">
            <MoreButton label={d.readMore} onClick={() => ui.set({ panel: shown.key })} />
          </div>
        </div>
      </div>
    </>
  )
}

/* ---------- Lantern night (contact) ---------- */
export function NightUI() {
  const d = useDict()
  const on = useOn('night', ['night'])
  const [msg, setMsg] = useState('')
  const [contact, setContact] = useState('')
  const [released, setReleased] = useState(false)
  const [status, setStatus] = useState('')
  const area = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!msg) setReleased(false)
  }, [msg])

  const full = () => `${msg.trim()}${contact.trim() ? `\n\n— ${contact.trim()}` : ''}`
  const release = () => {
    if (!msg.trim()) {
      setStatus(d.night.empty)
      area.current?.focus()
      return
    }
    engine.release(msg.trim())
    setReleased(true)
    setStatus('')
  }
  const viaZalo = async () => {
    try {
      await navigator.clipboard.writeText(full())
    } catch {
      /* clipboard blocked */
    }
    setStatus(d.night.sentZalo)
    window.open(CONTACT.zalo, '_blank', 'noopener')
  }
  const viaMail = () => {
    setStatus(d.night.sentMail)
    location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent('Katech — lời nhắn từ website')}&body=${encodeURIComponent(full())}`
  }

  return (
    <div
      className={`fade ${on ? 'on' : ''} fixed z-20 left-4 right-4 md:left-auto md:right-[6vw] md:w-[24rem] max-md:bottom-6 md:top-1/2 md:-translate-y-1/2`}
    >
      <form
        data-ui
        className="glass-dark rounded-[24px] p-5"
        onSubmit={(e) => {
          e.preventDefault()
          release()
        }}
      >
        <p className="text-[14px] leading-[1.5] text-cream/85 max-md:hidden">{d.night.sub}</p>
        <label className="sr-only" htmlFor="lantern-msg">
          {d.night.placeholder}
        </label>
        <textarea
          id="lantern-msg"
          ref={area}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={3}
          maxLength={600}
          placeholder={d.night.placeholder}
          className="mt-0 w-full resize-none rounded-2xl bg-white/[0.07] px-4 py-3 text-[15px] leading-[1.5] text-cream placeholder:text-cream/40 focus:bg-white/[0.11] focus:outline-none md:mt-4"
        />
        <label className="sr-only" htmlFor="lantern-contact">
          {d.night.contactPlaceholder}
        </label>
        <input
          id="lantern-contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={d.night.contactPlaceholder}
          autoComplete="tel"
          className="mt-2 w-full rounded-full bg-white/[0.07] px-4 py-2.5 text-[14px] text-cream placeholder:text-cream/40 focus:bg-white/[0.11] focus:outline-none"
        />
        {!released ? (
          <button
            type="submit"
            className="swap-host mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gold text-[15px] font-semibold text-ink transition-transform active:scale-[0.98]"
          >
            <Swap>{d.night.send} ✿</Swap>
          </button>
        ) : (
          <div className="mt-3">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-cream/60">{d.night.via}</p>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={viaZalo} className="h-10 rounded-full bg-gold text-[14px] font-semibold text-ink">
                Zalo
              </button>
              <button type="button" onClick={viaMail} className="h-10 rounded-full bg-white/10 text-[14px] font-medium text-cream hover:bg-white/15">
                Email
              </button>
              <a href={CONTACT.phoneHref} className="grid h-10 place-items-center rounded-full bg-white/10 text-[14px] font-medium text-cream hover:bg-white/15">
                {d.night.call}
              </a>
            </div>
          </div>
        )}
        <p className="mt-2 min-h-[1.2em] text-[12.5px] text-gold" aria-live="polite">
          {status}
        </p>
      </form>
    </div>
  )
}
