# Glimpse — User Story Map
_Last updated: 2026-04-21 — G9 partial resolution; H7/G8 gaps tightened; V9 added_

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
| H6 | Get the QR code to guests at the venue | "Download QR" exports SVG. | **No guidance on how to use it.** Hosts don't know to print it, put it on a projector slide, or embed it in signage. SVG is also an unusual format for non-technical users. |
| H7 | Know when guests are uploading during the event | Moderation page lists submissions. Bell icon on Event Hub shows pending approval count, refreshed on page load. | **Host moderation is still pull-based.** The public feed is now real-time (SSE), but the host moderation panel has no live updates — new pending submissions require a manual page refresh. Asymmetry: guests see approvals in ~1s; hosts see new uploads only when they reload. |
| H8 | Approve photos quickly on mobile | 3-column grid with approve button. | **Not mobile-optimized for live use.** Hover state for actions doesn't work on touch. Column grid requires scrolling. Bulk approve missing. |
| H9 | Control what's on the feed (open/close/end) | Pause + End event with confirm dialog. Three states implemented. | Solid. |
| H10 | Download photos after the event | 30-day export window + ZIP download in moderation page. | **No notification of the export window.** Host ends the event and may never return to the moderation page. 30 days pass, photos deleted, trust broken. |
| H11 | See event-level stats at a glance | Dashboard project card shows "📸 X live" chip and amber "Y pending" chip. Stats fetched in parallel after project load. | ✅ Resolved |

### Host drop-off moments
- ~~**H1 → H2**~~ — ✅ Resolved. Welcome modal now explains both products before the user creates anything.
- ~~**H2**~~ — ✅ Resolved. Creation modal now surfaces date alongside title.
- **H5 → H6** — Host sets up Glimpses, has a QR code, but doesn't know how to get it in front of guests. The product stops here; everything after depends on external effort by the host.

---

## Guest

| # | Story | Current state | Gap |
|---|-------|--------------|-----|
| G1 | Receive an invitation and view the card | Public `/view/[slug]` renders the card. No auth required. | Solid. |
| G2 | Discover that I can share a photo | Published card shows a floating "Share a Glimpse" button linking to the upload page when a gallery exists. | ✅ Resolved |
| G3 | Open the upload page on my phone | `/g/[galleryId]` works, no auth, mobile-friendly shell. | Solid. |
| G4 | Enter my name and upload a photo quickly | Name field, photo picker (1–3 photos), caption, Post button. Name saved to localStorage and restored on return. | ✅ Resolved |
| G5 | Upload a HEIC photo from my iPhone | HEIC/HEIF accepted and auto-converted to JPEG on the server via Sharp (libvips). | ✅ Resolved |
| G6 | Know my photo was received | Thank-you screen: "Your glimpse is live — pending review." | Solid. |
| G7 | See my photo appear on the feed | Thank-you screen has a "See the live feed →" button linking to `/g/[galleryId]/feed`. | ✅ Resolved |
| G8 | Upload again later | Guest can visit the upload page again, enters name again, creates a new submission. | **Multiple submissions per guest not handled.** No deduplication, no session persistence. A guest could post 5 times. With pending visibility now live, the uploader sees all 5 pending cards on the feed — amplifying the clutter and making the gap more visible. |
| G9 | Remove my photo if I change my mind | Uploader can delete their own **pending** submission from the feed via a Delete button (token-authenticated, no login needed). Removal propagates via SSE to all viewers instantly. | **Partially resolved.** Approved submissions cannot be self-deleted — that remains host-only. Pending deletion also only works on the same device/browser (token stored in localStorage; clearing storage or switching device loses the ability). |

### Guest drop-off moments
- ~~**G7**~~ — ✅ Resolved. "See the live feed →" closes the social loop after posting.
- **G9** — Partial. Guest can delete their own pending post but loses that ability on a different device or after clearing storage.

---

## Viewer (Feed)

