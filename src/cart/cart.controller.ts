import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { AddCartItemDto, UpdateCartItemDto } from './cart.types.js';
import { CartService } from './cart.service.js';

@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get() get(@Req() request: AuthenticatedRequest) { return this.cartService.getCart(request.user.id); }
  @Post('items') add(@Req() request: AuthenticatedRequest, @Body() body: AddCartItemDto) { return this.cartService.addItem(request.user.id, body.productId, body.quantity); }
  @Patch('items/:itemId') update(@Req() request: AuthenticatedRequest, @Param('itemId') itemId: string, @Body() body: UpdateCartItemDto) { return this.cartService.updateItem(request.user.id, itemId, body.quantity); }
  @Delete('items/:itemId') remove(@Req() request: AuthenticatedRequest, @Param('itemId') itemId: string) { return this.cartService.removeItem(request.user.id, itemId); }
  @Delete() clear(@Req() request: AuthenticatedRequest) { return this.cartService.clear(request.user.id); }
}