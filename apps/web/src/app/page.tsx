import Link from 'next/link';

const WORKFLOW_STEPS = [
  {
    number: '01',
    title: 'Create the invitation',
    body: 'Set up the event, design the card, and publish a shareable link guests can open anywhere.',
  },
  {
    number: '02',
    title: 'Share the QR',
    body: 'Turn on Glimpses for the event and give guests one scan-to-feed entry point at the venue.',
  },
  {
    number: '03',
    title: 'Approve live moments',
    body: 'Guests post from their phones while hosts moderate what appears on the public feed.',
  },
  {
    number: '04',
    title: 'Keep the album',
    body: 'After the celebration, hosts can export approved photos during the download window.',
  },
];

const FEATURE_BADGES = ['Card builder', 'QR upload', 'Live moderation', 'Guest reactions', 'Photo export'];

const QR_CELLS = new Set([
  0, 1, 2, 4, 5, 6, 7, 9, 10, 12, 14, 16, 18, 20, 21, 22, 24, 25, 27, 28, 30, 31, 33, 35, 36, 38, 40, 42, 43, 44, 46, 48,
]);

function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-10 w-10 flex-shrink-0 rounded-lg"
        style={{
          backgroundImage: `url("/logo without text.png")`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <span
        className={light ? 'text-xl font-semibold text-cream' : 'text-xl font-semibold text-ink'}
        style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.02em' }}
      >
        Glimpse
      </span>
    </div>
  );
}

function MiniQrCode() {
  return (
    <div className="grid h-24 w-24 grid-cols-7 gap-1 rounded-md border border-ink/10 bg-white p-2 shadow-sm">
      {Array.from({ length: 49 }).map((_, index) => (
        <span
          key={`qr-cell-${index}`}
          className={QR_CELLS.has(index) ? 'rounded-[1px] bg-ink' : 'rounded-[1px] bg-transparent'}
        />
      ))}
    </div>
  );
}

function InvitationCardMockup() {
  return (
    <div className="rounded-lg border border-gold/40 bg-cream p-4 shadow-xl shadow-ink/10">
      <div className="rounded-md border border-gold/40 bg-white p-4">
        <div className="mb-8 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.22em] text-terra">
          <span>Wedding</span>
          <span>June 24</span>
        </div>
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-ink/50">Together with family</p>
          <h3 className="text-3xl font-bold leading-tight text-ink" style={{ fontFamily: 'Georgia, serif' }}>
            Asha
            <span className="block text-terra">&</span>
            Rohan
          </h3>
          <div className="mx-auto h-px w-16 bg-gold" />
          <p className="text-xs leading-relaxed text-ink/60">
            An evening of dinner, dancing, and memories captured live.
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-ink/60">
        <span>Published card</span>
        <span className="rounded-md bg-terra px-2 py-1 text-white">Share link</span>
      </div>
    </div>
  );
}

function PhoneFeedMockup() {
  return (
    <div className="rounded-[28px] border border-ink/15 bg-ink p-2 shadow-2xl shadow-ink/25">
      <div className="overflow-hidden rounded-[22px] bg-cream">
        <div className="border-b border-gold/30 bg-ink px-4 py-4 text-cream">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-cream/55">Glimpses</p>
              <p className="text-sm font-semibold">Live feed</p>
            </div>
            <span className="flex items-center gap-1 rounded-md bg-cream/10 px-2 py-1 text-[10px] font-semibold text-cream">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6DBB7C]" />
              Live
            </span>
          </div>
        </div>
        <div className="space-y-3 p-3">
          <div className="rounded-lg border border-gold/30 bg-white p-2">
            <div className="h-24 rounded-md bg-[linear-gradient(135deg,#B85C37,#F9CDB5_62%,#F6EBDD)]" />
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-ink">Maya</p>
                <p className="text-[10px] text-ink/50">First dance glow</p>
              </div>
              <div className="flex gap-1 text-[11px]">
                <span className="rounded-md bg-blush px-1.5 py-1">8</span>
                <span className="rounded-md bg-blush px-1.5 py-1">3</span>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gold/30 bg-white p-2">
            <div className="h-16 rounded-md bg-[linear-gradient(135deg,#1E130C,#CFAC64)]" />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-ink">Arjun</p>
              <span className="rounded-md bg-terra px-2 py-1 text-[10px] font-semibold text-white">New</span>
            </div>
          </div>
        </div>
        <div className="px-3 pb-4">
          <div className="rounded-lg bg-terra px-4 py-3 text-center text-sm font-bold text-white">Share a Glimpse</div>
        </div>
      </div>
    </div>
  );
}

