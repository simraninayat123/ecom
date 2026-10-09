import { Controller, Get, Param } from '@nestjs/common';
import { ShopsService } from './shops.service.js';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  findAll() {
    return this.shopsService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.shopsService.findOne(slug);
  }

  @Get(':slug/products')
  findProducts(@Param('slug') slug: string) {
    return this.shopsService.findProducts(slug);
  }

  @Get(':slug/products/:idOrSlug')
  findProduct(
    @Param('slug') slug: string,
    @Param('idOrSlug') idOrSlug: string,
  ) {
    return this.shopsService.findProduct(slug, idOrSlug);
  }
}
