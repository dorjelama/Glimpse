# Glimpse — User Story Map
_Last updated: 2026-04-25 — QR → feed-first entry; floating upload button; upload moved to /upload route; V4 lazy loading via cursor pagination; V9 PWA manifest + home screen shortcut; H7 host moderation real-time via SSE; H8 mobile moderation + bulk approve; H6 QR guidance (PNG + copy link + usage hint); G8 per-device submission cap (3)_

---

## Personas

- **Visitor** — lands on the public marketing page; has not yet registered; evaluating whether to sign up
- **Host** — creates the event, builds the card, manages the Glimpses gallery, controls who sees what
- **Guest** — receives the invite link, views the card, uploads glimpses during the event
- **Viewer** — sees the public feed (could be the same guest, or a screen at the venue)

---

## Visitor

| # | Story | Current state | Gap |
|---|-------|--------------|-----|
| P1 | Land on the site and immediately understand what Glimpse is | Landing page has a clear headline ("Create beautiful digital invitations"), subheadline, and two feature sections (Card Editor + Glimpses). | **No product screenshot or video.** Feature sections use placeholder boxes. A real screenshot would dramatically raise conversion. |
| P2 | See which features are free vs paid before signing up | Pricing section shows Free / Pro / Business tiers with feature lists. Glimpses is marked as Pro. | **No in-app upgrade path yet.** Free users hit an invisible wall — the product doesn't explain why Glimpses is locked or prompt an upgrade. |
| P3 | Sign up from the landing page | "Get started free" and "Start for free →" CTAs link to `/auth/register`. | Solid. |
| P4 | Return and sign in from the landing page | "Sign in" link in navbar → `/auth/login`. | Solid. |
| P5 | Understand the pricing before committing | Pricing section shows three tiers with feature lists. Pro is highlighted as most popular. | **No annual pricing option.** Monthly-only increases perceived cost. No FAQ or money-back language to reduce commitment anxiety. |
| P6 | Know the product is trustworthy | Beta pill badge in hero. "by Elegant Decorations" in footer. | **No social proof.** No testimonials, event counts, or real screenshots. Cold page with no signal that anyone else uses it. |

### Visitor drop-off moments
- **P1** — Visitor reads the headline but sees placeholder boxes instead of a real product. Exits before reaching pricing.
- **P2** — Visitor signs up expecting Glimpses, creates a card, then can't activate Glimpses with no upgrade path shown.

---

## Host

| # | Story | Current state | Gap |
|---|-------|--------------|-----|
| H1 | Register and understand what Glimpse does | Welcome modal fires on first login explaining Cards + Glimpses. Re-openable via `?` button. Enhanced empty state shows product preview tiles. | ✅ Resolved |
| H2 | Create an event with a name and date | Modal asks for title and date. Date is optional but surfaced upfront at creation and editable on the Event Hub. | ✅ Resolved |
| H3 | Build and publish an invitation card | Full canvas editor works. Publish generates a slug URL. Template picker modal on first open offers 4 starting layouts (Elegant Dark, Cream Classic, Modern Bold, Blush Soft) or blank canvas. | ✅ Resolved |
| H4 | Share the card with guests | Published card has a URL. Publish modal shows it. | **No in-product sharing.** Host has to copy-paste the URL manually. No email, no WhatsApp share, no prominent copy button on the Event Hub. |
| H5 | Set up a Glimpses gallery | One click, gallery created, QR code shown immediately. | Solid. |
| H6 | Get the QR code to guests at the venue | "↓ PNG" downloads a 464×464 white-padded PNG via canvas (universal format — works in presentations, print, WhatsApp). "Copy link" copies the feed URL to clipboard with a 2s "✓ Copied!" confirmation. Usage hint below the URL: "Print for tables · Share in group chat · Project on screen". | ✅ Resolved |
| H7 | Know when guests are uploading during the event | Moderation page subscribes to the public SSE stream. `finalise()` broadcasts `submission.new` (empty payload); panel refetches from the JWT-guarded `/manage` endpoint and updates pending list instantly. Guest self-deletes propagate via `submission.deleted`. Green "Live" dot in header confirms the connection is active. | ✅ Resolved |
| H8 | Approve photos quickly on mobile | Responsive card: row layout on mobile (80px thumbnail + name + Approve/✕ buttons, ~80px per row, 7–8 visible at once) switches to full card on `sm+`. Grid is `flex-col` on mobile, `sm:grid-cols-2 lg:grid-cols-3` on desktop. "Approve all N" bulk button in pending section header. Thumbnail strip hidden on mobile. | ✅ Resolved |
| H9 | Control what's on the feed (open/close/end) | Pause + End event with confirm dialog. Three states implemented. | Solid. |
| H10 | Download photos after the event | 30-day export window + ZIP download in moderation page. | **No notification of the export window.** Host ends the event and may never return to the moderation page. 30 days pass, photos deleted, trust broken. |
| H11 | See event-level stats at a glance | Dashboard project card shows "📸 X live" chip and amber "Y pending" chip. Stats fetched in parallel after project load. | ✅ Resolved |

