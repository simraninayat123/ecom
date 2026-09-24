import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { ProductQueryDto } from './products.types.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get() findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':idOrSlug') findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.productsService.findOne(idOrSlug);
  }
}