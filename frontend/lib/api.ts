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

export async function getProducts() {
  return api<{ data: Product[] }>('/products?limit=24');
}

/** Sends the stored access token when present so the assistant can use order and cart tools. */
export function sendAssistantMessage(message: string, history: AssistantHistoryMessage[]) {
  const token = typeof window === 'undefined' ? null : localStorage.getItem('morrow_access_token');
  return api<AssistantResponse>('/rag/chat', { method: 'POST', body: JSON.stringify({ message, history }) }, token);
}
