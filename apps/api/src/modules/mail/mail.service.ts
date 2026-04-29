import { Injectable, Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

interface VerificationEmailParams {
  to: string;
  name: string;
  verifyUrl: string;
}

interface PasswordResetEmailParams {
  to: string;
  name: string;
  resetUrl: string;
}

interface ExportReminderParams {
  to: string;
  eventTitle: string;
  moderationUrl: string;
  daysRemaining: number;
}

interface CardInvitationParams {
  to: string[];
  eventTitle: string;
  cardUrl: string;        // full public URL e.g. https://glimpse.app/view/my-wedding-a3f9c2
  galleryFeedUrl: string; // full feed URL e.g. https://glimpse.app/g/gal_xxx/feed
  senderName: string;
  message?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly ses: SESClient | null;
  private readonly from: string;
  private readonly isDev: boolean;

  constructor() {
    const hasCredentials =
      !!process.env.SES_ACCESS_KEY_ID &&
      !!process.env.SES_SECRET_ACCESS_KEY &&
      !!process.env.SES_FROM_EMAIL;

    this.isDev = !hasCredentials;
    this.from = process.env.SES_FROM_EMAIL || 'hello@glimpse.app';

    if (hasCredentials) {
      this.ses = new SESClient({
        region: process.env.SES_REGION || 'ap-southeast-1',
        credentials: {
          accessKeyId: process.env.SES_ACCESS_KEY_ID!,
          secretAccessKey: process.env.SES_SECRET_ACCESS_KEY!,
        },
      });
      this.logger.log('SES client initialised');
    } else {
      this.ses = null;
      this.logger.warn('SES credentials not set — emails will be logged to console (dev mode)');
    }
  }

  async sendVerificationEmail(params: VerificationEmailParams): Promise<void> {
    const { to, name, verifyUrl } = params;
    const subject = 'Verify your email — Glimpse';
    const html = /* html */`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>Verify your email</title></head>
<body style="margin:0;padding:0;background-color:#fdf6e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:28px;">
          <span style="font-size:13px;font-weight:700;letter-spacing:0.12em;color:#B85C37;text-transform:uppercase;">Glimpse</span>
        </td></tr>
        <tr><td style="background:#fffdf7;border:1px solid #e8d5b0;border-radius:20px;overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#B85C37;padding:28px 32px;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.14em;color:rgba(246,235,221,0.65);text-transform:uppercase;">Action required</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#F6EBDD;font-family:Georgia,serif;line-height:1.3;">Verify your email address</h1>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:32px;">
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#5c3d1e;">
                Hi <strong>${escapeHtml(name)}</strong>, thanks for joining Glimpse! Click the button below to verify your email address. This link never expires.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr><td style="background:#B85C37;border-radius:12px;">
                  <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#F6EBDD;text-decoration:none;">
                    Verify Email →
                  </a>
                </td></tr>
              </table>
              <p style="margin:0;font-size:12px;color:#b09060;line-height:1.6;">
                Or copy this link: <a href="${verifyUrl}" style="color:#B85C37;">${verifyUrl}</a>
              </p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 32px 28px;">
              <hr style="border:none;border-top:1px solid #e8d5b0;margin:0 0 20px;" />
              <p style="margin:0;font-size:12px;color:#b09060;line-height:1.6;">
                If you didn't create a Glimpse account, you can safely ignore this email.
              </p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:11px;color:#c0a070;">Sent by <strong>Glimpse</strong></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    const text = `Hi ${name},\n\nVerify your Glimpse email address:\n${verifyUrl}\n\nIf you didn't create a Glimpse account, you can safely ignore this email.`;

    if (this.isDev || !this.ses) {
      this.logger.log('──── [DEV] Verification email (not sent) ────');
      this.logger.log(`To:  ${to}`);
      this.logger.log(`URL: ${verifyUrl}`);
      this.logger.log('─────────────────────────────────────────────');
      return;
    }

    await this.ses.send(new SendEmailCommand({
      Source: `Glimpse <${this.from}>`,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' }, Text: { Data: text, Charset: 'UTF-8' } },
      },
    }));
    this.logger.log(`Verification email sent to ${to}`);
  }

  async sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void> {
    const { to, name, resetUrl } = params;
    const subject = 'Reset your Glimpse password';
    const html = /* html */`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>Reset your password</title></head>
<body style="margin:0;padding:0;background-color:#fdf6e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:28px;">
          <span style="font-size:13px;font-weight:700;letter-spacing:0.12em;color:#B85C37;text-transform:uppercase;">Glimpse</span>
        </td></tr>
        <tr><td style="background:#fffdf7;border:1px solid #e8d5b0;border-radius:20px;overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#B85C37;padding:28px 32px;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.14em;color:rgba(246,235,221,0.65);text-transform:uppercase;">Password reset</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#F6EBDD;font-family:Georgia,serif;line-height:1.3;">Reset your password</h1>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:32px;">
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#5c3d1e;">
                Hi <strong>${escapeHtml(name)}</strong>, we received a request to reset your Glimpse password. Click the button below to set a new one. <strong>This link expires in 1 hour.</strong>
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr><td style="background:#B85C37;border-radius:12px;">
                  <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#F6EBDD;text-decoration:none;">
                    Reset Password →
                  </a>
                </td></tr>
              </table>
              <p style="margin:0;font-size:12px;color:#b09060;line-height:1.6;">
                Or copy this link: <a href="${resetUrl}" style="color:#B85C37;">${resetUrl}</a>
              </p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 32px 28px;">
              <hr style="border:none;border-top:1px solid #e8d5b0;margin:0 0 20px;" />
              <p style="margin:0;font-size:12px;color:#b09060;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email. Your password won't change.
              </p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:11px;color:#c0a070;">Sent by <strong>Glimpse</strong></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    const text = `Hi ${name},\n\nReset your Glimpse password (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`;

    if (this.isDev || !this.ses) {
      this.logger.log('──── [DEV] Password reset email (not sent) ────');
      this.logger.log(`To:  ${to}`);
      this.logger.log(`URL: ${resetUrl}`);
      this.logger.log('───────────────────────────────────────────────');
      return;
    }

    await this.ses.send(new SendEmailCommand({
      Source: `Glimpse <${this.from}>`,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' }, Text: { Data: text, Charset: 'UTF-8' } },
      },
    }));
    this.logger.log(`Password reset email sent to ${to}`);
  }

  async sendExportReminder(params: ExportReminderParams): Promise<void> {
    const { to, eventTitle, moderationUrl, daysRemaining } = params;
    const urgency = daysRemaining <= 1 ? 'last chance' : `${daysRemaining} days`;
    const subject = `Your Glimpses photos expire in ${urgency} — "${eventTitle}"`;
    const html = this.buildExportReminderHtml(params);
    const text = `Your Glimpses photos from "${eventTitle}" will be permanently deleted in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.\n\nDownload your ZIP now: ${moderationUrl}\n\nSent by Glimpse.`;

    if (this.isDev || !this.ses) {
      this.logger.log('──── [DEV] Export reminder (not sent) ────');
      this.logger.log(`To:      ${to}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`Days:    ${daysRemaining}`);
      this.logger.log(`URL:     ${moderationUrl}`);
      this.logger.log('──────────────────────────────────────────');
      return;
    }

    await this.ses.send(
      new SendEmailCommand({
        Source: `Glimpse <${this.from}>`,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: html, Charset: 'UTF-8' },
            Text: { Data: text, Charset: 'UTF-8' },
          },
        },
      }),
    );

    this.logger.log(`Export reminder sent to ${to} — ${daysRemaining}d remaining for "${eventTitle}"`);
  }

  private buildExportReminderHtml({ eventTitle, moderationUrl, daysRemaining }: ExportReminderParams): string {
    const isUrgent = daysRemaining <= 1;
    const accentColor = isUrgent ? '#c0392b' : '#B85C37';
    const urgencyLabel = isUrgent ? '⚠️ Last chance' : `⏳ ${daysRemaining} days remaining`;
    const bodyText = isUrgent
      ? `Your photos from <strong>${escapeHtml(eventTitle)}</strong> will be <strong>permanently deleted tomorrow</strong>. Download your ZIP now before they're gone.`
      : `Your photos from <strong>${escapeHtml(eventTitle)}</strong> will be permanently deleted in <strong>${daysRemaining} days</strong>. Download your ZIP before the window closes.`;

    return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Your Glimpses photos are expiring</title>
</head>
<body style="margin:0;padding:0;background-color:#fdf6e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;">

        <!-- Wordmark -->
        <tr><td align="center" style="padding-bottom:28px;">
          <span style="font-size:13px;font-weight:700;letter-spacing:0.12em;color:#B85C37;text-transform:uppercase;">Glimpse</span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#fffdf7;border:1px solid #e8d5b0;border-radius:20px;overflow:hidden;">

          <!-- Header -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:${accentColor};padding:28px 32px;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.14em;color:rgba(246,235,221,0.65);text-transform:uppercase;">${urgencyLabel}</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#F6EBDD;font-family:Georgia,serif;line-height:1.3;">Your photos are expiring</h1>
            </td></tr>
          </table>

          <!-- Body -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:32px;">

              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#5c3d1e;">
                ${bodyText}
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr><td style="background:${accentColor};border-radius:12px;">
                  <a href="${moderationUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#F6EBDD;text-decoration:none;">
                    Download photos →
                  </a>
                </td></tr>
              </table>

              <p style="margin:0;font-size:12px;color:#b09060;line-height:1.6;">
                Or visit: <a href="${moderationUrl}" style="color:#B85C37;">${moderationUrl}</a>
              </p>

            </td></tr>
          </table>

          <!-- Footer note -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 32px 28px;">
              <hr style="border:none;border-top:1px solid #e8d5b0;margin:0 0 20px;" />
              <p style="margin:0;font-size:12px;color:#b09060;line-height:1.6;">
                After the export window closes, all photos are permanently deleted and cannot be recovered. This is a one-time reminder from Glimpse.
              </p>
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:11px;color:#c0a070;">
            Sent by <strong>Glimpse</strong> · You received this because you hosted an event with Glimpses enabled.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
  }

  async sendCardInvitation(params: CardInvitationParams): Promise<void> {
    const { to, eventTitle, cardUrl, galleryFeedUrl, senderName, message } = params;
    const subject = `You're invited: ${eventTitle}`;
    const html = this.buildInvitationHtml({ eventTitle, cardUrl, galleryFeedUrl, senderName, message });
    const text = this.buildInvitationText({ eventTitle, cardUrl, galleryFeedUrl, senderName, message });

    if (this.isDev || !this.ses) {
      this.logger.log('──── [DEV] Email not sent via SES ────');
      this.logger.log(`To:      ${to.join(', ')}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`Card:    ${cardUrl}`);
      this.logger.log(`Feed:    ${galleryFeedUrl}`);
      this.logger.log('Text body preview:');
      this.logger.log(text);
      this.logger.log('────────────────────────────────────');
      return;
    }

    await this.ses.send(
      new SendEmailCommand({
        Source: `Glimpse <${this.from}>`,
        Destination: { ToAddresses: to },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: html, Charset: 'UTF-8' },
            Text: { Data: text, Charset: 'UTF-8' },
          },
        },
      }),
    );

    this.logger.log(`Invitation sent to ${to.length} recipient(s) for "${eventTitle}"`);
  }

  // ── HTML template ──────────────────────────────────────────────────────────

  private buildInvitationHtml(p: Omit<CardInvitationParams, 'to'>): string {
    const messageHtml = p.message
      ? `<p style="font-size:15px;line-height:1.7;color:#5c3d1e;margin:0 0 24px;">${escapeHtml(p.message)}</p>`
      : '';

    return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>You're invited</title>
</head>
<body style="margin:0;padding:0;background-color:#fdf6e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;">

        <!-- Wordmark -->
        <tr><td align="center" style="padding-bottom:28px;">
          <span style="font-size:13px;font-weight:700;letter-spacing:0.12em;color:#B85C37;text-transform:uppercase;">Glimpse</span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#fffdf7;border:1px solid #e8d5b0;border-radius:20px;overflow:hidden;">

          <!-- Terra header -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#B85C37;padding:28px 32px;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.14em;color:rgba(246,235,221,0.65);text-transform:uppercase;">You're invited</p>
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#F6EBDD;font-family:Georgia,serif;line-height:1.3;">${escapeHtml(p.eventTitle)}</h1>
            </td></tr>
          </table>

          <!-- Body -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:32px;">

              <p style="margin:0 0 16px;font-size:15px;color:#7c5c1e;">
                <strong>${escapeHtml(p.senderName)}</strong> has shared an invitation with you on Glimpse.
              </p>

              ${messageHtml}

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr><td style="background:#B85C37;border-radius:12px;">
                  <a href="${p.cardUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#F6EBDD;text-decoration:none;">
                    View Invitation →
                  </a>
                </td></tr>
              </table>

              <p style="margin:0;font-size:12px;color:#b09060;">
                Or copy this link: <a href="${p.cardUrl}" style="color:#B85C37;">${p.cardUrl}</a>
              </p>

            </td></tr>
          </table>

          <!-- Divider -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 32px;">
              <hr style="border:none;border-top:1px solid #e8d5b0;margin:0;" />
            </td></tr>
          </table>

          <!-- Live feed section -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:24px 32px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#5c3d1e;">📸 Live photo feed</p>
              <p style="margin:0 0 12px;font-size:13px;color:#8a6040;line-height:1.6;">
                Scan the QR code at the event or open the live feed to share your moments and see everyone's photos in real time.
              </p>
              <a href="${p.galleryFeedUrl}" style="font-size:13px;color:#B85C37;text-decoration:none;">Open live feed →</a>
            </td></tr>
          </table>

          <!-- Divider -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 32px;">
              <hr style="border:none;border-top:1px solid #e8d5b0;margin:0;" />
            </td></tr>
          </table>

          <!-- Home screen tutorial -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:24px 32px 32px;">
              <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#5c3d1e;">📱 Add the feed to your home screen</p>
              <p style="margin:0 0 16px;font-size:12px;color:#8a6040;line-height:1.6;">
                Get quick access during the event — one tap from your home screen, no browser needed.
              </p>

              <!-- iOS -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr><td style="background:#fdf6e8;border:1px solid #e8d5b0;border-radius:12px;padding:16px;">
                  <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#5c3d1e;">🍎 iPhone (Safari)</p>
                  <ol style="margin:0;padding-left:18px;font-size:12px;color:#8a6040;line-height:2.0;">
                    <li>Open <a href="${p.galleryFeedUrl}" style="color:#B85C37;">the live feed</a> in <strong>Safari</strong></li>
                    <li>Tap the <strong>Share</strong> button (square with arrow pointing up)</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li>Tap <strong>"Add"</strong> — done!</li>
                  </ol>
                </td></tr>
              </table>

              <!-- Android -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="background:#fdf6e8;border:1px solid #e8d5b0;border-radius:12px;padding:16px;">
                  <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#5c3d1e;">🤖 Android (Chrome)</p>
                  <ol style="margin:0;padding-left:18px;font-size:12px;color:#8a6040;line-height:2.0;">
                    <li>Open <a href="${p.galleryFeedUrl}" style="color:#B85C37;">the live feed</a> in <strong>Chrome</strong></li>
                    <li>Tap the <strong>⋮ menu</strong> (three dots, top right)</li>
                    <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install App"</strong></li>
                    <li>Tap <strong>"Add"</strong> — done!</li>
                  </ol>
                </td></tr>
              </table>

            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:11px;color:#c0a070;">
            Sent via <strong>Glimpse</strong> · You received this because someone shared an event with you.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
  }

  private buildInvitationText(p: Omit<CardInvitationParams, 'to'>): string {
    const messageLine = p.message ? `\n${p.message}\n` : '';
    return `You're invited: ${p.eventTitle}

${p.senderName} has shared an invitation with you on Glimpse.
${messageLine}
View Invitation: ${p.cardUrl}

──── Live photo feed ────
Open the live feed to share your moments: ${p.galleryFeedUrl}

──── Add to your home screen ────

iPhone (Safari):
1. Open the live feed in Safari
2. Tap the Share button (square with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add"

Android (Chrome):
1. Open the live feed in Chrome
2. Tap the ⋮ menu (three dots)
3. Tap "Add to Home screen" or "Install App"
4. Tap "Add"

────────────────────────
Sent via Glimpse · ${p.cardUrl}`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
