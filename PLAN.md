# Katech website — build plan

## 1. What we take from lettra.dev (and what we don't)

lettra.dev is a scroll-driven chain of **painted, illustrated 3D scenes**:

1. a tree on a hill, with the title sitting in the scene
2. leaves falling past the camera
3. a koi pond you can touch
4. a paper page you can type on
5. a pull-back showing the page was on a CRT monitor
6. a wall of TVs with a terminal CTA
7. a huge wordmark footer

The scene text is real 3D type (Lettra, MSDF), so leaves can pass in front of and behind the words.

The fixed interface is small:
- a glass pill nav at the top
- a dotted scene rail on the left
- one persistent command pill at the bottom (`npx skills add …`) with a copy button
- a loader with a playful line ("Letting the Leaves Fall…")

**We keep:** the scene chain, text living inside the painted world, the one persistent pill, the scene rail, the glass nav, the loader with a sentence, the serif-meets-mono typographic voice, and the restraint (one idea per screen).

**We don't copy:** their artwork, their tree, leaves, koi pond art, their fonts, or their copy. Everything below is Katech's own and comes from Huế.

## 2. Concept: "Một ngày ở Huế" (A day in Huế)

Scroll moves through one day on the Perfume River, from dawn to lantern night. Each time of day carries one Katech service, so the page tells a story instead of listing services.

| # | Scene (time of day) | Service | Interaction |
|---|---|---|---|
| 0 | Loader | — | K mark draws its stroke, the gold dot drops. "Đang chèo đò ra giữa sông…" |
| 1 | **Bình minh trên sông Hương** (dawn): purple-gold sky, a pagoda on the far bank, a sampan in the foreground | Brand promise | Title in 3D *behind* the boat's bow and the reeds. Parallax on the pointer. |
| 2 | **Gió sớm** (morning wind): the camera tilts into the sky, with lotus petals, bougainvillea and frangipani blowing past | All 4 services | The 4 service names fly through the petals in 3D (petals pass in front of and behind them). |
| 3 | **Hồ sen** (noon lotus pond, top-down, with koi) | **AI automation** | "Biết lắng nghe." Pointer ripples. Tap a customer question chip, or type one, and the AI reply **scrambles in** on the water (Lettra scramble). Koi swim toward the cursor. |
| 4 | **Tờ thực đơn** (a rice-paper menu floating on the pond) | **Website** | Type your shop name and it is set on the paper in several weights. Then the camera pulls back: the paper is a website **on a monitor** in a café. |
| 5 | **Quán cà phê buổi chiều** (afternoon café desk: monitor, phone, an old camera and TV) | **Website · App · Video** | The screens play: a booking app on the phone, a cut timeline on the TV. Hover a device to focus it. |
| 6 | **Đêm hoa đăng** (lantern night on the river) | **CTA** | "Thả một lời nhắn." Write a message on a lantern, it floats away, and the message opens in Zalo, email or phone. |
| 7 | Footer | — | A giant `katech.` wordmark (Lettra, wipe-in) with links, contact details and scene jump links. |

Each scene has a **"Xem thêm"** pill that opens a glass side panel with the plain facts: what you get, how long it takes, and what we need from you. No invented prices or client names.

## 3. Copy (Vietnamese first, with an EN toggle)

Tone: warm, plain-spoken, a little playful, no hype and no invented numbers. Built on the copy pass from the launch-film session.

- **Hero:** "Kinh doanh, / nhẹ gánh." EN "Business, / lighter."
  The đòn gánh, the shoulder pole of Huế street vendors, is the metaphor: Katech takes the tech weight off your shoulder.
  - Sub: "Website, app, video và AI cho doanh nghiệp ở Huế. Bạn lo chuyện kinh doanh — chuyện công nghệ, có Katech."
- **Scene 2:** "Khách tìm bạn / ở mọi nơi." EN "Found / everywhere."
  - Floating words: Website · Ứng dụng · Video · AI
- **Scene 3:** "Biết lắng nghe." EN "It listens."
  - Chips:
    - "Tối nay còn bàn không?" → "Còn ạ! 7 giờ tối, bàn cho mấy người ạ?"
    - "Mấy giờ quán mở cửa?" → "Quán mở từ 6 giờ sáng đến 10 giờ tối ạ."
    - "Có giao hàng không?" → "Có ạ, trong nội thành Huế, khoảng 30 phút."
  - Note: "Trả lời mẫu cho một quán ví dụ."
- **Scene 4:** "Một trang của riêng bạn." EN "A page of your own."
  - The sheet is an editable menu for "Quán của bạn".
