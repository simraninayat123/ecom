import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Seller } from '@prisma/client';

export const CurrentSeller = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Seller => {
    const seller = context
      .switchToHttp()
      .getRequest<{ seller?: Seller }>().seller;
    if (!seller) throw new Error('Tenant middleware did not resolve a seller');
    return seller;
  },
);
