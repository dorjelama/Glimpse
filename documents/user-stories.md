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
| H1 | Register and understand what Glimpse does | Login/register works. Empty dashboard shows "No events yet." | **No onboarding.** User doesn't know what an Event is, what a Card is, or what Moments is before they start. High first-session drop risk. |
| H2 | Create an event with a name and date | Modal asks for title only. Date is editable on the Event Hub but not prompted at creation. | **Date not surfaced at creation.** For event-specific products, date is critical context. Easily missed. |
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
- **H1 → H2** — User registers, sees empty state, doesn't understand what to create or why. Highest single point of abandonment.
- **H5 → H6** — Host sets up Moments, has a QR code, but doesn't know how to get it in front of guests. The product stops here; everything after depends on external effort by the host.

---

## Guest

| # | Story | Current state | Gap |
|---|-------|--------------|-----|
| G1 | Receive an invitation and view the card | Public `/view/[slug]` renders the card. No auth required. | Solid. |
| G2 | Discover that I can share a photo | Card has no link to Moments. QR is only at the venue. | **Card and Moments are disconnected.** Remote guests or guests who viewed the card digitally have no path to the upload page. |
| G3 | Open the upload page on my phone | `/g/[galleryId]` works, no auth, mobile-friendly shell. | Solid. |
| G4 | Enter my name and upload a photo quickly | Name field, photo picker (1–3 photos), caption, Post button. | **Name not persisted.** Close the tab, come back — name is gone. At a 200-person wedding, this friction compounds. |
| G5 | Upload a HEIC photo from my iPhone | HEIC is listed as accepted. | **HEIC likely fails server-side** without explicit Sharp/libvips configuration. iPhone users shooting in default format will hit silent failures. High surface area — iPhones are the majority device at events. |
| G6 | Know my photo was received | Thank-you screen: "Your moment is live — pending review." | Solid messaging. |
| G7 | See my photo appear on the feed | No link from the thank-you screen to the feed. | **Dead end after submission.** The social loop — "I posted, now I want to see it" — is broken. Guest disengages. |
| G8 | Upload again later | Guest can visit the upload page again, enters name again, creates a new submission. | **Multiple submissions per guest not handled.** No deduplication, no session persistence. A guest could post 5 times. Feed gets flooded. Host moderation burden increases. |
| G9 | Remove my photo if I change my mind | No self-serve deletion after finalise. | **No guest-side controls post-submission.** Minor for MVP but will come up at events. |

### Guest drop-off moments
- **G7** — Guest posts and hits a dead end. No feed link, no "see what others shared." The reason to stay engaged is gone.

---

## Viewer (Feed)

| # | Story | Current state | Gap |
|---|-------|--------------|-----|
| V1 | Open the feed on my phone and see live moments | `/g/[galleryId]/feed` renders approved posts, polls every 10s. | Solid. |
| V2 | See new photos appear without refreshing | New submissions get "New" badge after poll. | Solid. |
| V3 | Know the event is active or over | Open/Closed indicator in header. Post-event banner when `endedAt` is set. | Solid. |
| V4 | Navigate a feed with 100+ posts | Infinite scroll down the page. | **No pagination or lazy loading.** 100+ posts with images will be slow and memory-heavy on mobile. |
| V5 | React to a post | Nothing. | **No engagement mechanism.** Likes, emoji reactions, even a simple heart — absent. The feed is read-only. Viewing without interacting kills the social feeling. |
| V6 | See the feed on a projector at the venue | Regular mobile feed page. | **No Projection Mode** (documented as future). The feed isn't designed for a large screen. Small text, portrait layout, no auto-scroll. |
| V7 | Feel the feed is part of the event's identity | Generic dark header, amber accent. | **No brand continuity from the card.** The invitation card can be beautifully designed, but the feed has no connection to those colors, fonts, or style. |
| V8 | Find the upload page from the feed | No link. | **Feed doesn't link back to the upload page.** A viewer who hasn't uploaded has no CTA to do so. |

### Viewer drop-off moments
- **V5** — Viewer scrolls the feed once, has nothing to do, closes it. Repeat opens drop sharply because there's no interaction to pull them back.

---

## Priority gaps

| Priority | Gap | Story refs | Why it matters |
|----------|-----|-----------|----------------|
| 1 | No onboarding | H1 | First-session drop kills everything downstream |
| 2 | Card doesn't link to Moments | G2, V8 | Breaks the product loop — card → event → moments → feed |
| 3 | No notification during live event | H7, H8 | The product's peak value moment (live event) is unsupported |
| 4 | Feed dead-end after guest post | G7 | Kills re-engagement and the social loop |
| 5 | HEIC upload failure | G5 | Silent failure for majority of iPhone users — trust killer |
| 6 | No export notification | H10 | Low probability but catastrophic when it happens |
| 7 | No reactions on feed | V5 | Reduces feed stickiness significantly |
| 8 | Guest name not persisted | G4 | Friction at the upload moment, compounds at scale |
