# Katech — "Một ngày ở Huế"

A scroll-driven website for Katech. The page moves through one painted day on the Perfume River:

| Scene | Shows | Interaction |
|---|---|---|
| Dawn | Brand promise | Title sits in the 3D scene; petals drift in front of it and behind it |
| Morning wind | All services | The four service names fly past the camera |
| Lotus pond | AI automation | Ripples follow the pointer; koi follow the cursor; a sample AI reply decodes on the water |
| Café | Website, app, video | Typing a shop name updates the website, the phone app and the TV video |
| Lantern night | Contact | A message floats off on a lantern, then is sent via Zalo, email or phone |

All scene titles are real 3D text made with Lettra. The fonts are baked with a Vietnamese charset, using Fraunces and Be Vietnam Pro. The text also appears in hidden semantic HTML so screen readers and search engines can read it.

## Run

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # static site in dist/ — host anywhere (Vercel, Netlify, Cloudflare Pages)
```

## Re-bake fonts (only if the copy needs new characters)

```bash
node_modules/.bin/lettra bake fonts-src/Fraunces-400.ttf --charset fonts-src/charset-vi.txt --size 48 --pxrange 8 --texture 1024 --out public/fonts/fraunces
```

Repeat for `Fraunces-600` → `fraunces`, `Fraunces-Italic-400` → `fraunces-italic`, and `BeVietnamPro-Medium` → `bvp`. The Fraunces instances were cut from the variable font with these axis settings: opsz 72, SOFT 100, WONK 1.

## Where things live

- **Copy (VI / EN):** `src/i18n.ts`. Contact details are in `CONTACT`.
- **Scenes:** `src/gl/scenes/*`. The scroll-to-scene engine and the painterly dissolve are in `src/gl/Engine.ts`.
- **HTML layer:** `src/ui/*`. It holds the nav, the scene rail (adapted from 21st.dev Scroll Bars), the glass pills (from the 21st.dev Elevate Navbar pattern), the panels and the footer.
- **Art:** `public/img`. Masters are in `art/raw`. They were generated with fal (`nano-banana-2`, cutouts with `birefnet`) and contain no text.

## Credits

- Lettra by JOYCO (MIT).
- Fraunces and Be Vietnam Pro (SIL OFL).
- three.js, Lenis, GSAP and motion.
