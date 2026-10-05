import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthLoginDto } from './dto/auth-login.dto.js';
import { AuthRegisterDto } from './dto/auth-register.dto.js';
import type { JwtPayload } from './strategies/types/jwt-payload.type.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: AuthRegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser)
      throw new ConflictException('An account with that email already exists');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash: await bcrypt.hash(dto.password, 12),
      },
    });
    return this.issueToken(user);
  }

  async login(dto: AuthLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issueToken(user);
  }

  private issueToken(user: Pick<User, 'id' | 'email' | 'name' | 'role'>) {
    // Typed as JwtPayload so the token's contents always match what JwtStrategy reads back.
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
