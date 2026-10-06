import { Module } from '@nestjs/common';
import { RagModule } from '../rag/rag.module.js';
import { AdminProductVariantsController } from './admin-product-variants.controller.js';
import { AdminProductsController } from './admin-products.controller.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  imports: [RagModule],
  controllers: [
    ProductsController,
    AdminProductsController,
    AdminProductVariantsController,
  ],
  providers: [ProductsService],
})
export class ProductsModule {}