- **Scene 5:** "Website. Ứng dụng. Video." with one line each.
- **Scene 6:** "Bạn kể. Katech nghe. Cùng làm." with a lantern input.
- **Persistent pill:** `Nhắn Katech → 0847 091 357` with copy, plus Zalo.
- **Loader:** "Đang chèo đò ra giữa sông…" EN "Rowing out to the river…"

## 4. Design system

- **Brand colours:**
  - Tím Huế `#4B1D8F`
  - Mực tím `#2A0F5C`
  - Vàng ngự `#E8A33D`
  - Paper `#F3EEE6` (loader and footer surfaces)
  - Night ink `#120A24`
- **Type:**
  - **Fraunces** (soft, slightly wonky serif, with Vietnamese support) for 3D scene titles and big headings. It carries the lettra-style expressive serif voice.
  - **Be Vietnam Pro** (the brand font, used in the logo film) for UI and body text.
  - A mono with Vietnamese support for the command pill and labels.
- **UI chrome:**
  - glass pills (backdrop blur, 1 px inner highlight)
  - a dark pill for the CTA (like lettra's command pill)
  - a dotted scene rail
- **Motion:**
  - eased scroll scrubbing with Lenis
  - scene transitions as camera moves plus a painterly noise dissolve
  - Lettra `wipe` for titles and `scramble` for the AI reply
  - `prefers-reduced-motion`: no autonomous motion, titles fully revealed, transitions become fades
- **Art direction for the imagery (fal):** hand-painted anime background art in gouache, soft cel shading and visible brush texture, warm light. The palette always leans to Huế purple and royal gold. No text in any image. One shared style prompt so every scene matches.

## 5. Tech

- Vite + React + TypeScript, Tailwind v4 for the HTML chrome.
- **three@0.186 `WebGPURenderer`** (falls back to WebGL2) + **lettra 0.3** for every in-scene title.
  - Fonts are baked at build time with `lettra bake`, using a **Vietnamese charset** (Latin Extended Additional U+1EA0–1EF9 plus the base set).
- One fixed full-screen canvas. Each scene is a module: `{ scene, camera, update(t, local), resize, pointer }`.
  - A compositor renders the outgoing and incoming scenes to render targets and mixes them with a noise-dissolve or zoom transition shader.
  - Scroll progress (GSAP ScrollTrigger + Lenis) maps to `sceneIndex + local t`.
- **Depth:** painted backgrounds are textured planes. Foreground cut-outs (boat bow, reeds, lotus leaves) are separate alpha planes in front of the Lettra text. That gives true occlusion, with text between layers.
- The koi are alpha sprites moved by a simple boid or steering rule toward the pointer. The water is a TSL shader with ripple rings from clicks.
- **21st.dev components** (fetched via the MCP API, adapted to the brand):
  - Elevate Navbar (glass pill nav)
  - Scroll Bars (scene rail)
  - Terminal (pattern for the lantern and CTA input)
  - side sheet and panel
- **Accessibility and SEO:** all scene text is mirrored in semantic HTML (visually hidden, readable by screen readers and crawlers). Every action works by keyboard. There are meta and Open Graph tags in Vietnamese and English.
- **Performance:**
  - images as WebP/AVIF at 2 sizes, and lazy-loaded scenes beyond the next one
  - DPR capped at 1.75
  - a pause when the tab is hidden
  - a static poster fallback if neither WebGPU nor WebGL2 is available

## 6. Assets to generate (fal)

1. `hero_dawn`: the Perfume River at dawn, with a pagoda silhouette and open sky for the title. The foreground is kept clear.
2. `hero_fg`: sampan bow, nón lá and reeds on transparent (removed background) to sit in front of the title.
3. `sky_morning`: an open morning sky with soft clouds (scene 2 backdrop).
4. Petal sprites: lotus petal, bougainvillea, frangipani (transparent).
5. `pond`: a top-down lotus pond, deep teal-green water with scattered pads.
6. Koi sprites: 2 colourways, top-down, transparent.
7. `cafe_desk`: an afternoon café desk with a monitor, phone and a small CRT TV. The screens are flat solid colour so UI can be mapped on.
8. `lantern_night`: the river at night with floating lanterns and the far bank's lights.
9. A lantern sprite (transparent).

## 7. Build order and quality loop

1. Scaffold, bake fonts, and get a Lettra Vietnamese test string on screen (proves diacritics).
2. Generate the art, check it for consistency, and regenerate any outliers.
3. Scene engine: scroll → scene index, the compositor and transitions.
4. Scenes 1 → 7, each checked in the browser at desktop and mobile width before moving on.
5. Chrome: nav, rail, pill, panels, i18n, loader.
6. Review passes: screenshots of every scene and transition midpoint, contrast, reduced-motion, WebGL2 fallback, Lighthouse-style weight check. Iterate on anything that looks generic.
