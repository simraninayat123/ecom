import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { SellerMembership } from '@prisma/client';

export const CurrentMembership = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SellerMembership =>
    context.switchToHttp().getRequest<{ sellerMembership: SellerMembership }>()
      .sellerMembership,
);
