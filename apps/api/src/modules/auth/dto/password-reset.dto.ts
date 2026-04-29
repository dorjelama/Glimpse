import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'a3b4c5d6-...' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'newSecurePass123', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'a3b4c5d6-...' })
  @IsString()
  token: string;
}
