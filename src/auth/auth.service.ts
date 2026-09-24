import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service.js';

type Credentials = { email: string; password: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async register(credentials: Credentials & { name: string }) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: credentials.email } });
    if (existingUser) throw new ConflictException('An account with that email already exists');

    const user = await this.prisma.user.create({
      data: {
        email: credentials.email,
        name: credentials.name,
        passwordHash: await bcrypt.hash(credentials.password, 12),
      },
    });
    return this.issueToken(user);
  }

  async login(credentials: Credentials) {
    const user = await this.prisma.user.findUnique({ where: { email: credentials.email } });
    if (!user || !(await bcrypt.compare(credentials.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issueToken(user);
  }

  private issueToken(user: { id: string; email: string; name: string; role: 'CUSTOMER' | 'ADMIN' }) {
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET ?? 'development-secret', { expiresIn: '7d' });
    return { accessToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  }
}