function HeroShowcaseMockup() {
  return (
    <div className="relative mx-auto min-h-[365px] w-full max-w-[560px] sm:min-h-[470px]">
      <div className="absolute left-0 top-8 w-[66%] max-w-[350px]">
        <InvitationCardMockup />
      </div>
      <div className="absolute right-0 top-0 w-[47%] min-w-[180px] max-w-[250px]">
        <PhoneFeedMockup />
      </div>
      <div className="absolute bottom-0 left-4 right-4 rounded-lg border border-gold/40 bg-white p-4 shadow-xl shadow-ink/10 sm:left-12 sm:right-16">
        <div className="flex items-start gap-3">
          <MiniQrCode />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-terra">Host view</p>
            <h3 className="mt-1 text-lg font-bold text-ink" style={{ fontFamily: 'Georgia, serif' }}>
              12 pending Glimpses
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-ink/60">
              Approve photos before they appear on the live feed.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md bg-terra px-3 py-1.5 text-xs font-semibold text-white">Approve all</span>
              <span className="rounded-md border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink">Review</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorMockup() {
  return (
    <div className="rounded-lg border border-ink/10 bg-white shadow-xl shadow-ink/10">
      <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terra">Card Editor</p>
          <p className="text-sm font-semibold text-ink">Asha & Rohan invitation</p>
        </div>
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-terra" />
          <span className="h-2.5 w-2.5 rounded-full bg-gold" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink/25" />
        </div>
      </div>
      <div className="grid grid-cols-[88px_1fr] gap-0">
        <div className="space-y-2 border-r border-ink/10 bg-blush/40 p-3">
          {['Text', 'Image', 'Button', 'QR'].map((tool) => (
            <div key={tool} className="rounded-md border border-gold/30 bg-cream px-2 py-2 text-[11px] font-semibold text-ink/70">
              {tool}
            </div>
          ))}
        </div>
        <div className="bg-[#E9DED2] p-5">
          <div className="mx-auto max-w-[260px] rounded-lg border border-gold/40 bg-cream p-5 shadow-lg">
            <div className="mb-7 h-10 rounded-md border border-gold/40 bg-white" />
            <div className="space-y-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.22em] text-terra">Save the date</p>
              <div className="mx-auto h-8 w-32 rounded-md bg-ink/90" />
              <div className="mx-auto h-3 w-24 rounded-md bg-terra/70" />
              <div className="mx-auto h-3 w-36 rounded-md bg-ink/20" />
            </div>
            <div className="mt-7 rounded-md bg-terra px-3 py-2 text-center text-xs font-bold text-white">Open invitation</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlimpsesWorkflowMockup() {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-gold/40 bg-white p-4 shadow-lg shadow-ink/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terra">Guest entry</p>
            <h3 className="mt-1 text-lg font-bold text-ink" style={{ fontFamily: 'Georgia, serif' }}>
              Scan to share
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-ink/60">Guests land on the feed first, then upload from their phones.</p>
          </div>
          <MiniQrCode />
        </div>
        <div className="mt-4 rounded-lg border border-ink/10 bg-cream p-3">
          <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45">Upload form</label>
          <div className="mt-2 space-y-2">
            <div className="h-8 rounded-md bg-white" />
            <div className="h-16 rounded-md border border-dashed border-terra/50 bg-white" />
            <div className="rounded-md bg-terra px-3 py-2 text-center text-xs font-bold text-white">Post Glimpse</div>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-lg shadow-ink/10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terra">Moderation</p>
            <h3 className="mt-1 text-lg font-bold text-ink" style={{ fontFamily: 'Georgia, serif' }}>
              Approve the live story
            </h3>
          </div>
          <span className="rounded-md bg-[#EAF6ED] px-2 py-1 text-[10px] font-bold text-[#27673A]">Live</span>
        </div>
        <div className="space-y-2">
          {[
            ['Maya', 'First dance photo', 'Approve'],
            ['Dev', 'Table 7 toast', 'Approve'],
            ['Nisha', 'Cake moment', 'Review'],
          ].map(([name, caption, action], index) => (
            <div key={name} className="grid grid-cols-[52px_1fr_auto] items-center gap-3 rounded-lg border border-ink/10 bg-cream p-2">
              <div className={`h-12 rounded-md ${index === 0 ? 'bg-terra' : index === 1 ? 'bg-gold' : 'bg-ink/70'}`} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{name}</p>
                <p className="truncate text-xs text-ink/55">{caption}</p>
              </div>
              <span className={action === 'Approve' ? 'rounded-md bg-terra px-2 py-1 text-xs font-bold text-white' : 'rounded-md border border-ink/15 px-2 py-1 text-xs font-bold text-ink'}>
                {action}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-ink/65">
          <span className="rounded-md bg-blush px-2.5 py-1.5">Guest reactions</span>
          <span className="rounded-md bg-blush px-2.5 py-1.5">Photo export</span>
          <span className="rounded-md bg-blush px-2.5 py-1.5">PWA feed</span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream text-ink" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <header className="sticky top-0 z-50 border-b border-gold/30 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" aria-label="Glimpse home">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-ink/65 md:flex">
            <Link href="#features" className="transition-colors hover:text-ink">
              Features
            </Link>
            <Link href="#pricing" className="transition-colors hover:text-ink">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="px-3 py-2 text-sm font-semibold text-ink/70 transition-colors hover:text-ink">
              Sign in
            </Link>
            <Link href="/auth/register" className="rounded-lg bg-terra px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-terra/90">
              Join beta
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="overflow-hidden px-5 pb-12 pt-10 sm:pb-16 sm:pt-14 lg:pb-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-gold/40 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-terra">
                <span className="h-1.5 w-1.5 rounded-full bg-terra" />
                Digital invitations + live guest photo sharing
              </div>
              <h1 className="text-4xl font-bold leading-[1.05] text-ink sm:text-5xl lg:text-6xl" style={{ fontFamily: 'Georgia, serif' }}>
                Invite beautifully. Capture the moments live.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-ink/65 sm:text-lg">
                Create a polished event card, share it by link or QR, and let guests add Glimpses to a live feed you control from the host dashboard.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/auth/register" className="rounded-lg bg-terra px-7 py-3.5 text-center text-base font-bold text-white shadow-lg shadow-terra/15 transition-colors hover:bg-terra/90">
                  Join beta
                </Link>
                <Link href="#features" className="rounded-lg border-2 border-ink/15 px-7 py-3.5 text-center text-base font-bold text-ink transition-colors hover:border-terra/60 hover:text-terra">
                  See Glimpses in action
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-2">
                {FEATURE_BADGES.map((badge) => (
                  <span key={badge} className="rounded-md border border-gold/40 bg-white px-3 py-1.5 text-xs font-semibold text-ink/65">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
            <HeroShowcaseMockup />
          </div>
        </section>

        <section className="border-y border-gold/30 bg-white/60 px-5 py-6">
          <div className="mx-auto grid max-w-6xl gap-4 text-sm font-semibold text-ink/70 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gold/30 bg-cream px-4 py-3">Card builder to start</div>
            <div className="rounded-lg border border-gold/30 bg-cream px-4 py-3">Feed-first QR guest entry</div>
            <div className="rounded-lg border border-gold/30 bg-cream px-4 py-3">Host approval before public posts</div>
            <div className="rounded-lg border border-gold/30 bg-cream px-4 py-3">Photo export after the event</div>
          </div>
        </section>

        <section className="px-5 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-terra">How it works</p>
              <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl" style={{ fontFamily: 'Georgia, serif' }}>
                One event flow from invite to album
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {WORKFLOW_STEPS.map(({ number, title, body }) => (
                <div key={number} className="border-t border-gold/50 pt-5">
                  <p className="text-sm font-bold text-terra" style={{ fontFamily: 'Georgia, serif' }}>
                    {number}
                  </p>
                  <h3 className="mt-3 text-lg font-bold text-ink" style={{ fontFamily: 'Georgia, serif' }}>
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink/60">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 bg-blush/30 px-5 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-terra">Features</p>
                <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl" style={{ fontFamily: 'Georgia, serif' }}>
                  Cards and Glimpses work as one event workspace
                </h2>
              </div>
              <p className="max-w-2xl text-base leading-relaxed text-ink/65">
                The card gets guests to the celebration. Glimpses keeps them participating once they arrive, with QR upload, live feed visibility, host moderation, reactions, and export built into the same event.
              </p>
            </div>

            <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-start">
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-terra">Card Editor</p>
                  <h3 className="mt-2 text-2xl font-bold text-ink" style={{ fontFamily: 'Georgia, serif' }}>
                    Build the invitation that starts the experience
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink/65">
                    Design the event card, preview it, and publish a shareable URL. It remains the approachable starting point for new hosts.
                  </p>
                </div>
                <EditorMockup />
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-terra">Glimpses</p>
                    <span className="rounded-md border border-terra/20 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-terra">Beta</span>
                  </div>
                  <h3 className="mt-2 text-2xl font-bold text-ink" style={{ fontFamily: 'Georgia, serif' }}>
                    Turn the event into a live shared album
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink/65">
                    Guests scan, post, and react while hosts keep the public feed curated. After the event, hosts can preserve approved photos with export.
                  </p>
                </div>
                <GlimpsesWorkflowMockup />
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-24 px-5 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-terra">Pricing</p>
              <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl" style={{ fontFamily: 'Georgia, serif' }}>
                Pricing is being finalized
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink/60">
                Glimpse is in beta while we shape plans around invitation cards, Glimpses, moderation, reactions, and photo export.
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-3xl rounded-lg border border-gold/40 bg-white p-6 shadow-lg shadow-ink/10 sm:p-8">
              <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="text-sm font-bold text-terra">Beta access</p>
                  <h3 className="mt-2 text-2xl font-bold text-ink" style={{ fontFamily: 'Georgia, serif' }}>
                    We are learning what event hosts need before publishing plans.
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink/65">
                    You can join the beta now, try the invitation workflow, and follow along as Glimpses packaging becomes clearer.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                  <Link href="/auth/register" className="rounded-lg bg-terra px-6 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-terra/90">
                    Join beta
                  </Link>
                  <Link href="mailto:hello@glimpse.app" className="rounded-lg border border-ink/20 px-6 py-3 text-center text-sm font-bold text-ink transition-colors hover:border-terra/50 hover:text-terra">
                    Contact us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-ink px-5 py-20 text-cream">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Ready when your next event is</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'Georgia, serif' }}>
              Start with a beautiful card. Add Glimpses when guests arrive.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-cream/65">
              Join the beta to try the invitation workflow and see how live guest photo sharing fits your event.
            </p>
            <Link href="/auth/register" className="mt-8 inline-flex rounded-lg bg-cream px-8 py-4 text-base font-bold text-terra shadow-lg transition-colors hover:bg-blush">
              Join beta
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-ink px-5 pb-10 text-cream">
        <div className="mx-auto max-w-6xl border-t border-cream/10 pt-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <BrandMark light />
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-cream/35">by Elegant Decorations</p>
            </div>
            <nav className="flex flex-wrap gap-5 text-sm font-semibold text-cream/45">
              <Link href="#features" className="transition-colors hover:text-cream">
                Features
              </Link>
              <Link href="#pricing" className="transition-colors hover:text-cream">
                Pricing
              </Link>
              <Link href="/auth/login" className="transition-colors hover:text-cream">
                Sign in
              </Link>
              <Link href="/auth/register" className="transition-colors hover:text-cream">
                Register
              </Link>
              <Link href="/terms" className="transition-colors hover:text-cream">
                Terms
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-cream">
                Privacy
              </Link>
            </nav>
          </div>
          <p className="mt-8 text-center text-xs text-cream/25">© {new Date().getFullYear()} Elegant Decorations Nepal Pvt. Ltd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
