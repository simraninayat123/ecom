import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminOrderQueryDto } from './admin.types.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrders(query: AdminOrderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = {
      ...(query.status ? { orderStatus: query.status as OrderStatus } : {}),
      ...(query.paymentStatus
        ? { paymentStatus: query.paymentStatus as PaymentStatus }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateOrderStatus(id: string, nextStatus: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      SHIPPED: [OrderStatus.DELIVERED],
      DELIVERED: [],
      CANCELLED: [],
    };
    const status = nextStatus as OrderStatus;
    if (
      status !== order.orderStatus &&
      !allowed[order.orderStatus].includes(status)
    )
      throw new BadRequestException(
        `Cannot move order from ${order.orderStatus} to ${status}`,
      );
    return this.prisma.order.update({
      where: { id },
      data: { orderStatus: status },
      include: { items: true },
    });
  }
}
