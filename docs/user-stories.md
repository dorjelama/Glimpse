# Glimpse — User Story Map
_Last updated: 2026-05-01 — A1–A4 admin pricing stories added; S1–S9 subscription stories added; G11 email invitation receive; G10 consent; H10 export download resolved via H13; H6 QR guidance; G8 submission cap; V4 pagination; V9 PWA; H7 real-time moderation; H8 mobile moderation; H4 card sharing; V3 real-time status; H13 export reminder cron; H14 final gallery page; V10 feed post-event CTA; H12 post-event summary; H15–H20 + G12 guest list module_

---

## Personas

- **Visitor** — lands on the public marketing page; has not yet registered; evaluating whether to sign up
- **Host** — creates the event, builds the card, manages the Glimpses gallery, controls who sees what
- **Guest** — receives the invite link, views the card, uploads glimpses during the event
- **Viewer** — sees the public feed (could be the same guest, or a screen at the venue)
- **Admin** — internal operator; manages platform configuration, users, and business settings via `/admin`

---

## Visitor

| # | Story | Current state | Gap |
|---|-------|--------------|-----|
| P1 | Land on the site and immediately understand what Glimpse is | Landing page has a clear headline ("Create beautiful digital invitations"), subheadline, and two feature sections (Card Editor + Glimpses). | **No product screenshot or video.** Feature sections use placeholder boxes. A real screenshot would dramatically raise conversion. |
| P2 | See which features are free vs paid before signing up | Pricing section shows Free / Pro / Business tiers with feature lists. Glimpses is marked as Pro. | **No in-app upgrade path yet.** Free users hit an invisible wall — the product doesn't explain why Glimpses is locked or prompt an upgrade. See S2, S3, S8 for the in-app resolution path. |
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
| H4 | Share the card with guests | "Share" button on the Card tile (visible when published) opens a modal: comma/newline-separated email input, optional personal message, "Send invitations" CTA. Backend `POST /publish/:id/share` validates ownership + published status, then sends via AWS SES. HTML email includes: invitation header, card CTA button, live feed link, iOS and Android home-screen tutorial (step-by-step). Dev mode: SES credentials absent → emails logged to console, no send. | ✅ Resolved |
| H5 | Set up a Glimpses gallery | One click, gallery created, QR code shown immediately. | Solid. |
| H6 | Get the QR code to guests at the venue | "↓ PNG" downloads a 464×464 white-padded PNG via canvas (universal format — works in presentations, print, WhatsApp). "Copy link" copies the feed URL to clipboard with a 2s "✓ Copied!" confirmation. Usage hint below the URL: "Print for tables · Share in group chat · Project on screen". | ✅ Resolved |
| H7 | Know when guests are uploading during the event | Moderation page subscribes to the public SSE stream. `finalise()` broadcasts `submission.new` (empty payload); panel refetches from the JWT-guarded `/manage` endpoint and updates pending list instantly. Guest self-deletes propagate via `submission.deleted`. Green "Live" dot in header confirms the connection is active. | ✅ Resolved |
| H8 | Approve photos quickly on mobile | Responsive card: row layout on mobile (80px thumbnail + name + Approve/✕ buttons, ~80px per row, 7–8 visible at once) switches to full card on `sm+`. Grid is `flex-col` on mobile, `sm:grid-cols-2 lg:grid-cols-3` on desktop. "Approve all N" bulk button in pending section header. Thumbnail strip hidden on mobile. | ✅ Resolved |
| H9 | Control what's on the feed (open/close/end) | Pause + End event with confirm dialog. Three states implemented. | Solid. |
| H10 | Download photos after the event | 30-day export window + ZIP download in moderation page. Reminder emails sent automatically by `ReminderService` (H13) — 7-day warning at day 23, 24-hour warning at day 29. | ✅ Resolved via H13 |
| H11 | See event-level stats at a glance | Dashboard project card shows "📸 X live" chip and amber "Y pending" chip. Stats fetched in parallel after project load. | ✅ Resolved |
| H12 | See a post-event summary | Summary section appears above the export banners when the event has ended. Three stat tiles: total submitted, approved, unique guests. "Most loved" tile shows the top-reacted submission's thumbnail, guest name, caption, and total reaction count. Data from `GET /gallery/:id/summary` (JWT-guarded): uses Prisma `groupBy` on `SubmissionReaction` to find the top submission in one query. Loaded in parallel with `listSubmissions` on mount. | ✅ Resolved |
| H13 | Get a reminder before my photos are deleted | `ReminderService` runs a daily cron (`EVERY_DAY_AT_9AM`). Queries all ended galleries still within their 30-day window. Sends a 7-day warning when `daysElapsed >= 23` and `reminder7DaySentAt IS NULL`; sends a 24-hour warning when `daysElapsed >= 29` and `reminder24HrSentAt IS NULL`. Both flags persisted on `Gallery` to prevent duplicates. `MailService.sendExportReminder()` sends via SES in prod; logs to console in dev (no credentials). Migration `20260425000000_add_gallery_reminder_tracking` adds `reminder7DaySentAt` and `reminder24HrSentAt` nullable columns. | ✅ Resolved |
| H14 | Share a curated final gallery with guests | New `/g/[galleryId]/gallery` page: columns-2 masonry grid of all approved photos with caption overlay on hover. Header shows event title + ended date. Footer watermark "Powered by Glimpse · Create your own event →" links to `/`. Expired after `endedAt + 30 days` — shows "archive window closed" message. Moderation page post-event section adds a "Share the final gallery" banner with a "Copy link" button (2s confirmation). | ✅ Resolved |
| H15 | Manage my guest list outside the card editor, in its own dedicated space | Standalone `/events/[id]/guests` page extracted from the editor sidebar. Accessible via a **Guests** tile on the Event Hub. Tile shows live guest count fetched on load. | ✅ Resolved |
| H16 | Add a named guest (and optionally their email) to generate a personalised invite link | Add-guest form at the top of the Guests page: name field (required), email field (optional), Enter key or "Add Guest" button. Guest appears in the table immediately. | ✅ Resolved |
| H17 | Copy a unique shareable link for each guest so I can send it via WhatsApp, SMS, or DM | "Copy link" button on every guest row. Constructs `{origin}/view/{slug}?g={token}`. Shows "✓ Copied" for 2 s. Disabled (greyed out, cursor-not-allowed, tooltip) when the card is not yet published. | ✅ Resolved |
| H18 | Fix a guest's name or email without deleting and re-adding them | Inline edit: click any name or email cell → input appears with the current value; blur or Enter saves via `PATCH /events/:eventId/guests/:guestId`; Escape cancels. No-op if unchanged or name is blank. | ✅ Resolved |
| H19 | Remove a guest who is no longer attending | ✕ delete button on every row. Removes via `DELETE /events/:eventId/guests/:guestId` and filters local state immediately. | ✅ Resolved |
| H20 | See at a glance how many guests I've added without opening the guest page | Guests tile on the Event Hub calls `api.listGuests(card.id)` on mount and shows the count as a large number + "N guests" label. Updates each time the hub loads. | ✅ Resolved |

