import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, Max, Min, MinLength, MaxLength } from 'class-validator';

export class RecommendationDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  query!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Min(1)
  @Max(10)
  limit?: number;
}

export type ProductIndexOperation = 'UPSERT' | 'DELETE';

export type RecommendationProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  stock: number;
  category: { name: string; slug: string } | null;
  similarity: number;
};

export type RecommendationResponse = {
  answer: string;
  products: RecommendationProduct[];
};