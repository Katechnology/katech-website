import { useEffect, useRef } from 'react'
import { engine } from './gl/Engine'
import { startScroll } from './scroll'
import { useUI } from './store'
import { BottomPill, Loader, Nav, Rail, useDict } from './ui/chrome'
import { CafeUI, HeroCopy, NightUI, PondUI, WindCopy } from './ui/overlays'
import { Panel } from './ui/Panel'
import { Footer } from './ui/Footer'
import { CONTACT } from './i18n'

/** Scroll lengths in viewport heights. Each includes one viewport for the hand-off. */
const LEN = { river: 5.2, pond: 3.6, cafe: 5.6, night: 3.0 }

export default function App() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const d = useDict()
  const lang = useUI('lang')
  const glFailed = useUI('glFailed')

  useEffect(() => {
    if (canvas.current) engine.init(canvas.current)
    startScroll()
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = d.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', d.meta.desc)
  }, [lang, d])

  return (
    <>
      <Loader />
      <canvas ref={canvas} className="fixed inset-0 h-full w-full" aria-hidden="true" />
      {glFailed && (
        <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/img/hero_dawn.webp)' }} aria-hidden="true" />
      )}
      <Nav />
      <Rail />

      <main className="relative z-10">
        {/* Each chapter is a scroll track for one painted scene; the text lives in the scene and is mirrored here for readers and crawlers. */}
        <section data-chapter="river" style={{ height: `${LEN.river * 100}vh` }} aria-labelledby="h-hero">
          <div className="sr-only">
            <h1 id="h-hero">Katech — {d.hero.title.replace('\n', ' ')}</h1>
            <p>{d.hero.sub}</p>
            <h2>{d.wind.title.replace('\n', ' ')}</h2>
            <p>{d.wind.words.join(', ')}. {d.wind.sub}</p>
          </div>
        </section>
        <section data-chapter="pond" style={{ height: `${LEN.pond * 100}vh` }} aria-labelledby="h-pond">
          <div className="sr-only">
            <h2 id="h-pond">{d.pond.title}</h2>
            <p>{d.pond.sub}</p>
            <h3>{d.panels.ai.title}</h3>
            <p>{d.panels.ai.body}</p>
          </div>
        </section>
        <section data-chapter="cafe" style={{ height: `${LEN.cafe * 100}vh` }} aria-labelledby="h-cafe">
          <div className="sr-only">
            <h2 id="h-cafe">{d.cafe.devices.map((x) => x.title).join(' · ')}</h2>
            {d.cafe.devices.map((x) => (
              <p key={x.key}>
                {x.title}: {x.line}
              </p>
            ))}
          </div>
        </section>
        <section data-chapter="night" style={{ height: `${LEN.night * 100}vh` }} aria-labelledby="h-night">
          <div className="sr-only">
            <h2 id="h-night">{d.night.title.replace(/\n/g, ' ')}</h2>
            <p>
              {d.night.sub} {CONTACT.phone} · {CONTACT.email}
            </p>
          </div>
        </section>
        <Footer />
      </main>

      <HeroCopy />
      <WindCopy />
      <PondUI />
      <CafeUI />
      <NightUI />
      <BottomPill />
      <Panel />
    </>
  )
}
