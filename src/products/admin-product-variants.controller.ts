import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { ProductsService } from './products.service.js';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto.js';

@Controller('admin/variants')
@UseGuards(AuthGuard, AdminGuard)
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
