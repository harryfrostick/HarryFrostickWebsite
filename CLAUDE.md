# CLAUDE.md — Harry Frostick Portfolio Website

This file documents the structure, design decisions, and conventions of the Harry Frostick portfolio website so that Claude can continue development with full context.

---

## Project Overview

A personal portfolio website for **Harry Frostick**, a motion designer and illustrator based in Bristol. The site is built in plain HTML/CSS/JS with no framework, hosted on **Netlify**, version-controlled via **GitHub**.

**Live pages:** `index.html`, `about.html`, `portfolio.html`, `contact.html`

---

## Repository Structure

```
/
├── index.html
├── about.html
├── portfolio.html
├── contact.html
├── assets/
│   ├── HF_Ident.json          ← Lottie animation (dark version)
│   ├── HF_Ident_white.json    ← Lottie animation (white version)
│   ├── showreel.mp4           ← Background video for index.html
│   ├── logo-pepsi.webp
│   ├── logo-sky.webp
│   ├── logo-mars.webp
│   ├── logo-bt.webp
│   ├── logo-waitrose.webp
│   └── logo-monzo.webp
└── Projects/
    ├── 00 HARRY FROSTICK_Showreel_16x9.mp4
    ├── 00 HARRY FROSTICK_Showreel_Thumbnail.webp
    ├── Thumbnail_Duck & Boy.webp
    ├── Thumbnail_Zora.webp
    ├── Thumbnail_Bad_Habits.webp
    ├── Thumbnail_BCN_Moving Forward.webp
    ├── Thumbnail_Vidsy.webp
    ├── Duck&Boy_1.mp4 → Duck&Boy_10.mp4
    ├── Duck&Boy_6.gif
    ├── Duck&boy_7.mp4          ← Note lowercase 'b' in filename
    ├── Zorra_1.mp4 → Zorra_7.mp4
    ├── Zorra_2.png
    ├── Bad_Habits_1.mp4 → Bad_Habits_10.mp4
    ├── BCN_MovingForward_1.mp4
    ├── BCN_MovingForward_2.webp → BCN_MovingForward_4.webp
    └── BCN_MovingForward_5.webm → BCN_MovingForward_8.webm
```

> **Important:** The server (Netlify/Linux) is case-sensitive. Filenames must match exactly including spaces, capitalisation and punctuation.

---

## Design System

### Colour Palette

| Token | Value | Usage |
|---|---|---|
| `--fg` | `#0f0f0f` | Primary text (light pages) |
| `--accent` | `#e54e77` | Pink accent — highlights, hover states |
| `--muted` | `#7a6065` | Subdued text, labels |
| `--line` | `rgba(15,15,15,0.1)` | Borders and dividers |
| `--bg-top` | `#fce8ec` | Page gradient top (about, portfolio, contact) |
| `--bg-bot` | `#f4b8c4` | Page gradient bottom |

Index page uses a **dark theme** (`#0a0a0a` background, `--fg: #f0ebe3`).

### Typography

| Font | Weights | Usage |
|---|---|---|
| Bebas Neue | 400 | All display/headline text |
| Montserrat | 400, 600 | Body copy, labels, UI text |

Google Fonts import: `family=Bebas+Neue&family=Montserrat:wght@400;600`

Minimum body font-weight is **400** (regular) — never use 300 (light).

### Page Background

All pages except index use:
```css
background: linear-gradient(to bottom, #fce8ec 0%, #f4b8c4 100%);
background-attachment: fixed;
```

### Grain Overlay

All pages have a fixed SVG noise texture at `opacity: 0.45`, `z-index: 9990`, `pointer-events: none`.

---

## Custom Cursor

All pages use a custom white dot cursor with a velocity-based trailing echo.

- **Size:** `12.7px × 12.7px`
- **Trail echo base size:** `12.7px` (scaled by `1 - t * 0.1`)
- **Trail count:** 90 echoes
- **Blend mode:** `mix-blend-mode: multiply`
- Hidden on touch devices via `@media (hover: none) and (pointer: coarse)`
- On nav link hover: scales to `4.5×` with `mix-blend-mode: difference`

---

## Navigation

### Desktop — Proximity Nav

All pages use a **proximity-triggered** navigation that collapses to a hamburger icon by default and expands horizontally (right-to-left) when the cursor enters the top-right corner.

- **Trigger zone:** within `320px` of right edge, `100px` from top
- **Expand duration:** `0.9s` with `cubic-bezier(0.16, 1, 0.3, 1)`
- **Link fade duration:** `0.45s` with stagger (`0.12s` apart)
- **Collapse grace delay:** `180ms`
- Links reveal right-to-left ("Get in touch" first, "About" last)
- Burger morphs to × when open

**Nav HTML structure (required):**
```html
<nav id="mainNav">
  <a href="index.html" class="nav-logo" id="navLogo">
    <div class="nav-logo-lottie" id="navLottie"></div>
  </a>
  <div class="prox-nav" id="proxNav">
    <ul class="prox-links" id="proxLinks">
      <li><a href="about.html"><span>About</span></a></li>
      <li><a href="portfolio.html"><span>Work</span></a></li>
      <li><a href="https://www.instagram.com/harryfrostickdesigns" target="_blank" rel="noopener"><span>Instagram</span></a></li>
      <li><a href="contact.html"><span>Get in touch</span></a></li>
    </ul>
    <button class="prox-burger" id="proxBurger" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
  </div>
  <button class="nav-hamburger" id="navHamburger" aria-label="Menu">
    <span></span><span></span><span></span>
  </button>
</nav>
<div class="mobile-menu" id="mobileMenu">
  <!-- mobile links + close button -->
</div>
```

