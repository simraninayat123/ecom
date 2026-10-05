import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
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
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = {
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
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(idOrSlug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
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

  findAllForAdmin() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
      },
    });
  }

  create(data: CreateProductDto) {
    return this.prisma.product.create({
      data,
      include: { category: true, images: true, variants: true },
    });
  }

  async update(id: string, data: UpdateProductDto) {
    try {
      return await this.prisma.product.update({
        where: { id },
        data,
        include: { category: true, images: true, variants: true },
      });
    } catch (error) {
      throwNotFoundOrConflict(error, 'Product not found');
    }
  }

  /** Soft delete: hides the product so existing orders and carts keep their reference. */
  async remove(id: string) {
    try {
      await this.prisma.product.update({
        where: { id },
        data: { active: false, published: false },
      });
      return { deleted: true };
    } catch (error) {
      throwNotFoundOrConflict(error, 'Product not found');
    }
  }

  async addImage(productId: string, data: CreateProductImageDto) {
    await this.requireProduct(productId);
    return this.prisma.productImage.create({ data: { ...data, productId } });
  }

  async removeImage(productId: string, imageId: string) {
    const result = await this.prisma.productImage.deleteMany({
      where: { id: imageId, productId },
    });
    if (!result.count) throw new NotFoundException('Product image not found');
    return { deleted: true };
  }

  async addVariant(productId: string, data: CreateProductVariantDto) {
    await this.requireProduct(productId);
    return this.prisma.productVariant.create({ data: { ...data, productId } });
  }

  async updateVariant(id: string, data: UpdateProductVariantDto) {
    try {
      return await this.prisma.productVariant.update({ where: { id }, data });
    } catch (error) {
      throwNotFoundOrConflict(error, 'Product variant not found');
    }
  }

  async removeVariant(id: string) {
    try {
      await this.prisma.productVariant.delete({ where: { id } });
      return { deleted: true };
    } catch (error) {
      throwNotFoundOrConflict(error, 'Product variant not found');
    }
  }

  /** Changes stock and records who changed it and why, in one transaction. */
  async adjustInventory(
    adminId: string,
    productId: string,
    input: AdjustInventoryDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
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
          createdById: adminId,
          type: input.type,
          quantity: input.quantity,
          reason: input.reason,
        },
      });
    });
  }

  private async requireProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
