import { Module } from '@nestjs/common';
import { PublishController } from './publish.controller';
import { PublishService } from './publish.service';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ProjectsModule],
  controllers: [PublishController],
  providers: [PublishService],
})
export class PublishModule {}
