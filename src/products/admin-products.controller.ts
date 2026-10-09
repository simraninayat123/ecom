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
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/types/jwt-payload.type.js';
import { SellerRoles } from '../tenants/decorators/seller-roles.decorator.js';
import { SellerAccessGuard } from '../tenants/seller-access.guard.js';
import { ProductsService } from './products.service.js';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto.js';
import { CreateProductImageDto } from './dto/create-product-image.dto.js';
import { CreateProductVariantDto } from './dto/create-product-variant.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentSeller } from '../tenants/decorators/seller.decorator.js';
import type { Seller } from '@prisma/client';

@Controller('admin/products')
@SellerRoles(SellerMembershipRole.STAFF)
@UseGuards(AuthGuard('jwt'), SellerAccessGuard)
@ApiBearerAuth()
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAllForAdmin(@CurrentSeller() seller: Seller) {
    return this.productsService.findAllForAdmin(seller.id);
  }

  @Post()
  create(@CurrentSeller() seller: Seller, @Body() body: CreateProductDto) {
    return this.productsService.create(seller.id, body);
  }

  @Patch(':id')
  update(
    @CurrentSeller() seller: Seller,
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.productsService.update(seller.id, id, body);
  }

  @Delete(':id')
  remove(@CurrentSeller() seller: Seller, @Param('id') id: string) {
    return this.productsService.remove(seller.id, id);
  }

  @Post(':productId/images')
  addImage(
    @CurrentSeller() seller: Seller,
    @Param('productId') productId: string,
    @Body() body: CreateProductImageDto,
  ) {
    return this.productsService.addImage(seller.id, productId, body);
  }

  @Delete(':productId/images/:imageId')
  removeImage(
    @CurrentSeller() seller: Seller,
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productsService.removeImage(seller.id, productId, imageId);
  }

  @Post(':productId/variants')
  addVariant(
    @CurrentSeller() seller: Seller,
    @Param('productId') productId: string,
    @Body() body: CreateProductVariantDto,
  ) {
    return this.productsService.addVariant(seller.id, productId, body);
  }

  @Post(':productId/inventory')
  adjustInventory(
    @CurrentUser() user: JwtPayload,
    @CurrentSeller() seller: Seller,
    @Param('productId') productId: string,
    @Body() body: AdjustInventoryDto,
  ) {
    return this.productsService.adjustInventory(
      seller.id,
      user.id,
      productId,
      body,
    );
  }
}
