import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from './auth.types.js';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('A bearer token is required');

    try {
      request.user = jwt.verify(token, process.env.JWT_SECRET ?? 'development-secret') as AuthenticatedRequest['user'];
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}