import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AddressesModule } from './addresses/addresses.module.js';
import { AuthModule } from './auth/auth.module.js';
import authConfig from './auth/config/auth.config.js';
import { CartModule } from './cart/cart.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import appConfig from './config/app.config.js';
import type { AllConfigType } from './config/config.type.js';
import { HealthModule } from './health/health.module.js';
import { OrdersModule } from './orders/orders.module.js';
import databaseConfig from './prisma/config/database.config.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductsModule } from './products/products.module.js';
import ragConfig from './rag/config/rag.config.js';
import { RagModule } from './rag/rag.module.js';
import { UsersModule } from './users/users.module.js';
import { TenantsModule } from './tenants/tenants.module.js';
import { ShopsModule } from './shops/shops.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, ragConfig],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>) => [
        {
          ttl: config.getOrThrow('app.rateLimit.ttlMs', { infer: true }),
          limit: config.getOrThrow('app.rateLimit.max', { infer: true }),
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    CartModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    AddressesModule,
    CategoriesModule,
    HealthModule,
    RagModule,
    TenantsModule,
    ShopsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
