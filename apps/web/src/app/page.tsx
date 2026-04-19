import Link from 'next/link';

const PILLARS = [
  { icon: '✦', label: 'Drag & Drop Canvas' },
  { icon: '🎨', label: 'Rich Styling Tools' },
  { icon: '👥', label: 'Guest List & QR' },
  { icon: '📸', label: 'Live Photo Glimpses' },
  { icon: '🔗', label: 'Instant Share Link' },
  { icon: '📱', label: 'Mobile Ready' },
];

const STEPS = [
  {
    number: '01',
    title: 'Create your event',
    body: 'Give it a name and date. Glimpse sets up your workspace in seconds.',
  },
  {
    number: '02',
    title: 'Design your card',
    body: 'Drag, drop, and style every element on a pixel-perfect canvas.',
  },
  {
    number: '03',
    title: 'Share with guests',
    body: 'Publish to a unique link. Guests open it on any device — no app needed.',
  },
];

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['Card editor', '1 active event', 'Shareable link', 'No Glimpses'],
    cta: 'Get started',
    href: '/auth/register',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$15',
    period: 'per month',
    features: ['Everything in Free', 'Unlimited events', 'Glimpses enabled', '30-day photo export'],
    cta: 'Upgrade to Pro',
    href: '/auth/register',
    highlight: true,
  },
  {
    name: 'Business',
    price: '$49',
    period: 'per month',
    features: ['Everything in Pro', 'Multiple galleries', '60-day photo export', 'Priority support'],
    cta: 'Contact us',
    href: 'mailto:hello@glimpse.app',
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream text-ink" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-cream border-b border-gold/30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex-shrink-0"
              style={{ backgroundImage: 'url("/App Icon and Favicon Terra.png")', backgroundSize: '180%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
            />
            <span className="text-2xl font-semibold text-ink" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.02em' }}>
              Glimpse
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm font-medium text-ink/70 hover:text-ink transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 bg-terra hover:bg-terra/90 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              Get started free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blush border border-gold/40 rounded-full text-xs font-semibold text-terra mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-terra inline-block" />
            Now in beta — free to try
          </div>

          <h1
            className="text-5xl md:text-6xl font-bold text-ink leading-tight mb-6"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Create beautiful<br />digital invitations
          </h1>

          <p className="text-lg text-ink/60 leading-relaxed mb-10 max-w-xl mx-auto">
            Design stunning cards, manage your guest list, and let guests share live photo memories — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-terra hover:bg-terra/90 text-white font-semibold rounded-xl transition-colors shadow-md text-base"
            >
              Start for free →
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-8 py-3.5 border-2 border-ink/20 hover:border-ink/40 text-ink font-semibold rounded-xl transition-colors text-base"
            >
              Sign in
            </Link>
          </div>

        </div>
      </section>

      {/* Feature pillars */}
      <section className="py-10 px-6 bg-blush/40">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-3">
          {PILLARS.map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 bg-blush border border-gold/30 rounded-full text-sm font-medium text-ink"
            >
              <span className="text-lg leading-none">{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase text-terra mb-4 text-center">How it works</p>
          <h2
            className="text-3xl md:text-4xl font-bold text-ink text-center mb-16"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            From idea to invite in minutes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(({ number, title, body }) => (
              <div key={number} className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blush border border-gold/30 flex items-center justify-center">
                  <span className="text-xl font-bold text-terra" style={{ fontFamily: 'Georgia, serif' }}>
                    {number}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-ink" style={{ fontFamily: 'Georgia, serif' }}>
                  {title}
                </h3>
                <p className="text-sm text-ink/60 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature: Card Editor */}
      <section className="py-24 px-6 bg-blush/30">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-terra mb-4">Card Editor</p>
            <h2
              className="text-3xl md:text-4xl font-bold text-ink mb-6"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              A canvas that feels like magic
            </h2>
            <p className="text-base text-ink/60 leading-relaxed mb-8">
              Every element — text, images, shapes, countdown timers — snaps into place on a pixel-perfect canvas. Style freely, preview instantly, and publish when you're ready.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-terra hover:bg-terra/90 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Try the editor →
            </Link>
          </div>

          {/* Placeholder preview */}
          <div className="rounded-2xl bg-ink/5 border border-ink/10 aspect-[4/3] flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-3 opacity-20 select-none">✦</div>
              <p className="text-xs text-ink/30 font-medium">Card Editor Preview</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature: Glimpses */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Placeholder preview */}
          <div className="rounded-2xl bg-ink/5 border border-ink/10 aspect-[4/3] flex items-center justify-center order-2 md:order-1">
            <div className="text-center">
              <div className="text-5xl mb-3 opacity-20 select-none">📸</div>
              <p className="text-xs text-ink/30 font-medium">Glimpses Feed Preview</p>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs font-bold tracking-widest uppercase text-terra">Glimpses</p>
              <span className="px-2 py-0.5 bg-gold/20 text-gold text-[10px] font-bold tracking-wider uppercase rounded-full border border-gold/30">
                Pro
              </span>
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold text-ink mb-6"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Let guests be part of the story
            </h2>
            <p className="text-base text-ink/60 leading-relaxed mb-8">
              Guests scan a QR code to upload live photos straight from their phones. You curate what shows on the feed and project it at your venue — or share a link anyone can view.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-terra/30 hover:border-terra text-terra font-semibold rounded-xl transition-colors text-sm"
            >
              Explore Glimpses →
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-blush/30">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase text-terra mb-4 text-center">Pricing</p>
          <h2
            className="text-3xl md:text-4xl font-bold text-ink text-center mb-4"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Simple, honest pricing
          </h2>
          <p className="text-base text-ink/50 text-center mb-16">
            Start free. Upgrade when you need more.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map(({ name, price, period, features, cta, href, highlight }) => (
              <div
                key={name}
                className={`rounded-2xl p-7 flex flex-col gap-6 ${
                  highlight
                    ? 'bg-cream border-2 border-terra shadow-lg shadow-terra/10'
                    : 'bg-cream border border-ink/10'
                }`}
              >
                {highlight && (
                  <div className="text-[10px] font-bold tracking-widest uppercase text-terra">
                    Most popular
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-ink/50 mb-1">{name}</p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-4xl font-bold text-ink"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      {price}
                    </span>
                    <span className="text-sm text-ink/40">{period}</span>
                  </div>
                </div>

                <ul className="flex flex-col gap-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink/70">
                      <span className="text-terra mt-0.5 leading-none">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={href}
                  className={`mt-auto block text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                    highlight
                      ? 'bg-terra hover:bg-terra/90 text-white'
                      : 'border border-ink/20 hover:border-ink/40 text-ink'
                  }`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-6 bg-terra">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="text-3xl md:text-4xl font-bold text-cream mb-6"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Ready to create something beautiful?
          </h2>
          <p className="text-base text-cream/70 mb-10">
            Join the creators who trust Glimpse for their most important moments.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-cream hover:bg-blush text-terra font-bold rounded-xl transition-colors text-base shadow-lg"
          >
            Start for free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-ink">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div
              className="w-8 h-8 rounded-lg flex-shrink-0"
              style={{ backgroundImage: 'url("/App Icon and Favicon Cream Alt.png")', backgroundSize: '180%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
            />
            <div>
              <span className="text-sm font-semibold text-cream" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.02em' }}>Glimpse</span>
              <span className="text-[10px] text-cream/30 ml-2 uppercase tracking-widest">by Elegant Decorations</span>
            </div>
            </div>

            <nav className="flex items-center gap-6 text-sm text-cream/40">
              <Link href="#features" className="hover:text-cream/70 transition-colors">Features</Link>
              <Link href="#pricing" className="hover:text-cream/70 transition-colors">Pricing</Link>
              <Link href="/auth/login" className="hover:text-cream/70 transition-colors">Sign in</Link>
              <Link href="/auth/register" className="hover:text-cream/70 transition-colors">Register</Link>
            </nav>
          </div>

          <div className="mt-8 pt-6 border-t border-cream/10 text-center text-xs text-cream/25">
            © {new Date().getFullYear()} Elegant Decorations Nepal Pvt. Ltd. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
