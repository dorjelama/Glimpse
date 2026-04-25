import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './modules/storage/storage.module';
import { HealthModule } from './modules/health/health.module';
import { EventsModule } from './modules/events/events.module';
import { ElementsModule } from './modules/elements/elements.module';
import { PublishModule } from './modules/publish/publish.module';
import { AuthModule } from './modules/auth/auth.module';
import { GuestsModule } from './modules/guests/guests.module';
import { AdminModule } from './modules/admin/admin.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { MomentsModule } from './modules/moments/moments.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { singleLine: true } }
          : undefined,
        redact: ['req.headers.authorization'], // Never log JWT tokens
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'auth',
        ttl: 15 * 60 * 1000, // 15 minutes in ms
        limit: 5,
      },
    ]),
    SentryModule.forRoot(),
    ScheduleModule.forRoot(),
    PrismaModule,      // @Global — PrismaService available everywhere
    StorageModule,     // @Global — StorageService available everywhere
    HealthModule,
    EventsModule,
    ElementsModule,
    PublishModule,
    AuthModule,
    GuestsModule,
    AdminModule,
    ProjectsModule,
    MomentsModule,
    MailModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
