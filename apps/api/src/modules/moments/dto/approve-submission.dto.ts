import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveSubmissionDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  approved: boolean;
}
