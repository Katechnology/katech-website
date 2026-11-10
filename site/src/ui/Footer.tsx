import { CONTACT } from '../i18n'
import { ui } from '../store'
import { scrollToChapter } from '../scroll'
import { Mark, Swap, useDict } from './chrome'

export function Footer() {
  const d = useDict()
  const link = 'swap-host inline-flex text-[14px] text-cream/80 hover:text-cream'
  const head = 'mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-cream/45'
  const scenes = ['river', 'pond', 'cafe', 'night'] as const
  return (
    <footer data-chapter="footer" className="relative z-10 overflow-hidden bg-night px-6 pb-10 pt-24 md:px-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end gap-[2vw] leading-none">
          <Mark white className="h-[16vw] w-auto max-h-56 shrink-0" />
          <span className="font-sans text-[22vw] font-semibold leading-[0.8] tracking-[-0.055em] text-cream md:text-[18vw] lg:text-[15rem]">
            katech
          </span>
        </div>
        <p className="mt-6 font-serif text-[22px] italic text-cream/75 md:text-[28px]">{d.footer.tagline}</p>

        <div className="mt-16 grid grid-cols-2 gap-10 md:grid-cols-4">
          <div>
            <p className={head}>
              <span className="text-gold">✿</span> {d.footer.services}
            </p>
            <ul className="space-y-2">
              {(['web', 'app', 'video', 'ai'] as const).map((k) => (
                <li key={k}>
                  <button className={link} onClick={() => ui.set({ panel: k })}>
                    <Swap>{d.panels[k].kicker.split('— ')[1]}</Swap>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={head}>
              <span className="text-gold">✿</span> {d.footer.scenes}
            </p>
            <ul className="space-y-2">
              {scenes.map((s, i) => (
                <li key={s}>
                  <button className={link} onClick={() => scrollToChapter(s, i ? 0.05 : 0)}>
                    <Swap>{d.chapters[i === 0 ? 0 : i + 1]} ↑</Swap>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-2">
            <p className={head}>
              <span className="text-gold">✿</span> {d.footer.contact}
            </p>
            <ul className="space-y-2">
              <li>
                <a className={link} href={CONTACT.phoneHref}>
                  <Swap>{CONTACT.phone}</Swap>
                </a>
              </li>
              <li>
                <a className={link} href={CONTACT.zalo} target="_blank" rel="noopener">
                  <Swap>Zalo ↗</Swap>
                </a>
              </li>
              <li>
                <a className={link} href={`mailto:${CONTACT.email}`}>
                  <Swap>{CONTACT.email}</Swap>
                </a>
              </li>
              <li className="text-[14px] text-cream/55">{CONTACT.city}</li>
            </ul>
          </div>
        </div>

        <div className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-[12.5px] text-cream/45">
          <p>{d.footer.rights}</p>
          <button className="swap-host inline-flex hover:text-cream" onClick={() => scrollToChapter('river')}>
            <Swap>{d.footer.top} ↑</Swap>
          </button>
        </div>
      </div>
    </footer>
  )
}
