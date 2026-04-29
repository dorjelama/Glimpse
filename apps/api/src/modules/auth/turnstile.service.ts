import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class TurnstileService {
  async verify(token: string | undefined, remoteip?: string): Promise<void> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) return; // dev mode — skip when key not configured

    if (!token) throw new BadRequestException('CAPTCHA token required');

    const body = new URLSearchParams({ secret: secretKey, response: token });
    if (remoteip) body.append('remoteip', remoteip);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = (await res.json()) as { success: boolean };
    if (!data.success) throw new BadRequestException('CAPTCHA verification failed');
  }
}
