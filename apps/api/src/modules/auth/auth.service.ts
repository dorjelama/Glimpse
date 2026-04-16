import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type SafeUser = { id: string; email: string; name: string; createdAt: Date };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ token: string; user: SafeUser }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
      },
    });

    const token = this.signToken(user);
    return { token, user: this.toSafe(user) };
  }

  async login(dto: LoginDto): Promise<{ token: string; user: SafeUser }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.signToken(user);
    return { token, user: this.toSafe(user) };
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
      data.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    }

    const updated = await this.prisma.user.update({ where: { id: userId }, data });
    return this.toSafe(updated);
  }

  async deleteMe(userId: string): Promise<void> {
    await this.prisma.user.delete({ where: { id: userId } });
  }

  private signToken(user: { id: string; email: string; name: string }): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
    });
  }

  private toSafe(user: { id: string; email: string; name: string; createdAt: Date }): SafeUser {
    return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
  }
}
