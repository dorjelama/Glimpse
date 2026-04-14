import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}

export class LoginDto {
  @ApiProperty({ example: 'alice@example.com', description: 'Registered email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'supersecret', description: 'Account password' })
  @IsString()
  password: string;
}
