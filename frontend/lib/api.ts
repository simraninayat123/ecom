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
export type Shop = { id: string; name: string; slug: string; _count?: { products: number }; products?: Array<{ imageUrl: string }> };

export type CartItem = {
  id: string;
  quantity: number;
  product: Product;
  lineTotal: number;
};

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
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
  answerSource?: 'llm' | 'template';
};

export type OrderCard = {
  id: string;
  reference: string;
  placedAt: string;
  updatedAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  statusLabel: string;
  total: number;
  currency: string;
  items: Array<{ name: string; quantity: number }>;
};

export type AssistantHistoryMessage = { role: 'user' | 'assistant'; content: string };

export type AssistantResponse = {
  answer: string;
  products: RecommendationProduct[];
  orders: OrderCard[];
  cartUpdated: boolean;
  answerSource: 'llm' | 'template';
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

export const SELLER_SLUG_KEY = 'morrow_seller_slug';
export const SELLER_NAME_KEY = 'morrow_seller_name';

export function getActiveSellerName() {
  return typeof window === 'undefined' ? 'Morrow Supply' : localStorage.getItem(SELLER_NAME_KEY) ?? 'Morrow Supply';
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export function formatMoney(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100);
}

export async function api<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const sellerSlug = typeof window === 'undefined' ? 'morrow' : localStorage.getItem(SELLER_SLUG_KEY) ?? 'morrow';
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-Seller-Slug': sellerSlug, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !body?.success) {
    throw new ApiError(body?.message ?? `Request failed (${response.status})`, response.status);
  }
  return body.data;
}

export async function adminApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window === 'undefined' ? null : window.localStorage.getItem('morrow_access_token');
  return api<T>(path, options, token);
}

export async function getProducts() {
  return api<Product[]>('/products?limit=24');
}
export function getShops() { return api<Shop[]>('/shops'); }
export function getShopProducts(slug: string) { return api<Product[]>(`/shops/${encodeURIComponent(slug)}/products`); }
export function getShopProduct(slug: string, idOrSlug: string) { return api<{ shop: Shop; product: Product }>(`/shops/${encodeURIComponent(slug)}/products/${encodeURIComponent(idOrSlug)}`); }

/** Sends the stored access token when present so the assistant can use order and cart tools. */
export function sendAssistantMessage(message: string, history: AssistantHistoryMessage[]) {
  const token = typeof window === 'undefined' ? null : localStorage.getItem('morrow_access_token');
  return api<AssistantResponse>('/rag/chat', { method: 'POST', body: JSON.stringify({ message, history }) }, token);
}
