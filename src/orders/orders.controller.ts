import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/types/jwt-payload.type.js';
import { CheckoutDto } from './dto/checkout.dto.js';
import { OrderQueryDto } from './dto/order-query.dto.js';
import { OrdersService } from './orders.service.js';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout') checkout(
    @CurrentUser() user: JwtPayload,
    @Body() body: CheckoutDto,
  ) {
    return this.ordersService.checkout(user.id, body);
  }
  @Get('orders') findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: OrderQueryDto,
  ) {
    return this.ordersService.findAll(user.id, query);
  }
  @Get('orders/:id') findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.ordersService.findOne(user.id, id);
  }
}
