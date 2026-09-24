import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CheckoutDto, OrderQueryDto } from './order.types.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(userId: string, input: CheckoutDto) {
    return this.prisma.$transaction(async (tx) => {
      const shippingAddress = await tx.address.findFirst({ where: { id: input.shippingAddressId, userId } });
      if (!shippingAddress) throw new NotFoundException('Shipping address not found');
      const cart = await tx.cart.findUnique({ where: { userId }, include: { items: { include: { product: true } } } });
      if (!cart?.items.length) throw new BadRequestException('Cart is empty');
      const billingAddress = input.billingAddressId ? await tx.address.findFirst({ where: { id: input.billingAddressId, userId } }) : null;
      if (input.billingAddressId && !billingAddress) throw new NotFoundException('Billing address not found');
      const selectedBillingAddress = billingAddress ?? shippingAddress;

      const products = await Promise.all(cart.items.map((item) => tx.product.findUnique({ where: { id: item.productId } })));
      if (products.some((product) => !product || !product.active || !product.published)) throw new BadRequestException('A cart product is no longer available');
      const currentProducts = products as NonNullable<(typeof products)[number]>[];
      for (const item of cart.items) {
        const product = currentProducts.find((candidate) => candidate.id === item.productId)!;
        const updated = await tx.product.updateMany({ where: { id: product.id, active: true, published: true, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
        if (!updated.count) throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }
      const subtotal = cart.items.reduce((sum, item) => sum + currentProducts.find((product) => product.id === item.productId)!.price * item.quantity, 0);
      const order = await tx.order.create({
        data: {
          userId, shippingAddressId: shippingAddress.id, subtotal, shipping: 0, tax: 0, discount: 0, total: subtotal, currency: currentProducts[0].currency,
          shippingRecipientName: shippingAddress.recipientName, shippingLine1: shippingAddress.line1, shippingLine2: shippingAddress.line2,
          shippingCity: shippingAddress.city, shippingState: shippingAddress.state, shippingPostalCode: shippingAddress.postalCode,
          shippingCountry: shippingAddress.country, shippingPhone: shippingAddress.phone,
          billingRecipientName: selectedBillingAddress.recipientName, billingLine1: selectedBillingAddress.line1, billingLine2: selectedBillingAddress.line2,
          billingCity: selectedBillingAddress.city, billingState: selectedBillingAddress.state, billingPostalCode: selectedBillingAddress.postalCode,
          billingCountry: selectedBillingAddress.country, billingPhone: selectedBillingAddress.phone,
          items: { create: cart.items.map((item) => { const product = currentProducts.find((candidate) => candidate.id === item.productId)!; return { productId: product.id, productName: product.name, productSku: product.sku, unitPrice: product.price, quantity: item.quantity, lineTotal: product.price * item.quantity }; }) },
        }, include: { items: true },
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return order;
    });
  }

  async findAll(userId: string, query: OrderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({ where: { userId }, include: { items: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.order.count({ where: { userId } }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({ where: { id, userId }, include: { items: true } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}