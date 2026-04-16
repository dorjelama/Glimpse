import { Controller, Post, Body, Get, Patch, Delete, UseGuards, Request, HttpCode } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Account created. Returns a signed JWT and the new user record.',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: { id: 'uuid-...', email: 'alice@example.com', name: 'Alice', createdAt: '2025-04-14T10:00:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  @ApiResponse({ status: 400, description: 'Validation error — missing or invalid fields.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns a signed JWT and user record.',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: { id: 'uuid-...', email: 'alice@example.com', name: 'Alice', createdAt: '2025-04-14T10:00:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  @ApiResponse({ status: 400, description: 'Validation error — missing or invalid fields.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Return the currently authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'JWT is valid. Returns the decoded user payload.',
    schema: {
      example: { userId: 'uuid-...', email: 'alice@example.com', name: 'Alice' },
    },
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token.' })
  me(@Request() req: any) {
    return req.user;
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
}
