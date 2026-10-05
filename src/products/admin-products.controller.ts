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
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/types/jwt-payload.type.js';
import { Roles } from '../roles/roles.decorator.js';
import { RolesGuard } from '../roles/roles.guard.js';
import { ProductsService } from './products.service.js';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto.js';
import { CreateProductImageDto } from './dto/create-product-image.dto.js';
import { CreateProductVariantDto } from './dto/create-product-variant.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('admin/products')
@Roles(Role.ADMIN)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAllForAdmin() {
    return this.productsService.findAllForAdmin();
  }

  @Post()
  create(@Body() body: CreateProductDto) {
    return this.productsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post(':productId/images')
  addImage(
    @Param('productId') productId: string,
    @Body() body: CreateProductImageDto,
  ) {
    return this.productsService.addImage(productId, body);
  }

  @Delete(':productId/images/:imageId')
  removeImage(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productsService.removeImage(productId, imageId);
  }

  @Post(':productId/variants')
  addVariant(
    @Param('productId') productId: string,
    @Body() body: CreateProductVariantDto,
  ) {
    return this.productsService.addVariant(productId, body);
  }

  @Post(':productId/inventory')
  adjustInventory(
    @CurrentUser() user: JwtPayload,
    @Param('productId') productId: string,
    @Body() body: AdjustInventoryDto,
  ) {
    return this.productsService.adjustInventory(user.id, productId, body);
  }
}
