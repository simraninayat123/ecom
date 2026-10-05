import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { Roles } from '../roles/roles.decorator.js';
import { RolesGuard } from '../roles/roles.guard.js';
import { ProductsService } from './products.service.js';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto.js';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('admin/variants')
@Roles(Role.ADMIN)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AdminProductVariantsController {
  constructor(private readonly productsService: ProductsService) {}

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateProductVariantDto) {
    return this.productsService.updateVariant(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.removeVariant(id);
  }
}
