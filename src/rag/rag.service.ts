import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import type { AllConfigType } from '../config/config.type.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { RagConfig } from './config/rag-config.type.js';
import { EmbeddingService } from './embedding.service.js';
import { GenerationService } from './generation.service.js';
import type {
  ProductSearchFilters,
  RecommendationProduct,
  RecommendationResponse,
} from './rag.types.js';

@Injectable()
export class RagService {
  private readonly retrieval: RagConfig['retrieval'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingService,
    configService: ConfigService<AllConfigType>,
    private readonly generation: GenerationService,
  ) {
    this.retrieval = configService.getOrThrow('rag.retrieval', {
      infer: true,
    });
  }

  async recommend(
    query: string,
    requestedLimit?: number,
    sellerId?: string,
  ): Promise<RecommendationResponse> {
    const limit = requestedLimit ?? this.retrieval.limit;
    const products = await this.searchProducts(query, {}, limit, sellerId);
    if (!products.length)
      return {
        answer:
          'The catalog does not currently contain a confident match. Try different requirements, materials, or use cases.',
        products: [],
        answerSource: 'template',
      };
    const generated = await this.generation.generateAnswer(
      query.trim(),
      products,
    );
    if (generated) return { answer: generated, products, answerSource: 'llm' };
    const first = products[0];
    return {
      answer: `Based on your request, ${first.name} is a strong match because ${this.groundedReason(first.description)}.`,
      products,
      answerSource: 'template',
    };
  }

  /** Semantic search over indexed products, then narrowed by structured filters on live product data. */
  async searchProducts(
    query: string,
    filters: ProductSearchFilters = {},
    limit = 5,
    sellerId?: string,
  ): Promise<RecommendationProduct[]> {
    const keywordMatches = await this.keywordSearch(
      query,
      filters,
      limit,
      sellerId,
    );
    if (keywordMatches.length) return keywordMatches;

    const { minSimilarity } = this.retrieval;
    let vector: number[];
    try {
      [vector] = await this.embeddings.embed([query.trim()]);
    } catch {
      return [];
    }
    const vectorLiteral = `[${vector.join(',')}]`;
    // Over-fetch so structured filters still leave enough semantic matches.
    const candidates = this.hasFilters(filters)
      ? Math.min(limit * 5, 50)
      : limit;
    const matches = await this.prisma.$queryRaw<
      Array<{ productId: string; similarity: number }>
    >(Prisma.sql`
      SELECT "productId", 1 - ("embedding" <=> ${vectorLiteral}::vector) AS similarity
      FROM "ProductEmbedding"
      WHERE 1 - ("embedding" <=> ${vectorLiteral}::vector) >= ${minSimilarity}
      ${sellerId ? Prisma.sql`AND "sellerId" = ${sellerId}` : Prisma.empty}
      ORDER BY "embedding" <=> ${vectorLiteral}::vector
      LIMIT ${candidates}
    `);
    return this.hydrate(matches, filters, limit, sellerId);
  }

