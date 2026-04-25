import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Glimpse',
  description: 'The terms governing your use of the Glimpse platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream text-ink" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <header className="border-b border-gold/30 bg-cream/95 px-5 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-ink transition-colors hover:text-terra" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.02em' }}>
            Glimpse
          </Link>
          <nav className="flex gap-5 text-sm font-medium text-ink/50">
            <Link href="/privacy" className="transition-colors hover:text-ink">Privacy</Link>
            <Link href="/auth/login" className="transition-colors hover:text-ink">Sign in</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-terra">Legal</p>
        <h1 className="mt-3 text-4xl font-bold text-ink" style={{ fontFamily: 'Georgia, serif' }}>Terms of Service</h1>
        <p className="mt-3 text-sm text-ink/50">Last updated: 25 April 2026</p>

        <div className="mt-12 space-y-10 text-base leading-relaxed text-ink/80">

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>1. Agreement</h2>
            <p>
              By accessing or using the Glimpse platform (&ldquo;Service&rdquo;), operated by <strong>Elegant Decorations Nepal Pvt. Ltd.</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree, do not use the Service. These Terms apply to all users, including event hosts with accounts and guests who submit photos.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>2. The Service</h2>
            <p>
              Glimpse provides a drag-and-drop invitation card builder, shareable public card links, and a live guest photo gallery feature called Moments. Features vary by subscription tier:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li><strong>Free</strong> — card editor, one active event, no Moments.</li>
              <li><strong>Pro (~$15/mo)</strong> — Moments enabled, photo export available for 30 days after gallery close.</li>
              <li><strong>Business (~$49/mo)</strong> — multiple concurrent galleries, 60-day export window.</li>
            </ul>
            <p className="mt-3">
              We may change features, pricing, or these Terms at any time. Material changes will be communicated by email at least 14 days in advance.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>3. Accounts</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>You must provide accurate information when creating an account and keep it up to date.</li>
              <li>You are responsible for all activity under your account and for keeping your password secure.</li>
              <li>You must be at least 16 years old to create an account.</li>
              <li>One person or legal entity may not maintain more than one free account.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>4. User content</h2>
            <p>
              &ldquo;User content&rdquo; means any text, images, designs, or other material you upload to or create on Glimpse.
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>You retain ownership of your user content.</li>
              <li>By uploading content, you grant us a limited, non-exclusive, royalty-free licence to store, display, and deliver it solely for the purpose of operating the Service.</li>
              <li>You represent that you own or have the necessary rights to all content you upload, and that it does not infringe any third-party intellectual property rights.</li>
              <li>We do not claim ownership of guest photos submitted through Moments. The host is responsible for ensuring guests have consented before their photos are shared.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>5. Acceptable use</h2>
            <p>You must not use the Service to:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>Upload content that is unlawful, defamatory, abusive, obscene, or that violates the rights of others.</li>
              <li>Impersonate another person or misrepresent your affiliation with any entity.</li>
              <li>Distribute spam, malware, or any content designed to harm other users.</li>
              <li>Attempt to gain unauthorised access to any part of the Service or its infrastructure.</li>
              <li>Scrape, crawl, or use automated tools against the Service without our written permission.</li>
              <li>Resell or sublicence access to the Service without our written permission.</li>
            </ul>
            <p className="mt-3">
              We reserve the right to remove content or suspend accounts that violate these rules without prior notice.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>6. Moments (guest photo galleries)</h2>
            <p>
              When a host opens a Moments gallery, guests can submit photos via a shared link. By opening a gallery, the host acknowledges:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>They are responsible for moderating submitted content before it is displayed publicly.</li>
              <li>They must not display photos of guests who have not provided explicit consent.</li>
              <li>Photo data is retained for the duration specified by the host&rsquo;s subscription tier and then deleted. Export files are available for download within the applicable window (30 days for Pro, 60 days for Business). After that window, exports cannot be recovered.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>7. Payment and billing</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Paid plans are billed monthly or annually as selected at checkout.</li>
              <li>Subscriptions renew automatically. You may cancel at any time; access continues until the end of the current billing period.</li>
              <li>We do not offer refunds for partial billing periods, except where required by applicable law.</li>
              <li>We may suspend access to paid features if payment fails after reasonable notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>8. Intellectual property</h2>
            <p>
              All software, design, trademarks, and content that form part of the Glimpse platform (excluding user content) are the property of Elegant Decorations Nepal Pvt. Ltd. and may not be copied, reproduced, or used without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>9. Disclaimers and limitation of liability</h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, error-free, or that data will never be lost.
            </p>
            <p className="mt-3">
              To the maximum extent permitted by law, our total liability to you for any claim arising out of or relating to these Terms or the Service will not exceed the amount you paid us in the 12 months preceding the claim, or USD $50, whichever is greater.
            </p>
            <p className="mt-3">
              We are not liable for any indirect, incidental, special, or consequential damages, including loss of data, revenue, or goodwill, even if advised of the possibility of such damages.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>10. Termination</h2>
            <p>
              You may delete your account at any time in Account Settings. We may suspend or terminate your account if you violate these Terms, with or without notice depending on the severity of the violation. Upon termination, your right to use the Service ends immediately and your data will be deleted in accordance with our <Link href="/privacy" className="text-terra underline underline-offset-2 hover:text-terra/80">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>11. Governing law</h2>
            <p>
              These Terms are governed by the laws of Nepal. Any dispute arising from these Terms will be subject to the exclusive jurisdiction of the courts of Kathmandu, Nepal.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink" style={{ fontFamily: 'Georgia, serif' }}>12. Contact</h2>
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
