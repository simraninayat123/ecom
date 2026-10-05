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
import { Role } from '@prisma/client';
import { Roles } from '../roles/roles.decorator.js';
import { RolesGuard } from '../roles/roles.guard.js';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrdersService } from './orders.service.js';

@Controller('admin/orders')
@Roles(Role.ADMIN)
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Query() query: AdminOrderQueryDto) {
    return this.ordersService.findAllForAdmin(query);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, body.status);
  }
}
