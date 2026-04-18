# Glimpse — User Story Map
_Last updated: 2026-04-19_

---

## Personas

- **Host** — creates the event, builds the card, manages the Moments gallery, controls who sees what
- **Guest** — receives the invite link, views the card, uploads moments during the event
- **Viewer** — sees the public feed (could be the same guest, or a screen at the venue)

---

## Host

| # | Story | Current state | Gap |
|---|-------|--------------|-----|
| H1 | Register and understand what Glimpse does | Welcome modal fires on first login explaining Cards + Moments. Re-openable via `?` button. Enhanced empty state shows product preview tiles. | ✅ Resolved |
| H2 | Create an event with a name and date | Modal asks for title and date. Date is optional but surfaced upfront at creation and editable on the Event Hub. | ✅ Resolved |
| H3 | Build and publish an invitation card | Full canvas editor works. Publish generates a slug URL. | **No templates.** Blank canvas on first open is daunting. No starting point. |
| H4 | Share the card with guests | Published card has a URL. Publish modal shows it. | **No in-product sharing.** Host has to copy-paste the URL manually. No email, no WhatsApp share, no prominent copy button on the Event Hub. |
| H5 | Set up a Moments gallery | One click, gallery created, QR code shown immediately. | Solid. |
| H6 | Get the QR code to guests at the venue | "Download QR" exports SVG. | **No guidance on how to use it.** Hosts don't know to print it, put it on a projector slide, or embed it in signage. SVG is also an unusual format for non-technical users. |
| H7 | Know when guests are uploading during the event | Moderation page lists submissions. | **No notifications.** Host must be on the moderation page watching. If they're busy hosting, submissions pile up unseen. |
| H8 | Approve photos quickly on mobile | 3-column grid with approve button. | **Not mobile-optimized for live use.** Hover state for actions doesn't work on touch. Column grid requires scrolling. Bulk approve missing. |
| H9 | Control what's on the feed (open/close/end) | Pause + End event with confirm dialog. Three states implemented. | Solid. |
| H10 | Download photos after the event | 30-day export window + ZIP download in moderation page. | **No notification of the export window.** Host ends the event and may never return to the moderation page. 30 days pass, photos deleted, trust broken. |
| H11 | See event-level stats at a glance | Dashboard shows "Moments" chip on project card. | **No submission count, no pending count on dashboard.** During a live event, host can't see at a glance how many photos are waiting without going to moderation. |

### Host drop-off moments
- ~~**H1 → H2**~~ — ✅ Resolved. Welcome modal now explains both products before the user creates anything.
- ~~**H2**~~ — ✅ Resolved. Creation modal now surfaces date alongside title.
- **H5 → H6** — Host sets up Moments, has a QR code, but doesn't know how to get it in front of guests. The product stops here; everything after depends on external effort by the host.

---

## Guest

| # | Story | Current state | Gap |
|---|-------|--------------|-----|
| G1 | Receive an invitation and view the card | Public `/view/[slug]` renders the card. No auth required. | Solid. |
| G2 | Discover that I can share a photo | Published card shows a floating "Share a Moment" button linking to the upload page when a gallery exists. | ✅ Resolved |
| G3 | Open the upload page on my phone | `/g/[galleryId]` works, no auth, mobile-friendly shell. | Solid. |
| G4 | Enter my name and upload a photo quickly | Name field, photo picker (1–3 photos), caption, Post button. | **Name not persisted.** Close the tab, come back — name is gone. At a 200-person wedding, this friction compounds. |
| G5 | Upload a HEIC photo from my iPhone | HEIC is listed as accepted. | **HEIC likely fails server-side** without explicit Sharp/libvips configuration. iPhone users shooting in default format will hit silent failures. High surface area — iPhones are the majority device at events. |
| G6 | Know my photo was received | Thank-you screen: "Your moment is live — pending review." | Solid. |
| G7 | See my photo appear on the feed | Thank-you screen has a "See the live feed →" button linking to `/g/[galleryId]/feed`. | ✅ Resolved |
| G8 | Upload again later | Guest can visit the upload page again, enters name again, creates a new submission. | **Multiple submissions per guest not handled.** No deduplication, no session persistence. A guest could post 5 times. Feed gets flooded. Host moderation burden increases. |
| G9 | Remove my photo if I change my mind | No self-serve deletion after finalise. | **No guest-side controls post-submission.** Minor for MVP but will come up at events. |

### Guest drop-off moments
- ~~**G7**~~ — ✅ Resolved. "See the live feed →" closes the social loop after posting.

---

## Viewer (Feed)

| # | Story | Current state | Gap |
|---|-------|--------------|-----|
| V1 | Open the feed on my phone and see live moments | `/g/[galleryId]/feed` renders approved posts as a timeline with timestamps. Polls every 10s. Manual refresh button in header. | ✅ Enhanced — timeline layout with clock time + relative time per post. |
| V2 | See new photos appear without refreshing | New submissions get "New" badge after poll. Amber dot on timeline spine for fresh posts. | Solid. |
| V3 | Know the event is active or over | Open/Closed indicator in header. Post-event banner when `endedAt` is set. | Solid. |
| V4 | Navigate a feed with 100+ posts | Infinite scroll down the page. | **No pagination or lazy loading.** 100+ posts with images will be slow and memory-heavy on mobile. |
| V5 | React to a post | Nothing. | **No engagement mechanism.** Likes, emoji reactions, even a simple heart — absent. The feed is read-only. Viewing without interacting kills the social feeling. |
| V6 | See the feed on a projector at the venue | Regular mobile feed page. | **No Projection Mode** (documented as future). The feed isn't designed for a large screen. Small text, portrait layout, no auto-scroll. |
| V7 | Feel the feed is part of the event's identity | Generic dark header, amber accent. | **No brand continuity from the card.** The invitation card can be beautifully designed, but the feed has no connection to those colors, fonts, or style. |
| V8 | Find the upload page from the feed | Feed shows a "Share your moment" CTA when gallery is open, linking to `/g/[galleryId]`. | ✅ Resolved |

### Viewer drop-off moments
- **V5** — Viewer scrolls the feed once, has nothing to do, closes it. Repeat opens drop sharply because there's no interaction to pull them back.

---

## Priority gaps

| Priority | Gap | Story refs | Status |
|----------|-----|-----------|--------|
| ~~1~~ | ~~No onboarding~~ | H1 | ✅ Done |
| ~~2~~ | ~~Card doesn't link to Moments~~ | G2, V8 | ✅ Done |
| ~~4~~ | ~~Feed dead-end after guest post~~ | G7 | ✅ Done |
| 3 | No notification during live event | H7, H8 | Open |
| 5 | HEIC upload failure | G5 | Open |
| 6 | No export notification | H10 | Open |
| 7 | No reactions on feed | V5 | Open |
| 8 | Guest name not persisted | G4 | Open |
