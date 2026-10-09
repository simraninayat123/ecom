import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SellerMembershipRole } from '@prisma/client';
import type { JwtPayload } from '../auth/strategies/types/jwt-payload.type.js';
import { SELLER_ROLES_KEY } from './decorators/seller-roles.decorator.js';
import { TenantsService } from './tenants.service.js';

const ROLE_LEVEL: Record<SellerMembershipRole, number> = {
  STAFF: 1,
  MANAGER: 2,
  OWNER: 3,
};

@Injectable()
export class SellerAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenants: TenantsService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      user?: JwtPayload;
      seller?: { id: string };
      sellerMembership?: unknown;
    }>();
    if (!request.user) throw new UnauthorizedException();
    if (!request.seller)
      throw new ForbiddenException('Seller context is required');

    const membership = await this.tenants.requireMembership(
      request.seller.id,
      request.user.id,
    );
    const required = this.reflector.getAllAndOverride<
      SellerMembershipRole[] | undefined
    >(SELLER_ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (
      required?.length &&
      !required.some((role) => ROLE_LEVEL[membership.role] >= ROLE_LEVEL[role])
    ) {
      throw new ForbiddenException('Insufficient seller permissions');
    }
    request.sellerMembership = membership;
    return true;
  }
}
