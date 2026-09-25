import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmbeddingService } from './embedding.service.js';
import type { RecommendationProduct, RecommendationResponse } from './rag.types.js';

@Injectable()
export class RagService {
  constructor(private readonly prisma: PrismaService, private readonly embeddings: EmbeddingService, private readonly config: ConfigService) {}

  async recommend(query: string, requestedLimit?: number): Promise<RecommendationResponse> {
    const limit = requestedLimit ?? Number(this.config.get('RAG_RETRIEVAL_LIMIT') ?? 5);
    const minSimilarity = Number(this.config.get('RAG_MIN_SIMILARITY') ?? 0.35);
    const [vector] = await this.embeddings.embed([query.trim()]);
    const vectorLiteral = `[${vector.join(',')}]`;
    const matches = await this.prisma.$queryRaw<Array<{ productId: string; similarity: number }>>(Prisma.sql`
      SELECT "productId", 1 - ("embedding" <=> ${vectorLiteral}::vector) AS similarity
      FROM "ProductEmbedding"
      WHERE 1 - ("embedding" <=> ${vectorLiteral}::vector) >= ${minSimilarity}
      ORDER BY "embedding" <=> ${vectorLiteral}::vector
      LIMIT ${limit}
    `);
    if (!matches.length) return { answer: 'The catalog does not currently contain a confident match. Try different requirements, materials, or use cases.', products: [] };

    const current = await this.prisma.product.findMany({ where: { id: { in: matches.map((match) => match.productId) }, active: true, published: true }, include: { category: true } });
    const byId = new Map(current.map((product) => [product.id, product]));
    const products: RecommendationProduct[] = matches.flatMap((match) => {
      const product = byId.get(match.productId);
      if (!product) return [];
      return [{ ...product, similarity: Number(match.similarity), category: product.category ? { name: product.category.name, slug: product.category.slug } : null }];
    });
    if (!products.length) return { answer: 'The catalog does not currently contain a confident match. Try different requirements, materials, or use cases.', products: [] };
    const first = products[0];
    return { answer: `Based on your request, ${first.name} is a strong match because ${this.groundedReason(first.description)}.`, products };
  }

  private groundedReason(description: string) {
    const sentence = description.split(/[.!?]/)[0]?.trim();
    return sentence ? sentence.charAt(0).toLowerCase() + sentence.slice(1) : 'its product description matches your request';
  }
}