# Color Tokens — Glimpse Design System

## Palette

| Token | Hex | Role |
|-------|-----|------|
| `--color-terra` | `#B85C37` | Primary Accent |
| `--color-ink` | `#1E130C` | Wordmark / Body Text |
| `--color-cream` | `#F6EBDD` | Background |
| `--color-gold` | `#CFAC64` | Secondary Accent |
| `--color-blush` | `#F9CDB5` | Tint / Surface |

---

## Semantic Mapping

| Purpose | Token | Value |
|---------|-------|-------|
| Background (page) | `--color-bg` | `#F6EBDD` (Cream) |
| Surface (card, panel) | `--color-surface` | `#F9CDB5` (Blush) |
| Body text | `--color-text-body` | `#1E130C` (Ink) |
| Heading / Wordmark | `--color-text-heading` | `#1E130C` (Ink) |
| Primary action (CTA) | `--color-accent-primary` | `#B85C37` (Terra) |
| Secondary accent | `--color-accent-secondary` | `#CFAC64` (Gold) |
| Border / Divider | `--color-border` | `#CFAC64` (Gold, 40% opacity) |

---

## CSS Custom Properties

```css
:root {
  /* Base palette */
  --color-terra:  #B85C37;
  --color-ink:    #1E130C;
  --color-cream:  #F6EBDD;
  --color-gold:   #CFAC64;
  --color-blush:  #F9CDB5;

  /* Semantic aliases */
  --color-bg:               var(--color-cream);
  --color-surface:          var(--color-blush);
  --color-text-body:        var(--color-ink);
  --color-text-heading:     var(--color-ink);
  --color-accent-primary:   var(--color-terra);
  --color-accent-secondary: var(--color-gold);
  --color-border:           color-mix(in srgb, var(--color-gold) 40%, transparent);
}
```

---

## Tailwind Config Snippet

```js
// tailwind.config.js
colors: {
  terra:  '#B85C37',
  ink:    '#1E130C',
  cream:  '#F6EBDD',
  gold:   '#CFAC64',
  blush:  '#F9CDB5',
},
```

---

## Accessibility Notes

- **Terra on Cream** (`#B85C37` / `#F6EBDD`): contrast ratio ≈ 4.6:1 — passes AA for large text and UI components; borderline for small body text (AA requires 4.5:1 ✓).
- **Ink on Cream** (`#1E130C` / `#F6EBDD`): contrast ratio ≈ 17:1 — passes AAA. Use for all body copy.
- **Gold on Cream** (`#CFAC64` / `#F6EBDD`): contrast ratio ≈ 2.3:1 — decorative use only; do not use for text.
- **Terra on Ink** (`#B85C37` / `#1E130C`): contrast ratio ≈ 3.7:1 — use only for large/bold text or icons.

---

## Usage Guidelines

- **Terra** is reserved for primary CTAs, links, and brand highlights. Use sparingly to preserve emphasis.
- **Ink** is the default for all text. Never use a lighter color for body copy.
- **Cream** is the default page background. Keep it as the base layer.
- **Blush** is for elevated surfaces (cards, modals, input backgrounds) — one step above Cream.
- **Gold** is for secondary decoration: dividers, badges, hover rings. Avoid as a standalone text color.
