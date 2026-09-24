import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { AdminService } from './admin.service.js';
import { AdminOrderQueryDto, CategoryAdminDto, InventoryAdjustmentDto, ProductAdminDto, ProductImageDto, ProductVariantDto, UpdateCategoryAdminDto, UpdateOrderStatusDto, UpdateProductAdminDto, UpdateProductVariantDto } from './admin.types.js';

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('categories') listCategories() { return this.adminService.listCategories(); }
  @Post('categories') createCategory(@Body() body: CategoryAdminDto) { return this.adminService.createCategory(body); }
  @Patch('categories/:id') updateCategory(@Param('id') id: string, @Body() body: UpdateCategoryAdminDto) { return this.adminService.updateCategory(id, body); }
  @Delete('categories/:id') deleteCategory(@Param('id') id: string) { return this.adminService.deleteCategory(id); }

  @Get('products') listProducts() { return this.adminService.listProducts(); }
  @Post('products') createProduct(@Body() body: ProductAdminDto) { return this.adminService.createProduct(body); }
  @Patch('products/:id') updateProduct(@Param('id') id: string, @Body() body: UpdateProductAdminDto) { return this.adminService.updateProduct(id, body); }
  @Delete('products/:id') deleteProduct(@Param('id') id: string) { return this.adminService.deleteProduct(id); }
  @Post('products/:productId/images') addImage(@Param('productId') productId: string, @Body() body: ProductImageDto) { return this.adminService.addImage(productId, body); }
  @Delete('products/:productId/images/:imageId') removeImage(@Param('productId') productId: string, @Param('imageId') imageId: string) { return this.adminService.removeImage(productId, imageId); }
  @Post('products/:productId/variants') addVariant(@Param('productId') productId: string, @Body() body: ProductVariantDto) { return this.adminService.addVariant(productId, body); }
  @Patch('variants/:id') updateVariant(@Param('id') id: string, @Body() body: UpdateProductVariantDto) { return this.adminService.updateVariant(id, body); }
  @Delete('variants/:id') removeVariant(@Param('id') id: string) { return this.adminService.removeVariant(id); }
  @Post('products/:productId/inventory') adjustInventory(@Req() request: AuthenticatedRequest, @Param('productId') productId: string, @Body() body: InventoryAdjustmentDto) { return this.adminService.adjustInventory(request.user.id, productId, body); }
  @Get('orders') listOrders(@Query() query: AdminOrderQueryDto) { return this.adminService.listOrders(query); }
  @Patch('orders/:id/status') updateOrderStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) { return this.adminService.updateOrderStatus(id, body.status); }
}