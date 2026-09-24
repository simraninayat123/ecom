import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { AdminModule } from './admin/admin.module.js';
import { CartModule } from './cart/cart.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductsModule } from './products/products.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { UsersModule } from './users/users.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Joi from 'joi';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),
        JWT_SECRET: Joi.string().min(16).custom((value, helpers) => helpers.state.ancestors[0].NODE_ENV === 'production' && value === 'development-secret' ? helpers.error('any.invalid') : value).default('development-secret'),
        PORT: Joi.number().port().default(3000),
        FRONTEND_URL: Joi.string().uri().default('http://localhost:3001'),
        DEFAULT_CURRENCY: Joi.string().length(3).uppercase().default('INR'),
        NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
        RATE_LIMIT_TTL_MS: Joi.number().positive().default(60000),
        RATE_LIMIT_MAX: Joi.number().positive().default(100),
      }),
    }),
    ThrottlerModule.forRootAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (config: ConfigService) => [{ ttl: config.getOrThrow<number>('RATE_LIMIT_TTL_MS'), limit: config.getOrThrow<number>('RATE_LIMIT_MAX') }] }),
    PrismaModule,
    AuthModule,
    AdminModule,
    CartModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
