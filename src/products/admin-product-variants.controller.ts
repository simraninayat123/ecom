import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SellerMembershipRole } from '@prisma/client';
import { SellerRoles } from '../tenants/decorators/seller-roles.decorator.js';
import { SellerAccessGuard } from '../tenants/seller-access.guard.js';
import { ProductsService } from './products.service.js';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto.js';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentSeller } from '../tenants/decorators/seller.decorator.js';
import type { Seller } from '@prisma/client';

@Controller('admin/variants')
@SellerRoles(SellerMembershipRole.MANAGER)
@UseGuards(AuthGuard('jwt'), SellerAccessGuard)
@ApiBearerAuth()
export class AdminProductVariantsController {
  constructor(private readonly productsService: ProductsService) {}

  @Patch(':id')
  update(
    @CurrentSeller() seller: Seller,
    @Param('id') id: string,
    @Body() body: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant(seller.id, id, body);
  }

  @Delete(':id')
  remove(@CurrentSeller() seller: Seller, @Param('id') id: string) {
    return this.productsService.removeVariant(seller.id, id);
  }
}
