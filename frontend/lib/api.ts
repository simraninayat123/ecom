export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  currency: string;
  stock: number;
  category?: { name: string; slug: string } | null;
};

export type CartItem = {
  id: string;
  quantity: number;
  product: Product;
  lineTotal: number;
};

export type Cart = { id: string; items: CartItem[]; subtotal: number; currency: string };

export type RecommendationProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  stock: number;
  category?: { name: string; slug: string } | null;
  similarity?: number;
};

export type RecommendationResponse = {
  answer: string;
  products: RecommendationProduct[];
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count?: { products: number };
  createdAt?: string;
  updatedAt?: string;
};

export type AdminProductImage = { id: string; productId: string; url: string; altText?: string | null; sortOrder: number };
export type AdminProductVariant = { id: string; productId: string; name: string; sku: string; options: Record<string, unknown>; priceOverride?: number | null; stock: number; active: boolean };
export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  active: boolean;
  published: boolean;
  currency: string;
  category?: AdminCategory | null;
  categoryId?: string | null;
  images?: AdminProductImage[];
  variants?: AdminProductVariant[];
  createdAt: string;
  updatedAt: string;
};

export type InventoryAdjustmentInput = { type: 'INCREASE' | 'DECREASE' | 'SET'; quantity: number; reason: string };
export type AdminIndexingFailedJob = { id: string; productId: string; attempts: number; lastError?: string | null; updatedAt: string };
export type AdminIndexingStatus = {
  counts: Partial<Record<'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED', number>>;
  failedJobs: AdminIndexingFailedJob[];
  latestSuccessfulEmbeddingAt?: string | null;
};

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export function formatMoney(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100);
}

export async function api<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new ApiError(message ?? `Request failed (${response.status})`, response.status);
  }
  return response.json() as Promise<T>;
}

export async function adminApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window === 'undefined' ? null : window.localStorage.getItem('morrow_access_token');
  return api<T>(path, options, token);
}

export async function getProducts() {
  return api<{ data: Product[] }>('/products?limit=24');
}

export function getProductRecommendations(query: string, limit = 5) {
  return api<RecommendationResponse>('/rag/recommendations', {
    method: 'POST',
    body: JSON.stringify({ query, limit }),
  });
}
