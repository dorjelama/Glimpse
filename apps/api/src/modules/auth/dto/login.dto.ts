import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'alice@example.com', description: 'Unique email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'supersecret', description: 'Password (minimum 6 characters)', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Alice', description: 'Display name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Cloudflare Turnstile challenge token' })
  @IsOptional()
  @IsString()
  cfTurnstileToken?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'alice@example.com', description: 'Registered email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'supersecret', description: 'Account password' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: 'Cloudflare Turnstile challenge token' })
  @IsOptional()
  @IsString()
  cfTurnstileToken?: string;
}