> **Critical:** `mobile-menu` must be **outside** `</nav>`. The nav must have `id="mainNav"`. Links must have `<span>` wrappers.

### Nav Background Gradient (about, portfolio, contact)

```css
nav::before {
  height: 120px;
  background: linear-gradient(to bottom, #fae6eb 0%, #fae6eb 50%, transparent 100%);
}
```

### HF Ident (Lottie logo)

- Path: `Assets/HF_Ident.json` (dark pages use `HF_Ident_white.json` on index via `mix-blend-mode: difference`)
- Size: `49px × 66px`
- Plays on hover, stops on mouse leave

### Mobile Menu

- Full-screen overlay, triggered by hamburger button
- Has an × close button (`id="mobileClose"`) positioned `top: 2rem; right: 2rem`
- Link typography: Bebas Neue, `clamp(4rem, 16vw, 7rem)`, `letter-spacing: -0.05em`, `line-height: 0.85`, `gap: 0.6rem`

### Index page — difference blend

On `index.html` the nav logo, burger, prox-links, and ticker all use `mix-blend-mode: difference` for visibility over the video background.

---

## Pages

### index.html

- Full-screen background video (`assets/showreel.mp4`), clicking it links to `portfolio.html`
- Dark theme (`#0a0a0a`)
- Scrolling ticker at the bottom listing skills
- No page content other than nav + ticker

### about.html

- Large headline: "Harry Frostick." — fades up and rises on load (`fadeUp 1s`, delay `0.3s`)
- Three stat boxes (scroll-reveal, `fadeUp` animation): Years experience, In-House/Agency/Freelance, Infinity symbol
- Client logo grid: 6 brands (Pepsi, Sky, Mars, BT, Waitrose, Monzo) as `.webp` images from `assets/`
  - No CSS filter — logos display as-is (black on transparent background)
  - `opacity: 0.75`, dims to `0.4` on hover
- "What's Next" section: header slides in from right on scroll, body text follows `200ms` later
- Tags: Character Design, Frame-by-Frame, Motion Design, Illustration, Brand Animation, Social Video, After Effects

### portfolio.html

- **Showreel** at top: thumbnail `Projects/00 HARRY FROSTICK_Showreel_Thumbnail.webp`, opens theatre modal with `Projects/00 HARRY FROSTICK_Showreel_16x9.mp4`
- **Masonry grid** (CSS grid, 3 cols desktop / 2 cols tablet / 1 col mobile)
- **5 projects** in order:

| # | Title | Client | Type | Year | Slides |
|---|---|---|---|---|---|
| 0 | Duck & Boy | Personal | Frame-by-Frame Animation | 2024 | 10 (mp4s + gif) |
| 1 | Zorra | Personal | Logo Animation | 2024 | 7 (mp4s + png) |
| 2 | Bad Habits | Personal | Frame-by-Frame · Illustration | 2025 | 10 (mp4s, per-slide descriptions) |
| 3 | BCN Moving Forward | BCN | Motion · Brand Animation | 2025 | 8 (mp4 + webps + webms) |
| 4 | Lay's Max | Vidsy | Social Content · Motion | 2025 | 1 (thumbnail only) |

**Project card (data-images JSON):** Each entry has `src`, `type` (`"video"` or `"image"`), and optionally `desc` for per-slide descriptions.

**Media types:** `.mp4` → `"video"`, `.webm` → `"video"`, `.gif` → `"image"`, `.png`/`.webp` → `"image"`

**Carousel behaviour:**
- Loops (wraps at both ends)
- Videos autoplay when navigated to, pause when leaving
- Mute state carries forward between slides
- Native video controls visible on hover only
- First slide's video autoplays on project open

### contact.html

- Minimal centred layout, full-height flex page
- Form submits to Web3Forms (`access_key: ebcdb7b8-2401-4f70-94f8-31f23f01d6f4`)
- Success state swaps form for confirmation message
- Heading: "Get in touch." — Bebas Neue, `clamp(5rem, 16vw, 18rem)`

---

## Key Conventions

- **All `font-weight: 300` is forbidden** — minimum is `400`
- **All image assets** for projects go in `Projects/`, Lottie + showreel go in `assets/` (lowercase)
- **WebP** is the preferred image format for thumbnails
- **Proximity nav CSS must come before** any legacy `.nav-hamburger` or `.nav-links` declarations to avoid cascade conflicts
- **`mobile-menu` div must be outside `</nav>`** or the mobile menu cannot be opened/closed
- The `<nav>` element must have `id="mainNav"` for the proximity JS to function
- All prox-links `<a>` tags must wrap their text in `<span>` for the magnetic hover effect

---

## Animations & Transitions

| Element | Animation | Details |
|---|---|---|
| About headline | `fadeUp` | 1s, cubic-bezier(0.16,1,0.3,1), delay 0.3s |
| Stat boxes | `statFadeUp` | 0.7s, scroll-triggered, staggered 120ms |
| Scroll reveals | `fadeSlideRight` | 0.75s ease |
| What's Next header | `fadeSlideRight` | 0.85s, scroll-triggered |
| What's Next body | `fadeSlideRight` | 0.85s, 200ms after header |
| Page hero (about) | `fadeUp` | 0.9s, delay 0.15s |
| Clients section | `fadeUp` | 0.9s, delay 0.45s |

---

## Third-party Libraries

| Library | Version | Usage |
|---|---|---|
| Lottie (Bodymovin) | 5.12.2 | HF Ident animation |
| Web3Forms | — | Contact form submission |

CDN: `https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js`