| # | Story | Current state | Gap |
|---|-------|--------------|-----|
| V1 | Open the feed on my phone and see live glimpses | `/g/[galleryId]/feed` renders approved posts as a timeline. Initial fetch + live SSE stream over `/gallery/:id/feed/stream`. Manual refresh button in header. | ✅ Resolved — timeline + real-time. |
| V2 | See new photos appear without refreshing | SSE pushes `submission.approved` / `submission.deleted` / `reaction.changed` events (~1s latency). "New" badge + amber spine dot for fresh posts. Falls back to 30s polling if SSE fails 3× or unavailable. | ✅ Resolved |
| V3 | Know the event is active or over | Open/Closed indicator in header. Post-event banner when `endedAt` is set. | Solid. |
| V4 | Navigate a feed with 100+ posts | Infinite scroll down the page. | **No pagination or lazy loading.** 100+ posts with images will be slow and memory-heavy on mobile. |
| V5 | React to a post | Reaction bar with 6 emojis (❤️ 🎉 😂 😮 👏 🥰). Counts synced across devices via DB + SSE broadcast. Per-device state via persistent session ID. Optimistic UI, server-reconciled. Counts aggregated in SQL (`groupBy`), `sessionId` indexed. Rate-limited 30/min per session+IP. | ✅ Resolved |
| V6 | See the feed on a projector at the venue | Regular mobile feed page. | **No Projection Mode** (documented as future). The feed isn't designed for a large screen. Small text, portrait layout, no auto-scroll. |
| V7 | Feel the feed is part of the event's identity | Generic dark header, amber accent. | **No brand continuity from the card.** The invitation card can be beautifully designed, but the feed has no connection to those colors, fonts, or style. |
| V8 | Find the upload page from the feed | Feed shows a "Share your glimpse" CTA when gallery is open, linking to `/g/[galleryId]`. | ✅ Resolved |
| V9 | Open the feed directly from my phone's home screen | No PWA manifest or install prompt exists. | **No home screen shortcut.** Guests and viewers who want quick access during the event have to open the browser and navigate manually every time. A Web App Manifest + `<meta name="apple-mobile-web-app-capable">` would let iOS and Android users add the feed to their home screen as an icon. Low effort, high friction reduction at live events. |

### Viewer drop-off moments
- **V5** — Viewer scrolls the feed once, has nothing to do, closes it. Repeat opens drop sharply because there's no interaction to pull them back.
- **V9** — Guests who bookmark the feed page still have to open a browser tab; no home screen icon means extra friction at a live event where phones are busy.

---

## Priority gaps

| Priority | Gap | Story refs | Status |
|----------|-----|-----------|--------|
| 1 | Host moderation is still pull-based despite public feed being real-time | H7 | Open — new pending submissions don't appear in the moderation panel without a reload. |
| 2 | Moderation page not usable on mobile | H8 | Open — grid + hover actions still desktop-only, no bulk approve. |
| 3 | Multiple submissions per guest not handled | G8 | Open — amplified now that pending posts are visible on the uploader's feed. |
| 4 | No in-product card sharing | H4 | Open — host must copy-paste URL manually. |
| 5 | No export notification after event ends | H10 | Open — 30-day window passes silently; photos deleted without warning. |
| 6 | No product screenshot or video on landing page | P1 | Open — placeholder boxes instead of real UI. |
| 7 | No in-app upgrade path for Glimpses | P2 | Open — free users hit a wall with no prompt. |
| 8 | No QR code guidance for hosts | H6 | Open — SVG format, no usage instructions. |
| 9 | No pagination / lazy loading on feed | V4 | Open — 100+ posts will be slow on mobile. |
| 10 | No home screen shortcut for feed | V9 | Open — no PWA manifest; high friction at live events. |
| 11 | Guest pending deletion device-bound | G9 | Partial — token in localStorage; switching device loses the delete option. |

## Enhancements
- Feedback feature from host and viewer
- S3 CDN
- Seperate guest module.