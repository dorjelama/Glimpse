import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './modules/events/events.module';
import { ElementsModule } from './modules/elements/elements.module';
import { PublishModule } from './modules/publish/publish.module';
import { AuthModule } from './modules/auth/auth.module';
import { GuestsModule } from './modules/guests/guests.module';

@Module({
  imports: [
    PrismaModule,      // @Global — PrismaService available everywhere
    EventsModule,
    ElementsModule,
    PublishModule,
    AuthModule,
    GuestsModule,
  ],
})
export class AppModule {}
