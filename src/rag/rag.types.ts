import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';

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

export class ChatHistoryMessage {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @MaxLength(2000)
  content!: string;
}

export class ChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryMessage)
  history?: ChatHistoryMessage[];
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
  similarity?: number;
};

export type RecommendationResponse = {
  answer: string;
  products: RecommendationProduct[];
  answerSource: 'llm' | 'template';
};

/** Prices are in minor units (paise), matching the Product table. */
export type ProductSearchFilters = {
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  inStockOnly?: boolean;
};

export type OrderCard = {
  id: string;
  reference: string;
  placedAt: string;
  updatedAt: string;
  status: string;
  statusLabel: string;
  total: number;
  currency: string;
  items: Array<{ name: string; quantity: number }>;
};

export type ChatResponse = {
  answer: string;
  products: RecommendationProduct[];
  orders: OrderCard[];
  cartUpdated: boolean;
  answerSource: 'llm' | 'template';
};
