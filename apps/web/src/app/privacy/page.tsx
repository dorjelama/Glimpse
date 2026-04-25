import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Glimpse',
  description: 'How Glimpse collects, uses, and protects your personal data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream text-ink" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <header className="border-b border-gold/30 bg-cream/95 px-5 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-ink transition-colors hover:text-terra" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.02em' }}>
            Glimpse
          </Link>
          <nav className="flex gap-5 text-sm font-medium text-ink/50">
            <Link href="/terms" className="transition-colors hover:text-ink">Terms</Link>
            <Link href="/auth/login" className="transition-colors hover:text-ink">Sign in</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-terra">Legal</p>
        <h1 className="mt-3 text-4xl font-bold text-ink" style={{ fontFamily: 'Georgia, serif' }}>Privacy Policy</h1>
        <p className="mt-3 text-sm text-ink/50">Last updated: 25 April 2026</p>

        <div className="mt-12 space-y-10 text-base leading-relaxed text-ink/80">

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>1. Who we are</h2>
            <p>
              Glimpse is a product of <strong>Elegant Decorations Nepal Pvt. Ltd.</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), a company registered in Nepal. We operate the Glimpse platform at <strong>glimpse.app</strong>, which lets event hosts create digital invitation cards and collect live photo contributions from guests.
            </p>
            <p className="mt-3">
              Questions about this policy: <a href="mailto:hello@glimpse.app" className="text-terra underline underline-offset-2 hover:text-terra/80">hello@glimpse.app</a>
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>2. Information we collect</h2>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/50">Account holders</h3>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Account data</strong> — your name, email address, and a hashed password when you register.</li>
              <li><strong>Event data</strong> — invitation card content, canvas designs, page layouts, and guest lists that you create.</li>
              <li><strong>Usage data</strong> — actions taken in the editor, publish/unpublish events, timestamps.</li>
            </ul>
            <h3 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wide text-ink/50">Guests (Moments feature)</h3>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Display name</strong> — the name you enter when submitting photos to a gallery.</li>
              <li><strong>Photos</strong> — images you upload through the guest upload form.</li>
              <li><strong>Message/caption</strong> — any optional text submitted alongside your photos.</li>
              <li><strong>Session identifier</strong> — a temporary, anonymised identifier used only to attribute emoji reactions within a session. It is never linked to a real identity.</li>
            </ul>
            <h3 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wide text-ink/50">Automatically collected</h3>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Standard server access logs (IP address, browser type, referrer, timestamps). These are used for security and diagnostics and are not sold or shared.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>3. How we use your information</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>To provide the service — rendering your cards, hosting galleries, delivering shared links to guests.</li>
              <li>To communicate with you — transactional emails about your account (we do not send marketing email without your opt-in).</li>
              <li>To improve the product — aggregated, anonymised usage patterns only.</li>
              <li>To enforce our <Link href="/terms" className="text-terra underline underline-offset-2 hover:text-terra/80">Terms of Service</Link> and prevent abuse.</li>
            </ul>
            <p className="mt-4">We do <strong>not</strong> sell, rent, or share your personal data with third parties for advertising.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>4. Guest photo consent</h2>
            <p>
              Before uploading photos through the Moments feature, guests are asked to explicitly consent to their photos being displayed on the event&rsquo;s live feed and shared with other guests by the event host. This consent is recorded with a timestamp.
            </p>
            <p className="mt-3">
              If you submitted photos as a guest and wish to have them removed, contact the event host directly, or email us at <a href="mailto:hello@glimpse.app" className="text-terra underline underline-offset-2 hover:text-terra/80">hello@glimpse.app</a> with the event name and your submission details.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>5. Data retention</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Account data</strong> — retained for as long as your account is active. Deleting your account removes all your events, cards, and guest data immediately and permanently.</li>
              <li><strong>Guest photos (Pro tier)</strong> — photo exports are available for download for 30 days after the gallery closes.</li>
              <li><strong>Guest photos (Business tier)</strong> — photo exports are available for 60 days after the gallery closes.</li>
              <li><strong>Access logs</strong> — retained for up to 90 days for security purposes, then deleted.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>6. Cookies and local storage</h2>
            <p>
              Glimpse uses a single authentication cookie (<code className="rounded bg-ink/5 px-1 py-0.5 text-sm font-mono">glimpse-token</code>) to keep you signed in. We also use browser <code className="rounded bg-ink/5 px-1 py-0.5 text-sm font-mono">localStorage</code> to preserve your editor state between sessions. We do not use third-party tracking cookies or advertising pixels.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>7. Your rights</h2>
            <p>You have the right to:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><strong>Access</strong> the personal data we hold about you.</li>
              <li><strong>Correct</strong> inaccurate data — update your name and email in Account Settings at any time.</li>
              <li><strong>Delete</strong> your account and all associated data — available in Account Settings under &ldquo;Delete account&rdquo;.</li>
              <li><strong>Object</strong> to processing — email us and we will respond within 30 days.</li>
            </ul>
            <p className="mt-3">
              To exercise any right not covered by self-service, email <a href="mailto:hello@glimpse.app" className="text-terra underline underline-offset-2 hover:text-terra/80">hello@glimpse.app</a>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>8. Security</h2>
            <p>
              Passwords are stored as bcrypt hashes and never in plain text. Connections to the Glimpse platform use HTTPS. Access to production systems is restricted to authorised personnel. While we take reasonable steps to protect your data, no system is completely immune to breach; we will notify affected users promptly in the event of a security incident affecting personal data.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>9. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be communicated by email to registered users at least 14 days before they take effect. Continued use of the service after that date constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>10. Contact</h2>
            <p>
              Elegant Decorations Nepal Pvt. Ltd.<br />
              Kathmandu, Nepal<br />
              <a href="mailto:hello@glimpse.app" className="text-terra underline underline-offset-2 hover:text-terra/80">hello@glimpse.app</a>
            </p>
          </section>

        </div>
      </main>

      <footer className="bg-ink px-5 pb-10 text-cream">
        <div className="mx-auto max-w-3xl border-t border-cream/10 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-xl font-semibold text-cream" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.02em' }}>Glimpse</span>
            <nav className="flex flex-wrap gap-5 text-sm font-medium text-cream/45">
              <Link href="/" className="transition-colors hover:text-cream">Home</Link>
              <Link href="/terms" className="transition-colors hover:text-cream">Terms</Link>
              <Link href="/privacy" className="transition-colors hover:text-cream">Privacy</Link>
            </nav>
          </div>
          <p className="mt-6 text-xs text-cream/25">© {new Date().getFullYear()} Elegant Decorations Nepal Pvt. Ltd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
