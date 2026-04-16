import { Module } from '@nestjs/common';
import { ElementsController } from './elements.controller';
import { ElementsService } from './elements.service';

// PrismaModule is @Global() — no import needed here.
// ElementsService and ElementsController both inject PrismaService directly.
@Module({
  controllers: [ElementsController],
  providers: [ElementsService],
})
export class ElementsModule {}
