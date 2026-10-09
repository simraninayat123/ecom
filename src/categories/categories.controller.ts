import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { CurrentSeller } from '../tenants/decorators/seller.decorator.js';
import type { Seller } from '@prisma/client';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get() findAll(@CurrentSeller() seller: Seller) {
    return this.categoriesService.findAll(seller.id);
  }

  @Get(':slug') findOne(
    @CurrentSeller() seller: Seller,
    @Param('slug') slug: string,
  ) {
    return this.categoriesService.findOne(seller.id, slug);
  }
}