### Host drop-off moments
- ~~**H1 → H2**~~ — ✅ Resolved. Welcome modal now explains both products before the user creates anything.
- ~~**H2**~~ — ✅ Resolved. Creation modal now surfaces date alongside title.
- ~~**H5 → H6**~~ — ✅ Resolved. PNG download + copy link + usage hint ("Print for tables · Share in group chat · Project on screen") close the guidance gap.
- ~~**H10 → H13**~~ — ✅ Resolved. `ReminderService` daily cron sends 7-day (day 23) and 24-hour (day 29) warning emails. H10's export download feature was already solid; the notification gap is now closed.
- ~~**H14**~~ — ✅ Resolved. Final gallery page at `/g/[galleryId]/gallery` + "Share the final gallery" copy-link button in the moderation page.
- ~~**H15–H20**~~ — ✅ Resolved. Guest list extracted from the editor sidebar into a standalone `/events/[id]/guests` page with full CRUD (add, inline edit, delete) and per-row copy-link action. Guests tile added to the Event Hub with live count.

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
| G10 | Know how my photo may be used | Consent checkbox above the Post button: "I consent to my photos being displayed on the event feed and shared with guests by the host." Custom amber checkbox, `canPost` blocks submission until checked. `finalise()` API requires `consent: true` — server throws 400 if missing. Schema stores `consentGiven Boolean` + `consentAt DateTime?` on `GallerySubmission` (migration: `add_consent_to_submissions`). | ✅ Resolved |
| G11 | Receive the invitation by email | Host sends invitations via H4 share modal → SES → guest receives a Glimpse-themed HTML email: event title header, "View Invitation" CTA button (card URL), "View Live Feed" link, and a step-by-step iOS/Android home-screen tutorial ("tap Share → Add to Home Screen" / "tap ⋮ → Add to Home Screen"). Dev mode: email logged to console, not sent. | ✅ Resolved |
| G12 | Open my personalised link and see the invitation addressed to me | Host sends `{origin}/view/{slug}?g={token}` (copied from the Guests page). `PublicViewClient` extracts `?g=` and calls `GET /guests/token/:token` (public, no auth). Resolved `{ name, eventId }` is passed as `guestName` prop to `PreviewLayout` → `PreviewCanvas` → `GuestNameElement`, which renders the actual name in place of the `{{Guest Name}}` placeholder. Silent no-op if token is invalid or absent — card still renders, name cell is empty. | ✅ Resolved |

