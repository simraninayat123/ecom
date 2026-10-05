import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@prisma/client';
import type { JwtPayload } from '../auth/strategies/types/jwt-payload.type.js';
import { ROLES_KEY } from './roles.decorator.js';

/** Allows the request only if request.user has one of the roles set with @Roles(). Run after AuthGuard('jwt'). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // A method-level @Roles() overrides a class-level one.
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles?.length) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission to do this');
    }
    return true;
  }
}
