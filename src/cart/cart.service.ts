import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateCart(userId: string) {
    return this.prisma.cart.upsert({ where: { userId }, create: { userId }, update: {}, include: { items: { include: { product: true }, orderBy: { createdAt: 'asc' } } } });
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    return this.present(cart);
  }

  async addItem(userId: string, productId: string, quantity: number) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, active: true, published: true } });
    if (!product) throw new NotFoundException('Product not found');
    const cart = await this.getOrCreateCart(userId);
    const existing = await this.prisma.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    if (nextQuantity > product.stock) throw new BadRequestException('Requested quantity exceeds available stock');
    await this.prisma.cartItem.upsert({ where: { cartId_productId: { cartId: cart.id, productId } }, create: { cartId: cart.id, productId, quantity }, update: { quantity: nextQuantity } });
    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, cart: { userId } }, include: { product: true } });
    if (!item) throw new NotFoundException('Cart item not found');
    if (!item.product.active || !item.product.published || quantity > item.product.stock) throw new BadRequestException('Requested quantity exceeds available stock');
    await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const result = await this.prisma.cartItem.deleteMany({ where: { id: itemId, cart: { userId } } });
    if (!result.count) throw new NotFoundException('Cart item not found');
    return this.getCart(userId);
  }

  async clear(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getCart(userId);
  }

  private present(cart: Awaited<ReturnType<CartService['getOrCreateCart']>>) {
    const items = cart.items.map((item) => ({ ...item, lineTotal: item.quantity * item.product.price }));
    return { ...cart, items, subtotal: items.reduce((total, item) => total + item.lineTotal, 0), currency: items[0]?.product.currency ?? 'INR' };
  }
}