import { SetMetadata } from '@nestjs/common';
import type { SellerMembershipRole } from '@prisma/client';

export const SELLER_ROLES_KEY = 'sellerRoles';

export const SellerRoles = (...roles: SellerMembershipRole[]) =>
  SetMetadata(SELLER_ROLES_KEY, roles);
