import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/login.dto';
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
}
