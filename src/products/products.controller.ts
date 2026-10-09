import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { ProductQueryDto } from './dto/product-query.dto.js';
import { CurrentSeller } from '../tenants/decorators/seller.decorator.js';
import type { Seller } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get() findAll(
    @CurrentSeller() seller: Seller,
    @Query() query: ProductQueryDto,
  ) {
    return this.productsService.findAll(seller.id, query);
  }

  @Get(':idOrSlug') findOne(
    @CurrentSeller() seller: Seller,
    @Param('idOrSlug') idOrSlug: string,
  ) {
    return this.productsService.findOne(seller.id, idOrSlug);
  }
}
