import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { throwNotFoundOrConflict } from '../utils/prisma-errors.util.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async findOne(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          where: { active: true, published: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  create(data: CreateCategoryDto) {
    return this.prisma.category.create({ data });
  }

  async update(id: string, data: UpdateCategoryDto) {
    try {
      return await this.prisma.category.update({ where: { id }, data });
    } catch (error) {
      throwNotFoundOrConflict(error, 'Category not found');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.category.delete({ where: { id } });
      return { deleted: true };
    } catch (error) {
      throwNotFoundOrConflict(error, 'Category not found');
    }
  }
}
