import { Controller, Post, Body, Get, Patch, Delete, UseGuards, Request, Req, HttpCode } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { TurnstileService } from './turnstile.service';
import { RegisterDto, LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from './dto/password-reset.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly turnstile: TurnstileService,
  ) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Account created. Returns a signed JWT and the new user record. A verification email is sent.',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: { id: 'uuid-...', email: 'alice@example.com', name: 'Alice', emailVerified: false, createdAt: '2025-04-14T10:00:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  @ApiResponse({ status: 400, description: 'Validation error — missing or invalid fields.' })
  @ApiResponse({ status: 429, description: 'Too many requests — try again in 15 minutes.' })
  async register(@Body() dto: RegisterDto, @Req() req: any) {
    await this.turnstile.verify(dto.cfTurnstileToken, req.ip);
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns a signed JWT and user record.',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: { id: 'uuid-...', email: 'alice@example.com', name: 'Alice', emailVerified: true, createdAt: '2025-04-14T10:00:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  @ApiResponse({ status: 400, description: 'Validation error — missing or invalid fields.' })
  @ApiResponse({ status: 429, description: 'Too many requests — try again in 15 minutes.' })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    await this.turnstile.verify(dto.cfTurnstileToken, req.ip);
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Return the currently authenticated user (fresh DB read)' })
  @ApiResponse({
    status: 200,
    schema: {
      example: { id: 'uuid-...', email: 'alice@example.com', name: 'Alice', emailVerified: true, createdAt: '2025-04-14T10:00:00.000Z' },
    },
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token.' })
  me(@Request() req: any) {
    return this.authService.getMe(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update current user name or password' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated. Returns updated user record.' })
  @ApiResponse({ status: 400, description: 'currentPassword required when changing password.' })
  @ApiResponse({ status: 401, description: 'Missing token or incorrect current password.' })
  updateMe(@Request() req: any, @Body() dto: UpdateUserDto) {
    return this.authService.updateMe(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @HttpCode(204)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Delete current user account and all their events' })
  @ApiResponse({ status: 204, description: 'Account deleted.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token.' })
  deleteMe(@Request() req: any) {
    return this.authService.deleteMe(req.user.userId);
  }

  @Post('forgot-password')
  @UseGuards(ThrottlerGuard)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Request a password reset email',
    description: 'Always returns 200 — never reveals whether the email is registered.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'If that email is registered, a reset link has been sent.' })
  @ApiResponse({ status: 429, description: 'Too many requests.' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: "If that email is registered, we've sent a reset link. Check your inbox." };
  }

  @Post('reset-password')
  @UseGuards(ThrottlerGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset password using a token from the reset email' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
  @ApiResponse({ status: 429, description: 'Too many requests.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password updated. You can now log in with your new password.' };
  }

  @Post('verify-email')
  @UseGuards(ThrottlerGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify email address using the token from the verification email' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ status: 200, description: 'Email verified.' })
  @ApiResponse({ status: 404, description: 'Invalid verification token.' })
  @ApiResponse({ status: 429, description: 'Too many requests.' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto.token);
    return { emailVerified: true };
  }
}