### Guest drop-off moments
- ~~**G7**~~ — ✅ Resolved. "See the live feed →" closes the social loop after posting.
- **G9** — Partial. Guest can delete their own pending post but loses that ability on a different device or after clearing storage.
- ~~**G10**~~ — ✅ Resolved. Consent checkbox required before posting; `consentGiven` + `consentAt` stored on the submission for audit trail.

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
| V10 | Return to the event memories after it ends | Feed's post-event banner now shows a "View final gallery →" link alongside the ended date, pointing to `/g/[galleryId]/gallery`. The gallery page shows all approved photos in a masonry grid with caption overlays and a Glimpse acquisition watermark in the footer. | ✅ Resolved |

### Viewer drop-off moments
- **V5** — Viewer scrolls the feed once, has nothing to do, closes it. Repeat opens drop sharply because there's no interaction to pull them back.
- ~~**V9**~~ — ✅ Resolved. PWA manifest + Apple meta tags let guests add the feed to their home screen.
- ~~**V10**~~ — ✅ Resolved. Feed post-event banner now links to the final gallery page.

---

## Subscription

_Tiers: **Free** (card editor, 1 active event, no Glimpses) / **Pro** (~$15/mo, Glimpses enabled, 30-day export) / **Business** (~$49/mo, multiple concurrent galleries, 60-day export). The card editor is the acquisition hook; Glimpses is the paid activation._

