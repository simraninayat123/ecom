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
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentSeller } from '../tenants/decorators/seller.decorator.js';
import type { Seller } from '@prisma/client';

@Controller('cart')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get() get(@CurrentUser() user: JwtPayload, @CurrentSeller() seller: Seller) {
    return this.cartService.getCart(user.id, seller.id);
  }
  @Post('items') add(
    @CurrentUser() user: JwtPayload,
    @Body() body: AddCartItemDto,
    @CurrentSeller() seller: Seller,
  ) {
    return this.cartService.addItem(
      user.id,
      seller.id,
      body.productId,
      body.quantity,
    );
  }
  @Patch('items/:itemId') update(
    @CurrentUser() user: JwtPayload,
    @Param('itemId') itemId: string,
    @Body() body: UpdateCartItemDto,
    @CurrentSeller() seller: Seller,
  ) {
    return this.cartService.updateItem(
      user.id,
      seller.id,
      itemId,
      body.quantity,
    );
  }
  @Delete('items/:itemId') remove(
    @CurrentUser() user: JwtPayload,
    @Param('itemId') itemId: string,
    @CurrentSeller() seller: Seller,
  ) {
    return this.cartService.removeItem(user.id, seller.id, itemId);
  }
  @Delete() clear(
    @CurrentUser() user: JwtPayload,
    @CurrentSeller() seller: Seller,
  ) {
    return this.cartService.clear(user.id, seller.id);
  }
}