### Host drop-off moments
- ~~**H1 → H2**~~ — ✅ Resolved. Welcome modal now explains both products before the user creates anything.
- ~~**H2**~~ — ✅ Resolved. Creation modal now surfaces date alongside title.
- ~~**H5 → H6**~~ — ✅ Resolved. PNG download + copy link + usage hint ("Print for tables · Share in group chat · Project on screen") close the guidance gap.

---

## Guest

| # | Story | Current state | Gap |
|---|-------|--------------|-----|
| G1 | Receive an invitation and view the card | Public `/view/[slug]` renders the card. No auth required. | Solid. |
| G2 | Discover that I can share a photo | Published card shows a floating "Share a Glimpse" button linking to the upload page when a gallery exists. | ✅ Resolved |
| G3 | Open the upload page on my phone | QR code now points to `/g/[galleryId]/feed` (feed-first). Old QR codes pointing to `/g/[galleryId]` redirect to feed automatically. Upload form lives at `/g/[galleryId]/upload`, reached via the floating "Share a Glimpse" button on the feed. No auth required on either route. | ✅ Resolved — social proof before upload intent. |
| G4 | Enter my name and upload a photo quickly | Name field, photo picker (1–3 photos), caption, Post button. Name saved to localStorage and restored on return. | ✅ Resolved |
| G5 | Upload a HEIC photo from my iPhone | HEIC/HEIF accepted and auto-converted to JPEG on the server via Sharp (libvips). | ✅ Resolved |
| G6 | Know my photo was received | Thank-you screen: "Your glimpse is live — pending review." | Solid. |
| G7 | See my photo appear on the feed | Thank-you screen has a "See the live feed →" button linking to `/g/[galleryId]/feed`. | ✅ Resolved |
| G8 | Upload again later | Upload page reads `glimpse-token-map:${galleryId}` from localStorage to count prior submissions. Cap is 3 per device per gallery. Under the cap: `DoneScreen` shows "Share another moment →" and mounts a fresh `MomentForm` via `key` increment. At the cap: a `LimitScreen` replaces the form with a link to the feed. Count is incremented in state on each `onDone()`. | ✅ Resolved |
| G9 | Remove my photo if I change my mind | Uploader can delete their own **pending** submission from the feed via a Delete button (token-authenticated, no login needed). Removal propagates via SSE to all viewers instantly. | **Partially resolved.** Approved submissions cannot be self-deleted — that remains host-only. Pending deletion also only works on the same device/browser (token stored in localStorage; clearing storage or switching device loses the ability). |
| G10 | Know how my photo may be used | No consent mechanism exists. Guests upload with no terms shown and no indication of how their images may be shared or used. | **No photo usage consent at upload.** No consent checkbox, no terms copy, no consent record stored. Platform has no proof of permission. Potential right-of-publicity and GDPR exposure depending on jurisdiction. Applies to both the guest (informed choice) and the host (legal cover). |

### Guest drop-off moments
- ~~**G7**~~ — ✅ Resolved. "See the live feed →" closes the social loop after posting.
- **G9** — Partial. Guest can delete their own pending post but loses that ability on a different device or after clearing storage.
- **G10** — Open. Guests upload with no awareness of how images are used. No consent record means the host has no legal cover if a guest objects later.

---

## Viewer (Feed)

