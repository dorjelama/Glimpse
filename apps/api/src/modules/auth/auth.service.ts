import { Injectable, ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto, LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<{ token: string; user: SafeUser }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const emailVerificationToken = uuidv4();

    let user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, name: dto.name, emailVerificationToken },
    });

    user = await this.maybePromoteAdmin(user);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/auth/verify-email?token=${emailVerificationToken}`;
    // Fire-and-forget — don't block registration if mail fails
    this.mailService.sendVerificationEmail({ to: user.email, name: user.name, verifyUrl }).catch(() => {});

    const token = this.signToken(user);
    return { token, user: this.toSafe(user) };
  }

  async login(dto: LoginDto): Promise<{ token: string; user: SafeUser }> {
    let user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    user = await this.maybePromoteAdmin(user);

    const token = this.signToken(user);
    return { token, user: this.toSafe(user) };
  }

  async getMe(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.toSafe(user);
  }

  async updateMe(userId: string, dto: UpdateUserDto): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const data: { name?: string; passwordHash?: string } = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('currentPassword is required to set a new password');
      }
      const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!valid) throw new UnauthorizedException('Current password is incorrect');
      data.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    }

    const updated = await this.prisma.user.update({ where: { id: userId }, data });
    return this.toSafe(updated);
  }

  async deleteMe(userId: string): Promise<void> {
    await this.prisma.user.delete({ where: { id: userId } });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Silent return — never reveal whether email is registered
    if (!user) return;

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;
    await this.mailService.sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { passwordResetToken: token } });
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpiresAt: null },
    });
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { emailVerificationToken: token } });
    if (!user) throw new NotFoundException('Invalid verification token');
    if (user.emailVerified) return; // Already verified — idempotent

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerificationToken: null },
    });
  }

  private async maybePromoteAdmin(user: any): Promise<any> {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && user.email === adminEmail && user.role !== 'ADMIN') {
      return this.prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN', emailVerified: true, emailVerificationToken: null },
      });
    }
    return user;
  }

  private signToken(user: { id: string; email: string; name: string; role: string }): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  }

  private toSafe(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
    createdAt: Date;
  }): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }
}
