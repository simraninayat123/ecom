import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SellerMembershipRole } from '@prisma/client';
import { SellerRoles } from '../tenants/decorators/seller-roles.decorator.js';
import { SellerAccessGuard } from '../tenants/seller-access.guard.js';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrdersService } from './orders.service.js';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentSeller } from '../tenants/decorators/seller.decorator.js';
import type { Seller } from '@prisma/client';

@Controller('admin/orders')
@SellerRoles(SellerMembershipRole.STAFF)
@UseGuards(AuthGuard('jwt'), SellerAccessGuard)
@ApiBearerAuth()
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@CurrentSeller() seller: Seller, @Query() query: AdminOrderQueryDto) {
    return this.ordersService.findAllForAdmin(seller.id, query);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentSeller() seller: Seller,
    @Param('id') id: string,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(seller.id, id, body.status);
  }
}