| # | Story | Current state | Gap |
|---|-------|--------------|-----|
| V1 | Open the feed on my phone and see live glimpses | `/g/[galleryId]/feed` renders approved posts as a timeline. Initial fetch + live SSE stream over `/gallery/:id/feed/stream`. Manual refresh button in header. | ✅ Resolved — timeline + real-time. |
| V2 | See new photos appear without refreshing | SSE pushes `submission.approved` / `submission.deleted` / `reaction.changed` events (~1s latency). "New" badge + amber spine dot for fresh posts. Falls back to 30s polling if SSE fails 3× or unavailable. | ✅ Resolved |
| V3 | Know the event is active or over | Open/Closed indicator in header. Post-event banner when `endedAt` is set. `setGalleryOpen()` and `endGallery()` now publish `gallery.updated` via SSE; feed page handles it by patching `data.gallery` in place — status dot, banner, floating upload button, and bottom padding all update within ~1s of host action, no refresh needed. | ✅ Resolved |
| V4 | Navigate a feed with 100+ posts | Cursor-based pagination: initial load fetches 20 posts, IntersectionObserver sentinel 300px above the fold triggers `loadMore` automatically as the user scrolls. Backend accepts `?cursor=<id>&limit=N` (capped at 50). Overfetch-by-1 technique detects `hasMore`. Own pending submissions always included on the first page only. Polling fallback prepends new items without losing paginated state. | ✅ Resolved |
| V5 | React to a post | Reaction bar with 6 emojis (❤️ 🎉 😂 😮 👏 🥰). Counts synced across devices via DB + SSE broadcast. Per-device state via persistent session ID. Optimistic UI, server-reconciled. Counts aggregated in SQL (`groupBy`), `sessionId` indexed. Rate-limited 30/min per session+IP. | ✅ Resolved |
| V6 | See the feed on a projector at the venue | Regular mobile feed page. | **No Projection Mode** (documented as future). The feed isn't designed for a large screen. Small text, portrait layout, no auto-scroll. |
| V7 | Feel the feed is part of the event's identity | Generic dark header, amber accent. | **No brand continuity from the card.** The invitation card can be beautifully designed, but the feed has no connection to those colors, fonts, or style. |
| V8 | Find the upload page from the feed | Feed shows a sticky floating "Share a Glimpse" button (fixed bottom, pill style, hidden when gallery is closed or ended) linking to `/g/[galleryId]/upload`. Content area adds `pb-24` so the last card isn't obscured by the button. | ✅ Resolved |
| V9 | Open the feed directly from my phone's home screen | Dynamic Web App Manifest served from `/g/[galleryId]/pwa-manifest` — fetches the event title from the API and returns a per-gallery manifest (`name`, `start_url: /g/[id]/feed`, `display: standalone`, terra theme color). Gallery layout (`layout.tsx`) injects `<link rel="manifest">`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`, `<link rel="apple-touch-icon">`, and theme-color viewport tag. Icon: `public/icon.png` (584×584, copied from existing brand asset). Manifest cached 5 min via `next: { revalidate: 300 }`. | ✅ Resolved |

### Viewer drop-off moments
- **V5** — Viewer scrolls the feed once, has nothing to do, closes it. Repeat opens drop sharply because there's no interaction to pull them back.
- ~~**V9**~~ — ✅ Resolved. PWA manifest + Apple meta tags let guests add the feed to their home screen.

---

## Priority gaps

### Open

| Priority | Gap | Story refs | Notes |
|----------|-----|-----------|-------|
| 1 | No photo usage consent at upload | G10 | No consent checkbox, no terms, no stored record. Legal exposure for host and platform. |
| 2 | No in-product card sharing | H4 | Host must copy-paste URL manually. |
| 3 | No export notification after event ends | H10 | 30-day window passes silently; photos deleted without warning. |
| 4 | No product screenshot or video on landing page | P1 | Placeholder boxes instead of real UI. |
| 5 | No in-app upgrade path for Glimpses | P2 | Free users hit a wall with no prompt. |
| 6 | Guest pending deletion device-bound | G9 | Token in localStorage; switching device loses the delete option. |


## Enhancements
- Feedback feature from host
- S3 CDN
- Separate guest module.
- After event solutions
- Landing page improvements
- Email, Image, Hosting and Domains
- QR Design with texts and branding
- Update github readme file to describe project