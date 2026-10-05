import { Module } from '@nestjs/common';
import { AdminProductVariantsController } from './admin-product-variants.controller.js';
import { AdminProductsController } from './admin-products.controller.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  controllers: [
    ProductsController,
    AdminProductsController,
    AdminProductVariantsController,
  ],
  providers: [ProductsService],
})
export class ProductsModule {}
