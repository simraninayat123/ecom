import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from './auth.types.js';

/** Attaches `request.user` when a valid bearer token is sent, and lets anonymous requests through. */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) return true;
    try {
      request.user = jwt.verify(token, process.env.JWT_SECRET ?? 'development-secret') as AuthenticatedRequest['user'];
    } catch {
      // An expired or invalid token is treated as a signed-out shopper.
    }
    return true;
  }
}
