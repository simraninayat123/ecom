import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrdersService } from './orders.service.js';

@Controller('admin/orders')
@UseGuards(AuthGuard, AdminGuard)
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
