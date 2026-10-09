import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TenantMiddleware } from './tenant.middleware.js';
import { TenantsService } from './tenants.service.js';
import { SellerAccessGuard } from './seller-access.guard.js';

@Module({
  providers: [TenantsService, SellerAccessGuard],
  exports: [TenantsService, SellerAccessGuard],
})
export class TenantsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude('auth/(.*)', 'health/(.*)')
      .forRoutes('*');
  }
}
