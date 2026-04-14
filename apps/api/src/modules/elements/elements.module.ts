import { Module } from '@nestjs/common';
import { ElementsController } from './elements.controller';
import { ElementsService } from './elements.service';

// PrismaModule is @Global() — no import needed here.
// ElementsService now injects PrismaService directly; ProjectsModule no longer required.
@Module({
  controllers: [ElementsController],
  providers: [ElementsService],
})
export class ElementsModule {}
