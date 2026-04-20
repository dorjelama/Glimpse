import { Module } from '@nestjs/common';
import { MomentsController } from './moments.controller';
import { MomentsService } from './moments.service';
import { FeedEventsService } from './feed-events.service';

@Module({
  controllers: [MomentsController],
  providers: [MomentsService, FeedEventsService],
})
export class MomentsModule {}
