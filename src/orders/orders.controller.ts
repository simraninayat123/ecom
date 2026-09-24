import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { CheckoutDto, OrderQueryDto } from './order.types.js';
import { OrdersService } from './orders.service.js';

@Controller()
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout') checkout(@Req() request: AuthenticatedRequest, @Body() body: CheckoutDto) { return this.ordersService.checkout(request.user.id, body); }
  @Get('orders') findAll(@Req() request: AuthenticatedRequest, @Query() query: OrderQueryDto) { return this.ordersService.findAll(request.user.id, query); }
  @Get('orders/:id') findOne(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return this.ordersService.findOne(request.user.id, id); }
}