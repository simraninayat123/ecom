import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { ProductsService } from './products.service.js';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto.js';
import { CreateProductImageDto } from './dto/create-product-image.dto.js';
import { CreateProductVariantDto } from './dto/create-product-variant.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@Controller('admin/products')
@UseGuards(AuthGuard, AdminGuard)
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
    @Req() request: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Body() body: AdjustInventoryDto,
  ) {
    return this.productsService.adjustInventory(
      request.user.id,
      productId,
      body,
    );
  }
}
