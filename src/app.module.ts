import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { CartModule } from './cart/cart.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductsModule } from './products/products.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { UsersModule } from './users/users.module.js';
import { AddressesModule } from './addresses/addresses.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Joi from 'joi';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module.js';
import authConfig from './auth/config/auth.config.js';
import appConfig from './config/app.config.js';
import type { AllConfigType } from './config/config.type.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig],
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string()
          .uri({ scheme: ['postgresql', 'postgres'] })
          .required(),
        DEFAULT_CURRENCY: Joi.string().length(3).uppercase().default('INR'),
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
      }),
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
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
