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
import { AdminService } from './admin.service.js';
import { AdminOrderQueryDto, UpdateOrderStatusDto } from './admin.types.js';

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('orders') listOrders(@Query() query: AdminOrderQueryDto) {
    return this.adminService.listOrders(query);
  }
  @Patch('orders/:id/status') updateOrderStatus(
    @Param('id') id: string,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(id, body.status);
  }
}
