import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryAdjustmentType, OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminOrderQueryDto, CategoryAdminDto, InventoryAdjustmentDto, ProductAdminDto, ProductImageDto, ProductVariantDto } from './admin.types.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listCategories() { return this.prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } }); }
  createCategory(data: CategoryAdminDto) { return this.prisma.category.create({ data }); }
  async updateCategory(id: string, data: Partial<CategoryAdminDto>) {
    try { return await this.prisma.category.update({ where: { id }, data }); } catch (error) { this.throwNotFoundOrConflict(error, 'Category not found'); }
  }
  async deleteCategory(id: string) {
    try { await this.prisma.category.delete({ where: { id } }); return { deleted: true }; } catch (error) { this.throwNotFoundOrConflict(error, 'Category not found'); }
  }

  listProducts() { return this.prisma.product.findMany({ orderBy: { createdAt: 'desc' }, include: { category: true, images: { orderBy: { sortOrder: 'asc' } }, variants: true } }); }
  createProduct(data: ProductAdminDto) { return this.prisma.product.create({ data, include: { category: true, images: true, variants: true } }); }
  async updateProduct(id: string, data: Partial<ProductAdminDto>) {
    try { return await this.prisma.product.update({ where: { id }, data, include: { category: true, images: true, variants: true } }); } catch (error) { this.throwNotFoundOrConflict(error, 'Product not found'); }
  }
  async deleteProduct(id: string) {
    try { await this.prisma.product.update({ where: { id }, data: { active: false, published: false } }); return { deleted: true }; } catch (error) { this.throwNotFoundOrConflict(error, 'Product not found'); }
  }

  async addImage(productId: string, data: ProductImageDto) {
    await this.requireProduct(productId);
    return this.prisma.productImage.create({ data: { ...data, productId } });
  }
  async removeImage(productId: string, imageId: string) {
    const result = await this.prisma.productImage.deleteMany({ where: { id: imageId, productId } });
    if (!result.count) throw new NotFoundException('Product image not found');
    return { deleted: true };
  }
  async addVariant(productId: string, data: ProductVariantDto) {
    await this.requireProduct(productId);
    return this.prisma.productVariant.create({ data: { ...data, productId, options: data.options as Prisma.InputJsonValue } });
  }
  async updateVariant(id: string, data: Partial<ProductVariantDto>) {
    try { return await this.prisma.productVariant.update({ where: { id }, data: { ...data, options: data.options as Prisma.InputJsonValue | undefined } }); } catch (error) { this.throwNotFoundOrConflict(error, 'Product variant not found'); }
  }
  async removeVariant(id: string) {
    try { await this.prisma.productVariant.delete({ where: { id } }); return { deleted: true }; } catch (error) { this.throwNotFoundOrConflict(error, 'Product variant not found'); }
  }

  async adjustInventory(adminId: string, productId: string, input: InventoryAdjustmentDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new NotFoundException('Product not found');
      const nextStock = input.type === 'SET' ? input.quantity : product.stock + (input.type === 'INCREASE' ? input.quantity : -input.quantity);
      if (nextStock < 0) throw new BadRequestException('Inventory cannot become negative');
      await tx.product.update({ where: { id: productId }, data: { stock: nextStock } });
      return tx.inventoryAdjustment.create({ data: { productId, createdById: adminId, type: input.type as InventoryAdjustmentType, quantity: input.quantity, reason: input.reason } });
    });
  }

  async listOrders(query: AdminOrderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = { ...(query.status ? { orderStatus: query.status as OrderStatus } : {}), ...(query.paymentStatus ? { paymentStatus: query.paymentStatus as PaymentStatus } : {}) };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({ where, include: { user: { select: { id: true, name: true, email: true } }, items: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.order.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
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
    if (status !== order.orderStatus && !allowed[order.orderStatus].includes(status)) throw new BadRequestException(`Cannot move order from ${order.orderStatus} to ${status}`);
    return this.prisma.order.update({ where: { id }, data: { orderStatus: status }, include: { items: true } });
  }

  private async requireProduct(id: string) { const product = await this.prisma.product.findUnique({ where: { id } }); if (!product) throw new NotFoundException('Product not found'); return product; }
  private throwNotFoundOrConflict(error: unknown, notFoundMessage: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') throw new NotFoundException(notFoundMessage);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('A record with that unique value already exists');
    throw error;
  }
}