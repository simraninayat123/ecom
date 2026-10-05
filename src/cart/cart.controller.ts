import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/types/jwt-payload.type.js';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';
import { CartService } from './cart.service.js';

@Controller('cart')
@UseGuards(AuthGuard('jwt'))
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get() get(@CurrentUser() user: JwtPayload) {
    return this.cartService.getCart(user.id);
  }
  @Post('items') add(
    @CurrentUser() user: JwtPayload,
    @Body() body: AddCartItemDto,
  ) {
    return this.cartService.addItem(user.id, body.productId, body.quantity);
  }
  @Patch('items/:itemId') update(
    @CurrentUser() user: JwtPayload,
    @Param('itemId') itemId: string,
    @Body() body: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.id, itemId, body.quantity);
  }
  @Delete('items/:itemId') remove(
    @CurrentUser() user: JwtPayload,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeItem(user.id, itemId);
  }
  @Delete() clear(@CurrentUser() user: JwtPayload) {
    return this.cartService.clear(user.id);
  }
}
