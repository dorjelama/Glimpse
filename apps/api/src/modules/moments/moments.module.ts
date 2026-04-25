import { Module } from '@nestjs/common';
import { MomentsController } from './moments.controller';
import { MomentsService } from './moments.service';
import { FeedEventsService } from './feed-events.service';
import { ReminderService } from './reminder.service';

@Module({
  controllers: [MomentsController],
  providers: [MomentsService, FeedEventsService, ReminderService],
})
export class MomentsModule {}