  private async keywordSearch(
    query: string,
    filters: ProductSearchFilters,
    limit: number,
    sellerId?: string,
  ) {
    const text = query.trim();
    if (!text || !this.prisma.product) return [];
    const terms = text
      .toLowerCase()
      .split(/\s+/)
      .map((term) => term.replace(/[^a-z0-9]/g, ''))
      .filter((term) => term.length >= 3)
      .filter(
        (term) => !['the', 'for', 'and', 'with', 'from', 'some'].includes(term),
      );
    const products = await this.prisma.product.findMany({
      where: {
        ...(sellerId ? { sellerId } : {}),
        active: true,
        published: true,
        OR: [
          { name: { equals: text, mode: 'insensitive' } },
          { slug: { equals: text, mode: 'insensitive' } },
          { sku: { equals: text, mode: 'insensitive' } },
          { name: { contains: text, mode: 'insensitive' } },
          { description: { contains: text, mode: 'insensitive' } },
          ...terms.flatMap((term) => [
            { name: { contains: term, mode: 'insensitive' as const } },
            { description: { contains: term, mode: 'insensitive' as const } },
          ]),
        ],
      },
      include: { category: true },
      take: Math.min(limit * 3, 15),
    });
    const normalized = text.toLowerCase();
    const ranked = products.sort((a, b) => {
      const score = (product: typeof a) =>
        [product.name, product.slug, product.sku].some(
          (value) => value.toLowerCase() === normalized,
        )
          ? 0
          : product.name.toLowerCase().startsWith(normalized)
            ? 1
            : 2;
      return score(a) - score(b);
    });
    return ranked
      .filter(
        (product) =>
          filters.minPrice === undefined || product.price >= filters.minPrice,
      )
      .filter(
        (product) =>
          filters.maxPrice === undefined || product.price <= filters.maxPrice,
      )
      .filter((product) => !filters.inStockOnly || product.stock > 0)
      .filter(
        (product) =>
          !filters.category ||
          product.category?.slug === filters.category ||
          product.category?.name.toLowerCase() ===
            filters.category.toLowerCase(),
      )
      .slice(0, limit)
      .map((product) => ({
        ...product,
        similarity: 1,
        category: product.category
          ? { name: product.category.name, slug: product.category.slug }
          : null,
      }));
  }

  /** Nearest neighbours of an already indexed product, excluding the product itself. */
  async similarProducts(
    productId: string,
    filters: ProductSearchFilters = {},
    limit = 5,
  ): Promise<RecommendationProduct[]> {
    const candidates = this.hasFilters(filters)
      ? Math.min(limit * 5, 50)
      : limit;
    const matches = await this.prisma.$queryRaw<
      Array<{ productId: string; similarity: number }>
    >(Prisma.sql`
      SELECT other."productId", 1 - (other."embedding" <=> source."embedding") AS similarity
      FROM "ProductEmbedding" AS other, "ProductEmbedding" AS source
      WHERE source."productId" = ${productId} AND other."productId" <> ${productId}
      ORDER BY other."embedding" <=> source."embedding"
      LIMIT ${candidates}
    `);
    return this.hydrate(matches, filters, limit);
  }

  private hasFilters(filters: ProductSearchFilters) {
    return (
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      Boolean(filters.category) ||
      Boolean(filters.inStockOnly)
    );
  }

  /** Loads current product rows for vector matches, keeping similarity order and dropping hidden products. */
  private async hydrate(
    matches: Array<{ productId: string; similarity: number }>,
    filters: ProductSearchFilters,
    limit: number,
    sellerId?: string,
  ): Promise<RecommendationProduct[]> {
    if (!matches.length) return [];
    const where: Prisma.ProductWhereInput = {
      id: { in: matches.map((match) => match.productId) },
      ...(sellerId ? { sellerId } : {}),
      active: true,
      published: true,
      ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
        ? {
            price: {
              ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
              ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
            },
          }
        : {}),
      ...(filters.category
        ? {
            category: {
              OR: [
                { slug: filters.category },
                { name: { equals: filters.category, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
      ...(filters.inStockOnly ? { stock: { gt: 0 } } : {}),
    };
    const current = await this.prisma.product.findMany({
      where,
      include: { category: true },
    });
    const byId = new Map(current.map((product) => [product.id, product]));
    return matches
      .flatMap((match) => {
        const product = byId.get(match.productId);
        if (!product) return [];
        return [
          {
            ...product,
            similarity: Number(match.similarity),
            category: product.category
              ? { name: product.category.name, slug: product.category.slug }
              : null,
          },
        ];
      })
      .slice(0, limit);
  }

  private groundedReason(description: string) {
    const sentence = description.split(/[.!?]/)[0]?.trim();
    return sentence
      ? sentence.charAt(0).toLowerCase() + sentence.slice(1)
      : 'its product description matches your request';
  }
}