| # | Story | Current state | Gap |
|---|-------|--------------|-----|
| S1 | See my current plan, limits, and renewal date at a glance | No billing or account settings page exists. Plan is never surfaced inside the product after signup. | **No plan visibility.** Host has no way to know they're on Free, when Pro renews, or how close they are to any limit. Erodes trust; increases churn. |
| S2 | Be clearly gated — not silently blocked — when I try to enable Glimpses on Free | Behavior undefined. Free hosts attempting to enable Glimpses may receive an error or silent failure. | **No upgrade gate.** When built, the gate modal must show concrete value (a real feed screenshot or demo link, not a generic feature list) — a weak gate is worse than no gate. References S8 for trial CTA. |
| S3 | Complete an upgrade to Pro (payment flow) | No Stripe integration. Pro is defined in landing-page copy but is not purchasable anywhere. | **No revenue path.** This is the single highest-priority subscription gap — no checkout means no revenue regardless of all other work. |
| S4 | Manage my subscription (view, cancel, update card) | No billing management. Cancellation requires contacting support. | **Support burden.** Hosts who want to cancel have no self-serve path. Stripe Customer Portal resolves this with minimal code. |
| S5 | Keep my data when I downgrade or cancel | No downgrade policy. No schema flags for plan-lapsed state. | **Schema decision required before Stripe webhooks are wired.** Must decide: soft-deactivate galleries (`isActive` flag — can view, can't create new) or hard-lock. Retrofitting after Stripe is live is risky. |
| S6 | Receive an invoice by email after each billing cycle | Not configured. | **Low effort.** Stripe Customer Portal + billing email settings handle this natively — no custom code needed. |
| S7 | Access Business-tier features (multiple concurrent galleries, 60-day export) | No gallery count limit enforced. Any user can currently create unlimited galleries — unintended free access to a Business feature. | **No plan enforcement.** Gallery creation must be gated by plan tier. Business tier not yet purchasable. |
| S8 | Try Glimpses before I pay (14-day Pro trial or guided demo) | No trial. Free hosts hit the S2 gate with no prior felt value. | **Highest conversion-leverage gap.** A cold gate without a trial converts poorly. A 14-day trial (or a single explorable demo gallery) dramatically increases upgrade rate. Gate and trial should ship as a pair. |
| S9 | See an upgrade nudge while I'm building my card (not just at the gate) | No in-editor teaser. Free hosts building cards may never discover Glimpses as a companion feature. | **Missed conversion moment.** The Glimpses tab or section in the card editor should show a "Glimpses ✨ Pro" badge with a soft "Learn more →" that opens the S2 gate. Catches the curious user; the gate catches the motivated one. |

### Subscription drop-off moments
- **S2 + S8** — Free host clicks "Enable Glimpses", hits a cold gate with no trial and no felt value. Modal closes. No upgrade.
- **S3** — Host is ready to pay but there is no checkout flow. They email support or churn.
- **S9** — Free host builds a card, publishes it, never discovers Glimpses exists. Leaves money on the table permanently.
- **S5** — Pro host cancels. Data fate is unclear. They export everything out of panic and don't return.

---

## Admin

_Admin users (role `ADMIN`) manage the platform via `/admin`. Pricing config is stored in the database so prices can be updated without a code deployment._

| # | Story | Current state | Gap |
|---|-------|--------------|-----|
| A1 | Set Pro and Business subscription prices from the admin panel | `PricingConfig` singleton table (`id=1`, `proMonthly`, `businessMonthly`, `currency`, `updatedAt`) seeded with defaults via migration `20260501000000_add_pricing_config`. `PricingService.get()` lazily creates the row on first read. `PATCH /admin/pricing` (JWT + AdminGuard) validates whole-integer non-negative amounts ≤ 100,000. `/admin/pricing` settings page: form with currency dropdown + Pro/Business amount inputs, save button (disabled until dirty), inline ✓ Saved toast, last-updated timestamp. Pricing nav link added to admin sidebar. | ✅ Resolved |
| A2 | Set the display currency for all pricing surfaces | Currency stored on `PricingConfig` row; whitelist of 7 codes (USD, NPR, EUR, GBP, INR, AUD, CAD) enforced server-side. Admin pricing page renders the chosen symbol live next to both inputs. Landing page maps the code to a symbol (`$`, `Rs.`, `€`, `£`, `₹`, `A$`, `C$`) and falls back to the code itself if unknown. | ✅ Resolved |
| A3 | See price changes reflected on the landing page immediately after saving | Landing page is now an `async` Server Component; `fetchPricing()` calls `GET /admin/pricing` with `next: { revalidate: 60 }`. Static "Pricing is being finalized" copy replaced with three-tier card layout (Free / Pro / Business) showing live amounts and currency symbol. Fallback panel renders if the API is unreachable. | ✅ Resolved |
| A4 | Manage platform users — view, search, promote to admin, delete | Basic user table exists at `/admin/users` showing all registered accounts. | Solid for read. **No inline edit of plan tier** — once Stripe is integrated (S3), admin should be able to manually override a user's plan (e.g. comps, refunds, support cases) without touching the DB directly. |

### Admin notes
- `GET /admin/pricing` should be **public** (no auth) so the landing page and upgrade gate modal can fetch current prices without a user session.
- `PATCH /admin/pricing` is **admin-only** (`JwtAuthGuard` + role check).
- The terms page (`/terms`) references specific prices — once pricing is dynamic, remove hardcoded amounts from legal text to avoid auto-updating legal language.
- A1 and A2 are a natural paired sprint with S3 (Stripe checkout) — prices must be readable from the DB before the checkout session is created.

---

## Priority gaps

### Open

| Priority | Gap | Story refs | Notes |
|----------|-----|-----------|-------|
| 1 | No Stripe checkout — Pro tier not purchasable | S3 | No revenue path. Pricing config (A1) is in place; Stripe can now read live amounts from `GET /admin/pricing`. |
| 2 | No upgrade gate when Free host tries to enable Glimpses | S2 | Gate modal must show a real screenshot or demo — a weak gate is worse than none. Pair with S8 (trial). |
| 3 | No trial or preview of Glimpses before paywall | S8 | Cold gate without felt value converts poorly. 14-day trial or demo gallery dramatically increases upgrade rate. |
| 4 | No billing or plan visibility in the product | S1 | Hosts don't know their plan, limits, or renewal date. Erodes trust; accelerates churn. |
| 5 | No product screenshot or video on landing page | P1 | Placeholder boxes instead of real UI; hurts top-of-funnel conversion. |
| 6 | No in-editor Glimpses upgrade nudge | S9 | Curious users building cards never discover Glimpses exists. Grayed tab + "Pro" badge + "Learn more →" captures them. |
| 7 | No self-serve billing management | S4 | Cancellation requires contacting support. Stripe Customer Portal resolves with minimal code. |
| 8 | Downgrade data policy undefined (schema gap) | S5 | Must decide soft-deactivate vs hard-lock before Stripe webhooks are wired. Risk of retrofitting under pressure. |
| 9 | Guest pending deletion device-bound | G9 | Token in localStorage; switching device loses the delete option. |
| 10 | Admin override of user plan tier | A4 | Once Stripe is integrated, admin should be able to manually set a user's plan from the users table (comps, refunds, support cases). |

### Resolved

| Gap | Story refs | Resolution |
|-----|-----------|------------|
| No email invitation for guests | G11 | Host share modal → `POST /publish/:id/share` → SES HTML email with card CTA, feed link, iOS/Android home-screen tutorial. Dev: console fallback. |
| No photo usage consent at upload | G10 | Consent checkbox required before posting; `consentGiven` + `consentAt` stored on submission. |
| No pagination / lazy loading on feed | V4 | Cursor pagination + IntersectionObserver auto-load (20/page, capped at 50). |
| No home screen shortcut for feed | V9 | Dynamic per-gallery PWA manifest + Apple meta tags; icon from existing brand asset. |
| Upload page as QR landing (no social proof) | G3 | QR now points to live feed; upload reachable via floating button; old QR codes auto-redirect. |
| Host moderation pull-based | H7 | `finalise()` broadcasts `submission.new` via SSE; moderation panel refetches pending list instantly. |
| Moderation page not usable on mobile | H8 | Row layout on mobile (~80px/row). Bulk approve all pending. Responsive grid. |
| No QR code guidance for hosts | H6 | PNG download (branded canvas card), copy link, usage hint. |
| No in-product card sharing | H4 | "Share" button on Card tile → email modal → SES send. HTML email includes card link, feed link, iOS/Android home-screen tutorial. Dev: console fallback. |
| No export-expiry notification; host never returns to download | H10, H13 | `ReminderService` daily cron at 9 AM. 7-day warning at day 23; 24-hour warning at day 29. Flags `reminder7DaySentAt` / `reminder24HrSentAt` on Gallery prevent duplicates. `MailService.sendExportReminder()` — SES in prod, console in dev. |
| No final gallery share link | H14, V10 | `/g/[galleryId]/gallery` — masonry grid, caption overlays, expired-window check, Glimpse watermark footer. Moderation page adds "Share the final gallery" banner with copy-link button. Feed post-event banner adds "View final gallery →" CTA. |
| Guest management buried inside card editor | H15–H20, G12 | Extracted from editor sidebar into standalone `/events/[id]/guests` page. Full CRUD table (add, inline edit name/email, delete, copy link per row). Guests tile added to Event Hub with live count. Backend adds `PATCH /events/:eventId/guests/:guestId`. Personalised link resolves guest name onto the public card via `?g={token}`. |
| No post-event summary | H12 | `GET /gallery/:id/summary` returns totalSubmissions, approvedCount, uniqueGuests, topSubmission (via `groupBy` on reactions). Summary section in moderation page: 3 stat tiles + most-loved moment card with thumbnail and reaction count. |
| Multiple submissions per guest not handled | G8 | 3-submission cap per device via localStorage token map; `LimitScreen` at cap. |
| Prices hardcoded — no admin control over subscription amounts | A1, A2, A3 | `PricingConfig` singleton table + migration `20260501000000_add_pricing_config`. `GET /admin/pricing` (public) + `PATCH /admin/pricing` (admin-only) in new `PricingModule`. `/admin/pricing` settings page with currency dropdown + amount inputs. Landing page now an async Server Component that fetches live pricing with 60s revalidation; renders three-tier (Free/Pro/Business) card layout. |

## Enhancements
- Feedback feature from host
- S3 / Cloudflare R2 CDN
- Landing page improvements (screenshots, social proof, annual pricing)
- Custom domain hosting for event pages