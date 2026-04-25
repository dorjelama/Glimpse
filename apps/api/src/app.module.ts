import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './modules/events/events.module';
import { ElementsModule } from './modules/elements/elements.module';
import { PublishModule } from './modules/publish/publish.module';
import { AuthModule } from './modules/auth/auth.module';
import { GuestsModule } from './modules/guests/guests.module';
import { AdminModule } from './modules/admin/admin.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { MomentsModule } from './modules/moments/moments.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'auth',
        ttl: 15 * 60 * 1000, // 15 minutes in ms
        limit: 5,
      },
    ]),
    PrismaModule,      // @Global — PrismaService available everywhere
    EventsModule,
    ElementsModule,
    PublishModule,
    AuthModule,
    GuestsModule,
    AdminModule,
    ProjectsModule,
    MomentsModule,
  ],
})
export class AppModule {}
