import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { TenantsService } from './tenants.service.js';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenants: TenantsService) {}

  async use(
    request: Request & { seller?: unknown },
    _response: Response,
    next: NextFunction,
  ) {
    request.seller = await this.tenants.requireBySlug(
      typeof request.headers['x-seller-slug'] === 'string'
        ? request.headers['x-seller-slug']
        : undefined,
    );
    next();
  }
}
