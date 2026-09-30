import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmbeddingService } from './embedding.service.js';
import { GenerationService } from './generation.service.js';
import type { ProductSearchFilters, RecommendationProduct, RecommendationResponse } from './rag.types.js';

@Injectable()
export class RagService {
  constructor(private readonly prisma: PrismaService, private readonly embeddings: EmbeddingService, private readonly config: ConfigService, private readonly generation: GenerationService) {}

  async recommend(query: string, requestedLimit?: number): Promise<RecommendationResponse> {
    const limit = requestedLimit ?? Number(this.config.get('RAG_RETRIEVAL_LIMIT') ?? 5);
    const products = await this.searchProducts(query, {}, limit);
    if (!products.length) return { answer: 'The catalog does not currently contain a confident match. Try different requirements, materials, or use cases.', products: [], answerSource: 'template' };
    const generated = await this.generation.generateAnswer(query.trim(), products);
    if (generated) return { answer: generated, products, answerSource: 'llm' };
    const first = products[0];
    return { answer: `Based on your request, ${first.name} is a strong match because ${this.groundedReason(first.description)}.`, products, answerSource: 'template' };
  }

  /** Semantic search over indexed products, then narrowed by structured filters on live product data. */
  async searchProducts(query: string, filters: ProductSearchFilters = {}, limit = 5): Promise<RecommendationProduct[]> {
    const minSimilarity = Number(this.config.get('RAG_MIN_SIMILARITY') ?? 0.35);
    const [vector] = await this.embeddings.embed([query.trim()]);
    const vectorLiteral = `[${vector.join(',')}]`;
    // Over-fetch so structured filters still leave enough semantic matches.
    const candidates = this.hasFilters(filters) ? Math.min(limit * 5, 50) : limit;
    const matches = await this.prisma.$queryRaw<Array<{ productId: string; similarity: number }>>(Prisma.sql`
      SELECT "productId", 1 - ("embedding" <=> ${vectorLiteral}::vector) AS similarity
      FROM "ProductEmbedding"
      WHERE 1 - ("embedding" <=> ${vectorLiteral}::vector) >= ${minSimilarity}
      ORDER BY "embedding" <=> ${vectorLiteral}::vector
      LIMIT ${candidates}
    `);
    return this.hydrate(matches, filters, limit);
  }

  /** Nearest neighbours of an already indexed product, excluding the product itself. */
  async similarProducts(productId: string, filters: ProductSearchFilters = {}, limit = 5): Promise<RecommendationProduct[]> {
    const candidates = this.hasFilters(filters) ? Math.min(limit * 5, 50) : limit;
    const matches = await this.prisma.$queryRaw<Array<{ productId: string; similarity: number }>>(Prisma.sql`
      SELECT other."productId", 1 - (other."embedding" <=> source."embedding") AS similarity
      FROM "ProductEmbedding" AS other, "ProductEmbedding" AS source
      WHERE source."productId" = ${productId} AND other."productId" <> ${productId}
      ORDER BY other."embedding" <=> source."embedding"
      LIMIT ${candidates}
    `);
    return this.hydrate(matches, filters, limit);
  }

  private hasFilters(filters: ProductSearchFilters) {
    return filters.minPrice !== undefined || filters.maxPrice !== undefined || Boolean(filters.category) || Boolean(filters.inStockOnly);
  }

  /** Loads current product rows for vector matches, keeping similarity order and dropping hidden products. */
  private async hydrate(matches: Array<{ productId: string; similarity: number }>, filters: ProductSearchFilters, limit: number): Promise<RecommendationProduct[]> {
    if (!matches.length) return [];
    const where: Prisma.ProductWhereInput = {
      id: { in: matches.map((match) => match.productId) },
      active: true,
      published: true,
      ...(filters.minPrice !== undefined || filters.maxPrice !== undefined ? { price: { ...(filters.minPrice !== undefined && { gte: filters.minPrice }), ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }) } } : {}),
      ...(filters.category ? { category: { OR: [{ slug: filters.category }, { name: { equals: filters.category, mode: 'insensitive' } }] } } : {}),
      ...(filters.inStockOnly ? { stock: { gt: 0 } } : {}),
    };
    const current = await this.prisma.product.findMany({ where, include: { category: true } });
    const byId = new Map(current.map((product) => [product.id, product]));
    return matches.flatMap((match) => {
      const product = byId.get(match.productId);
      if (!product) return [];
      return [{ ...product, similarity: Number(match.similarity), category: product.category ? { name: product.category.name, slug: product.category.slug } : null }];
    }).slice(0, limit);
  }

  private groundedReason(description: string) {
    const sentence = description.split(/[.!?]/)[0]?.trim();
    return sentence ? sentence.charAt(0).toLowerCase() + sentence.slice(1) : 'its product description matches your request';
  }
}