import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

const EXPORT_WINDOW_DAYS = 30;
const REMINDER_7DAY_THRESHOLD = EXPORT_WINDOW_DAYS - 7;   // day 23 after end
const REMINDER_24HR_THRESHOLD = EXPORT_WINDOW_DAYS - 1;   // day 29 after end

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendExportReminders() {
    this.logger.log('Running export reminder check…');

    const now = new Date();

    // Find all ended galleries still within their export window
    const galleries = await this.prisma.gallery.findMany({
      where: {
        endedAt: { not: null },
        // Export window not yet expired
        AND: [
          {
            endedAt: {
              gt: new Date(now.getTime() - EXPORT_WINDOW_DAYS * 86_400_000),
            },
          },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            owner: { select: { email: true, name: true } },
          },
        },
      },
    });

    let sent7Day = 0;
    let sent24Hr = 0;

    for (const gallery of galleries) {
      if (!gallery.endedAt) continue;

      const daysElapsed = (now.getTime() - gallery.endedAt.getTime()) / 86_400_000;
      const daysRemaining = Math.ceil(EXPORT_WINDOW_DAYS - daysElapsed);
      const ownerEmail = gallery.project.owner.email;
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
      const moderationUrl = `${frontendUrl}/events/${gallery.project.id}/glimpses`;

      // 7-day warning: elapsed >= 23 days and not yet sent
      if (daysElapsed >= REMINDER_7DAY_THRESHOLD && !gallery.reminder7DaySentAt) {
        await this.mail.sendExportReminder({
          to: ownerEmail,
          eventTitle: gallery.project.title,
          moderationUrl,
          daysRemaining,
        });
        await this.prisma.gallery.update({
          where: { id: gallery.id },
          data: { reminder7DaySentAt: now },
        });
        sent7Day++;
      }

      // 24-hour warning: elapsed >= 29 days and not yet sent
      if (daysElapsed >= REMINDER_24HR_THRESHOLD && !gallery.reminder24HrSentAt) {
        await this.mail.sendExportReminder({
          to: ownerEmail,
          eventTitle: gallery.project.title,
          moderationUrl,
          daysRemaining: Math.max(1, daysRemaining),
        });
        await this.prisma.gallery.update({
          where: { id: gallery.id },
          data: { reminder24HrSentAt: now },
        });
        sent24Hr++;
      }
    }

    if (sent7Day + sent24Hr > 0) {
      this.logger.log(`Export reminders sent — 7-day: ${sent7Day}, 24-hr: ${sent24Hr}`);
    } else {
      this.logger.debug('No export reminders due today');
    }
  }
}
