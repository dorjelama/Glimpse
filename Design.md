---
name: Glimpse Editorial Warm
colors:
  primary: "#B85C37"        # terra — primary CTA, brand accent
  secondary: "#CFAC64"      # gold — dividers, secondary accent, eyebrow rules
  surface: "#F6EBDD"        # cream — page surface for marketing & viewer
  surface-alt: "#F9CDB5"    # blush — soft surface for badges, chips
  on-surface: "#1E130C"     # ink — primary text on warm surfaces
  panel: "#1e1e2e"          # editor chrome (dark)
  panel-light: "#2a2a3d"    # editor sub-panels, toolbars
  accent: "#7c3aed"         # editor-only — selection, focus rings, active tool
  canvas: "#f3f4f6"         # editor working canvas background
  error: "#ffb4ab"          # validation, destructive
  live: "#6DBB7C"           # live-feed pulse (Moments)
typography:
  display:
    fontFamily: Georgia, serif
    fontWeight: 700
    letterSpacing: 0.02em
  body-md:
    fontFamily: Inter, -apple-system, "Segoe UI", Roboto, sans-serif
    fontSize: 16px
    fontWeight: 400
  label:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: 600
    textTransform: uppercase
    letterSpacing: 0.22em
rounded:
  sm: 4px
  md: 8px
  lg: 16px
  pill: 9999px
---

# Glimpse Design System

## Overview
Glimpse pairs an **editorial, warm-toned** marketing & viewer experience with a **dark, focused** editor surface. Public-facing screens (landing, dashboard, public viewer, share flow) feel like a printed invitation: cream paper, terra and gold accents, serif headlines. The editor (and any admin power-user tooling) flips to a dark panel UI with a purple accent so the user's content is always the brightest thing on screen.

When in doubt: **content first, chrome second**. The user's card, gallery, or invitation is the hero — UI should recede.

## Two visual zones

| Zone | Surfaces | Palette | Vibe |
|------|----------|---------|------|
| **Editorial** (warm) | `/`, `/auth/*`, `/dashboard`, `/events/[id]`, `/view/[slug]`, `/g/[id]`, `/settings`, publish modal, email templates | cream surface, ink text, terra primary, gold secondary, blush soft | Print-invitation, celebratory, calm |
| **Workshop** (dark) | `/editor/[id]`, `/preview/[id]`, projection mode, any internal admin tooling | panel/panel-light surface, white text, accent purple, canvas grey | Tool-like, neutral, content-first |

Don't mix the two within a single page. The publish modal sits inside the editor but uses the editorial palette because it's user-facing share collateral.

## Colors

### Editorial palette (Tailwind tokens already wired)
- **`terra`** `#B85C37` — primary CTAs (`Approve`, `Share`, `Publish`), badges marking "live"/"new", host actions. Use sparingly: at most one terra fill per viewport.
- **`gold`** `#CFAC64` — dividers, frame borders on cards, eyebrow underlines, decorative rules. Often at 30–40% opacity (`gold/30`, `gold/40`).
- **`cream`** `#F6EBDD` — default page background for editorial surfaces.
- **`blush`** `#F9CDB5` — soft surface for reaction chips, secondary badges, very gentle highlights.
- **`ink`** `#1E130C` — all primary text. Body copy at full strength; secondary copy at `ink/60`; tertiary at `ink/40`.

### Workshop palette (editor)
- **`panel`** `#1e1e2e` — editor side panels, top bar, properties inspector.
- **`panel-light`** `#2a2a3d` — nested panels, hovered toolbar buttons, input backgrounds.
- **`accent`** `#7c3aed` — selection rings, active tool, focus outlines, resize handle border. Editor-only — **never** appears in editorial surfaces.
- **`canvas`** `#f3f4f6` — the working area behind the user's card.

### Semantic
- **Error** `#ffb4ab` — destructive confirmations, validation copy.
- **Live** `#6DBB7C` — Moments pulse dot ("● Live"). Reserved for live-feed indicators.
- White (`#ffffff`) — used for inset card surfaces inside cream pages and as text on terra fills.

### Contrast rules
- Body text: minimum 4.5:1. `ink` on `cream` and white-on-`terra` both pass.
- `ink/60` on `cream` is the lowest acceptable secondary text — do not go below.
- `ink/40` is for decorative labels and timestamps only, never for prose.

## Typography

- **Display / brand wordmark**: Georgia (or system serif fallback), semi-bold to bold, `letter-spacing: 0.02em`. Used for "Glimpse", event titles in cards, hero headlines on the landing page.
- **Body**: Inter / system-ui stack, 14–16px, weight 400.
- **Labels & eyebrows**: Inter, 10–12px, weight 600, **uppercase**, `letter-spacing: 0.20em–0.24em`. Used above section titles, on badges, and for "Save the date"-style overlines.
- **Numerals in mockups & QR-cell counts**: Inter, weight 600. Use `tabular-nums` if numbers are aligned in a column.

