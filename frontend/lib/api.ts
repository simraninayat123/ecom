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

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
};

export type Cart = { id: string; items: CartItem[]; subtotal: number; currency: string };

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export function formatMoney(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100);
}

export async function api<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !body?.success) {
    throw new Error(body?.message ?? `Request failed (${response.status})`);
  }
  return body.data;
}

export async function getProducts() {
  return api<Product[]>('/products?limit=24');
}
