import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SellerMembershipRole } from '@prisma/client';
import { SellerRoles } from '../tenants/decorators/seller-roles.decorator.js';
import { SellerAccessGuard } from '../tenants/seller-access.guard.js';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentSeller } from '../tenants/decorators/seller.decorator.js';
import type { Seller } from '@prisma/client';

@Controller('admin/categories')
@SellerRoles(SellerMembershipRole.MANAGER)
@UseGuards(AuthGuard('jwt'), SellerAccessGuard)
@ApiBearerAuth()
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@CurrentSeller() seller: Seller) {
    return this.categoriesService.findAll(seller.id);
  }

  @Post()
  create(@CurrentSeller() seller: Seller, @Body() body: CreateCategoryDto) {
    return this.categoriesService.create(seller.id, body);
  }

  @Patch(':id')
  update(
    @CurrentSeller() seller: Seller,
    @Param('id') id: string,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(seller.id, id, body);
  }

  @Delete(':id')
  remove(@CurrentSeller() seller: Seller, @Param('id') id: string) {
    return this.categoriesService.remove(seller.id, id);
  }
}
