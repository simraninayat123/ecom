import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProductIndexService } from '../rag/product-index.service.js';
import { PaginatedResult } from '../utils/pagination.js';
import { throwNotFoundOrConflict } from '../utils/prisma-errors.util.js';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto.js';
import { CreateProductImageDto } from './dto/create-product-image.dto.js';
import { CreateProductVariantDto } from './dto/create-product-variant.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { ProductQueryDto } from './dto/product-query.dto.js';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productIndexService: ProductIndexService,
  ) {}

  async findAll(sellerId: string, query: ProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = {
      sellerId,
      active: true,
      published: true,
      ...(query.search
        ? {
            OR: [
              {
                name: { contains: query.search, mode: 'insensitive' as const },
              },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            price: {
              ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
              ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
    };
    const orderBy =
      query.sort === 'price_asc'
        ? { price: 'asc' as const }
        : query.sort === 'price_desc'
          ? { price: 'desc' as const }
          : { createdAt: 'desc' as const };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          images: { orderBy: { sortOrder: 'asc' } },
          variants: { where: { active: true }, orderBy: { createdAt: 'asc' } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);
    return new PaginatedResult(data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }

  async findOne(sellerId: string, idOrSlug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        sellerId,
        active: true,
        published: true,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { active: true }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  findAllForAdmin(sellerId: string) {
    return this.prisma.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
      },
    });
  }

  create(sellerId: string, data: CreateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: { ...data, sellerId },
        include: { category: true, images: true, variants: true },
      });
      await this.productIndexService.enqueue(
        tx,
        sellerId,
        product.id,
        'UPSERT',
      );
      return product;
    });
  }

  async update(sellerId: string, id: string, data: UpdateProductDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.update({
          where: { id, sellerId },
          data,
          include: { category: true, images: true, variants: true },
        });
        await this.productIndexService.enqueue(
          tx,
          sellerId,
          product.id,
          'UPSERT',
        );
        return product;
      });
    } catch (error) {
      throwNotFoundOrConflict(error, 'Product not found');
    }
  }

  /** Soft delete: hides the product so existing orders and carts keep their reference. */
  async remove(sellerId: string, id: string) {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id, sellerId },
          data: { active: false, published: false },
        });
        await this.productIndexService.enqueue(tx, sellerId, id, 'DELETE');
      });
      return { deleted: true };
    } catch (error) {
      throwNotFoundOrConflict(error, 'Product not found');
    }
  }

  async addImage(
    sellerId: string,
    productId: string,
    data: CreateProductImageDto,
  ) {
    await this.requireProduct(sellerId, productId);
    return this.prisma.productImage.create({ data: { ...data, productId } });
  }

  async removeImage(sellerId: string, productId: string, imageId: string) {
    const result = await this.prisma.productImage.deleteMany({
      where: { id: imageId, productId, product: { sellerId } },
    });
    if (!result.count) throw new NotFoundException('Product image not found');
    return { deleted: true };
  }

  async addVariant(
    sellerId: string,
    productId: string,
    data: CreateProductVariantDto,
  ) {
    await this.requireProduct(sellerId, productId);
    return this.prisma.productVariant.create({ data: { ...data, productId } });
  }

  async updateVariant(
    sellerId: string,
    id: string,
    data: UpdateProductVariantDto,
  ) {
    try {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id, product: { sellerId } },
      });
      if (!variant) throw new NotFoundException('Product variant not found');
      return await this.prisma.productVariant.update({ where: { id }, data });
    } catch (error) {
      throwNotFoundOrConflict(error, 'Product variant not found');
    }
  }

  async removeVariant(sellerId: string, id: string) {
    try {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id, product: { sellerId } },
      });
      if (!variant) throw new NotFoundException('Product variant not found');
      await this.prisma.productVariant.delete({ where: { id } });
      return { deleted: true };
    } catch (error) {
      throwNotFoundOrConflict(error, 'Product variant not found');
    }
  }

  /** Changes stock and records who changed it and why, in one transaction. */
  async adjustInventory(
    sellerId: string,
    adminId: string,
    productId: string,
    input: AdjustInventoryDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: productId, sellerId },
      });
      if (!product) throw new NotFoundException('Product not found');
      const nextStock =
        input.type === 'SET'
          ? input.quantity
          : product.stock +
            (input.type === 'INCREASE' ? input.quantity : -input.quantity);
      if (nextStock < 0)
        throw new BadRequestException('Inventory cannot become negative');
      await tx.product.update({
        where: { id: productId },
        data: { stock: nextStock },
      });
      return tx.inventoryAdjustment.create({
        data: {
          productId,
          sellerId,
          createdById: adminId,
          type: input.type,
          quantity: input.quantity,
          reason: input.reason,
        },
      });
    });
  }

  private async requireProduct(sellerId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, sellerId },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