Don't mix more than two type families on a single page. Serif is reserved for the wordmark and event-card display copy — not body, not buttons.

## Components

### Buttons
- **Primary (editorial)**: `bg-terra text-white rounded-md px-4 py-2 font-semibold`. Hover: subtle darken (~10%). Used for the single most important action per view.
- **Secondary (editorial)**: `border border-ink/15 text-ink bg-transparent rounded-md`. Used for "Review", "Cancel", non-destructive alternates.
- **Ghost**: text-only, `text-ink/70 hover:text-ink`. Used for tertiary affordances ("Skip", "Maybe later").
- **Editor toolbar buttons**: square, `rounded-md`, `bg-panel-light` on hover, `accent` ring when active.
- **Destructive**: text colored `error` on transparent background; only switches to filled error background on the final confirm step.

### Inputs
- 1px border `border-ink/15`, background white inside cream pages and `panel-light` inside the editor.
- Focus: ring uses `accent` in editor, `terra` in editorial. Always visible — no `focus:outline-none` without a replacement.
- Labels above the input, never floating, in the label type style.

### Cards (UI surfaces, not the user's invitation card)
- Editorial cards: `bg-white border border-gold/40 rounded-lg shadow-xl shadow-ink/10`. No raised elevation beyond the soft ink-tinted shadow.
- Workshop cards: `bg-panel-light border border-white/5 rounded-md`. No shadow — depth comes from contrast against `panel`.
- Never combine warm and dark card styles in one view.

### Chips & badges
- Status: `rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide`.
- "Live" / "New": filled `terra` with white text.
- Soft counts: filled `blush` with ink text.
- Avoid full pills (`rounded-full`) for status — reserve pills for avatars and tag-style metadata.

### Dividers & rules
- Hairline `border-ink/10` for structural divisions inside editorial cards.
- Decorative gold rule: `h-px w-16 bg-gold` centered — used to separate names/titles in invitation-style layouts.

### Modals & sheets
- Backdrop: `bg-ink/40 backdrop-blur-sm`.
- Container: editorial style (`bg-cream` or `bg-white`) even when launched from the editor — modals are user-facing content.

## Iconography
- Stroke icons (Lucide / Heroicons outline) at 1.5px stroke. Filled icons only for status indicators.
- Icon size: 16px inline with body, 20px in toolbars, 24px on touch targets.
- Icon color follows surrounding text color — never introduce a new hue.

## Spacing & radii
- Spacing scale follows Tailwind defaults (4px increments). Section gaps on editorial pages: `gap-12` desktop / `gap-8` mobile.
- Radii: `sm 4px` (chips, tiny tags), `md 8px` (buttons, inputs, most cards), `lg 16px` (hero mockups, phone-frame mocks). **Don't mix `md` and `lg` corners on adjacent siblings.**

## Motion
- Hover transitions: 150ms ease-out, opacity & background only.
- Modal/sheet enter: 200ms ease-out, fade + 4px translate-y.
- Live-feed pulse: 2s ease-in-out infinite, opacity 0.6 → 1.
- No spring physics, no large parallax. Motion supports state changes; it doesn't decorate.

## Do's and Don'ts

**Do**
- Reserve `terra` for the single most important action on a screen.
- Pair `gold` borders with `cream`/white surfaces — they're a matched set.
- Use Georgia serif for the wordmark, event card titles, and editorial headlines only.
- Drop into the dark panel palette the moment the user crosses into the editor.
- Treat user-uploaded photos as the brightest element on the page — dim chrome, never compete.

**Don't**
- Don't introduce the editor's purple `accent` into any editorial surface.
- Don't mix `rounded-md` and `rounded-lg` on neighboring components in the same row.
- Don't use serif fonts in the editor chrome — serif is for user content and brand only.
- Don't add gradients beyond the existing terra→blush→cream warm gradient used in mockups.
- Don't ship a CTA without verifying it's the only `terra` fill in its viewport.
- Don't drop below `ink/60` for any text the user is meant to read.

## Reference: existing tokens
Tailwind tokens already configured at [apps/web/tailwind.config.js](apps/web/tailwind.config.js):
`canvas`, `panel`, `panel-light`, `accent`, `accent-hover`, `terra`, `ink`, `cream`, `gold`, `blush`.

CSS variables at [apps/web/src/app/globals.css](apps/web/src/app/globals.css):
`--canvas-bg`, `--panel-bg`, `--accent`.

When adding a new color, extend Tailwind config — don't inline hex values in components.
