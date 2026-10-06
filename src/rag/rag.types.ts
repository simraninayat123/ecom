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
