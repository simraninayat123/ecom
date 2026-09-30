import { HttpException, Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { CartService } from '../cart/cart.service.js';
import { OrdersService } from '../orders/orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { formatPrice, type ToolDefinition } from './generation.service.js';
import { RagService } from './rag.service.js';
import type { OrderCard, ProductSearchFilters, RecommendationProduct } from './rag.types.js';

export type ToolContext = { userId: string | null };
/** `result` goes back to the LLM; the other fields drive the chat UI. */
export type ToolOutcome = { result: unknown; products?: RecommendationProduct[]; orders?: OrderCard[]; cartUpdated?: boolean };

const SIGN_IN_REQUIRED = { error: 'SIGN_IN_REQUIRED', message: 'The shopper is not signed in. Ask them to sign in to see their orders or cart.' };

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Order placed, waiting for confirmation',
  CONFIRMED: 'Confirmed and being prepared',
  PROCESSING: 'Being packed for dispatch',
  SHIPPED: 'Shipped and on its way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const productInclude = { category: true, variants: { where: { active: true }, orderBy: { createdAt: 'asc' as const } } } satisfies Prisma.ProductInclude;
type ProductWithDetails = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

const productRef = { type: 'string', description: 'Product id, slug, or exact product name as shown earlier in the conversation.' };
const priceFilters = {
  minPrice: { type: 'number', description: 'Minimum price in rupees (INR), e.g. 500.' },
  maxPrice: { type: 'number', description: 'Maximum price in rupees (INR), e.g. 2000.' },
  inStockOnly: { type: 'boolean', description: 'Only return in-stock products. Only set when the shopper asks for it.' },
};

export const ASSISTANT_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Semantic search of the product catalog. Use for any request to find, recommend, or browse products. Pass price and category limits when the shopper mentions them.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'What the shopper is looking for, in their words, e.g. "warm blanket for cool evenings".' }, category: { type: 'string', description: 'Category name or slug from list_categories. Only set when the shopper names a category.' }, ...priceFilters },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_product_details',
      description: 'Full details for one product: description, price, stock, variants and category.',
      parameters: { type: 'object', properties: { product: productRef }, required: ['product'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_products',
      description: 'Side-by-side details for 2 to 4 products the shopper wants to compare.',
      parameters: { type: 'object', properties: { products: { type: 'array', items: productRef, minItems: 2, maxItems: 4 } }, required: ['products'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'similar_products',
      description: 'Products similar to a given product, optionally cheaper or in stock. Use for "something like this" or "a cheaper alternative".',
      parameters: { type: 'object', properties: { product: productRef, cheaper: { type: 'boolean', description: 'Only products cheaper than this product.' }, ...priceFilters }, required: ['product'] },
    },
  },
  {
    type: 'function',
    function: { name: 'list_categories', description: 'All product categories in the store with how many products each has.', parameters: { type: 'object', properties: {} } },
  },
  {
    type: 'function',
    function: {
      name: 'list_my_orders',
      description: "The signed-in shopper's orders, newest first, with status, date, total and items. Optionally only orders containing a product they bought.",
      parameters: {
        type: 'object',
        properties: {
          productName: { type: 'string', description: 'Only orders containing a product whose name includes this text.' },
          limit: { type: 'integer', minimum: 1, maximum: 10, description: 'Maximum orders to return (default 5).' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_order_details',
      description: "One of the signed-in shopper's orders: current status, when it was placed and last updated, items, amounts and shipping address. Use for \"where is my order\" questions.",
      parameters: { type: 'object', properties: { order: { type: 'string', description: 'Order id or reference from list_my_orders, or "latest" for the most recent order.' } }, required: ['order'] },
    },
  },
  {
    type: 'function',
    function: { name: 'view_cart', description: "The signed-in shopper's cart contents and subtotal.", parameters: { type: 'object', properties: {} } },
  },
  {
    type: 'function',
    function: {
      name: 'add_to_cart',
      description: "Add a product to the signed-in shopper's cart. Only call when the shopper clearly asks to add something.",
      parameters: { type: 'object', properties: { product: productRef, quantity: { type: 'integer', minimum: 1, maximum: 10, description: 'How many to add (default 1).' } }, required: ['product'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_cart_item',
      description: "Change the quantity of a product already in the signed-in shopper's cart. Quantity 0 removes it.",
      parameters: { type: 'object', properties: { product: productRef, quantity: { type: 'integer', minimum: 0, maximum: 10 } }, required: ['product', 'quantity'] },
    },
  },
];

function toMinorUnits(value: unknown) {
  const amount = Number(value);
  return value === undefined || value === null || value === '' || !Number.isFinite(amount) ? undefined : Math.round(amount * 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(date);
}

export function orderReference(id: string) {
  return id.slice(-8).toUpperCase();
}

@Injectable()
export class AssistantToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rag: RagService,
    private readonly orders: OrdersService,
    private readonly cart: CartService,
  ) {}

  async execute(rawName: string, args: Record<string, unknown>, context: ToolContext): Promise<ToolOutcome> {
    // Some models prefix tool names with a namespace, e.g. "default_api.add_to_cart".
    const name = rawName.split('.').pop() ?? rawName;
    try {
      switch (name) {
        case 'search_products': return await this.searchProducts(args);
        case 'get_product_details': return await this.productDetails(args);
        case 'compare_products': return await this.compareProducts(args);
        case 'similar_products': return await this.similarProducts(args);
        case 'list_categories': return await this.listCategories();
        case 'list_my_orders': return context.userId ? await this.listOrders(context.userId, args) : { result: SIGN_IN_REQUIRED };
        case 'get_order_details': return context.userId ? await this.orderDetails(context.userId, args) : { result: SIGN_IN_REQUIRED };
        case 'view_cart': return context.userId ? { result: this.presentCart(await this.cart.getCart(context.userId)) } : { result: SIGN_IN_REQUIRED };
        case 'add_to_cart': return context.userId ? await this.addToCart(context.userId, args) : { result: SIGN_IN_REQUIRED };
        case 'update_cart_item': return context.userId ? await this.updateCartItem(context.userId, args) : { result: SIGN_IN_REQUIRED };
        default: return { result: { error: `Unknown tool ${name}` } };
      }
    } catch (error) {
      // Business errors (out of stock, not found) go back to the model so it can explain them.
      if (error instanceof HttpException) return { result: { error: error.message } };
      throw error;
    }
  }

  /** Unknown categories are dropped with a note, so an invented category doesn't hide every result. */
  private async filters(args: Record<string, unknown>): Promise<{ filters: ProductSearchFilters; note?: string }> {
    const requested = typeof args.category === 'string' ? args.category.trim() : '';
    const category = requested ? await this.prisma.category.findFirst({ where: { OR: [{ slug: requested.toLowerCase() }, { name: { equals: requested, mode: 'insensitive' } }] } }) : null;
    return {
      filters: { minPrice: toMinorUnits(args.minPrice), maxPrice: toMinorUnits(args.maxPrice), category: category?.slug, inStockOnly: args.inStockOnly === true },
      ...(requested && !category && { note: `There is no "${requested}" category, so results are from all categories.` }),
    };
  }

  private async searchProducts(args: Record<string, unknown>): Promise<ToolOutcome> {
    const query = String(args.query ?? '').trim();
    if (!query) return { result: { error: 'A search query is required.' } };
    const { filters, note } = await this.filters(args);
    const products = await this.rag.searchProducts(query, filters, 5);
    if (!products.length) return { result: { products: [], message: 'No matching products in the catalog. Suggest the shopper relaxes the price, category or wording.', ...(note && { note }) } };
    return { result: { products: products.map((product, index) => this.summarize(product, index)), ...(note && { note }) }, products };
  }

  private async productDetails(args: Record<string, unknown>): Promise<ToolOutcome> {
    const found = await this.resolveProduct(args.product);
    if ('result' in found) return found;
    return { result: this.describe(found.product), products: [this.toCard(found.product)] };
  }

  private async compareProducts(args: Record<string, unknown>): Promise<ToolOutcome> {
    const refs = Array.isArray(args.products) ? args.products.slice(0, 4) : [];
    if (refs.length < 2) return { result: { error: 'Provide at least two products to compare.' } };
    const resolved = await Promise.all(refs.map((ref) => this.resolveProduct(ref)));
    const products = resolved.flatMap((item) => ('product' in item ? [item.product] : []));
    const problems = resolved.flatMap((item) => ('result' in item ? [item.result] : []));
    return { result: { products: products.map((product) => this.describe(product)), ...(problems.length && { notFound: problems }) }, products: products.map((product) => this.toCard(product)) };
  }

  private async similarProducts(args: Record<string, unknown>): Promise<ToolOutcome> {
    const found = await this.resolveProduct(args.product);
    if ('result' in found) return found;
    const { filters, note } = await this.filters(args);
    // "cheaper" is resolved here because models are unreliable at comparing prices themselves.
    if (args.cheaper === true) filters.maxPrice = Math.min(filters.maxPrice ?? Infinity, found.product.price - 1);
    const products = await this.rag.similarProducts(found.product.id, filters, 5);
    if (!products.length) return { result: { products: [], message: `No similar products found for ${found.product.name} with those limits.`, ...(note && { note }) } };
    return { result: { similarTo: found.product.name, products: products.map((product, index) => this.summarize(product, index)), ...(note && { note }) }, products };
  }

  private async listCategories(): Promise<ToolOutcome> {
    const categories = await this.prisma.category.findMany({ orderBy: { name: 'asc' }, select: { name: true, slug: true, _count: { select: { products: { where: { active: true, published: true } } } } } });
    return { result: { categories: categories.map((category) => ({ name: category.name, slug: category.slug, productCount: category._count.products })) } };
  }

  private async listOrders(userId: string, args: Record<string, unknown>): Promise<ToolOutcome> {
    const limit = Math.min(Math.max(Number(args.limit) || 5, 1), 10);
    const productName = typeof args.productName === 'string' ? args.productName.trim().toLowerCase() : '';
    const { data, meta } = await this.orders.findAll(userId, { page: 1, limit: 50 });
    const matching = data
      .filter((order) => !productName || order.items.some((item) => item.productName.toLowerCase().includes(productName)))
      .slice(0, limit);
    if (!matching.length) return { result: { orders: [], totalOrders: meta.total, message: meta.total ? 'No orders contain that product.' : 'The shopper has not placed any orders yet.' } };
    return {
      result: { totalOrders: meta.total, orders: matching.map((order) => this.summarizeOrder(order)) },
      orders: matching.map((order) => this.toOrderCard(order)),
    };
  }

  private async orderDetails(userId: string, args: Record<string, unknown>): Promise<ToolOutcome> {
    const ref = String(args.order ?? '').trim();
    const order = await this.findOrder(userId, ref);
    if (!order) return { result: { error: `No order found for "${ref}". Use list_my_orders to see the shopper's orders.` } };
    return {
      result: {
        ...this.summarizeOrder(order),
        amounts: { subtotal: formatPrice(order.subtotal, order.currency), shipping: formatPrice(order.shipping, order.currency), tax: formatPrice(order.tax, order.currency), discount: formatPrice(order.discount, order.currency), total: formatPrice(order.total, order.currency) },
        items: order.items.map((item) => ({ name: item.productName, quantity: item.quantity, unitPrice: formatPrice(item.unitPrice, order.currency), lineTotal: formatPrice(item.lineTotal, order.currency) })),
        shippingTo: [order.shippingRecipientName, order.shippingLine1, order.shippingLine2, order.shippingCity, order.shippingState, order.shippingPostalCode, order.shippingCountry].filter(Boolean).join(', '),
      },
      orders: [this.toOrderCard(order)],
    };
  }

  /** Orders are always looked up inside the signed-in shopper's own orders. */
  private async findOrder(userId: string, ref: string): Promise<OrderWithItems | null> {
    if (!ref || ref.toLowerCase() === 'latest') return this.prisma.order.findFirst({ where: { userId }, include: { items: true }, orderBy: { createdAt: 'desc' } });
    const normalized = ref.replace(/^#/, '').toLowerCase();
    return this.prisma.order.findFirst({ where: { userId, OR: [{ id: normalized }, { id: { endsWith: normalized } }] }, include: { items: true } });
  }

  private async addToCart(userId: string, args: Record<string, unknown>): Promise<ToolOutcome> {
    const found = await this.resolveProduct(args.product);
    if ('result' in found) return found;
    const quantity = Math.min(Math.max(Math.trunc(Number(args.quantity) || 1), 1), 10);
    const cart = await this.cart.addItem(userId, found.product.id, quantity);
    return { result: { added: { name: found.product.name, quantity }, cart: this.presentCart(cart) }, cartUpdated: true };
  }

  private async updateCartItem(userId: string, args: Record<string, unknown>): Promise<ToolOutcome> {
    const found = await this.resolveProduct(args.product);
    if ('result' in found) return found;
    const quantity = Math.trunc(Number(args.quantity));
    if (!Number.isFinite(quantity) || quantity < 0) return { result: { error: 'Quantity must be 0 or more.' } };
    const current = await this.cart.getCart(userId);
    const item = current.items.find((candidate) => candidate.productId === found.product.id);
    if (!item) return { result: { error: `${found.product.name} is not in the cart.`, cart: this.presentCart(current) } };
    const cart = quantity === 0 ? await this.cart.removeItem(userId, item.id) : await this.cart.updateItem(userId, item.id, quantity);
    return { result: { updated: { name: found.product.name, quantity }, cart: this.presentCart(cart) }, cartUpdated: true };
  }

  /** Matches id, slug, exact name, then partial name; asks the model to disambiguate when several match. */
  private async resolveProduct(ref: unknown): Promise<{ product: ProductWithDetails } | { result: unknown }> {
    const text = typeof ref === 'string' ? ref.trim() : '';
    if (!text) return { result: { error: 'A product id or name is required.' } };
    const visible = { active: true, published: true };
    const exact = await this.prisma.product.findFirst({ where: { ...visible, OR: [{ id: text }, { slug: text }, { name: { equals: text, mode: 'insensitive' } }] }, include: productInclude });
    if (exact) return { product: exact };
    const partial = await this.prisma.product.findMany({ where: { ...visible, name: { contains: text, mode: 'insensitive' } }, include: productInclude, take: 5 });
    if (partial.length === 1) return { product: partial[0] };
    if (partial.length > 1) return { result: { error: `Several products match "${text}". Ask the shopper which one they mean.`, options: partial.map((product) => product.name) } };
    return { result: { error: `No product named "${text}" in the catalog. Try search_products instead.` } };
  }

  private summarize(product: RecommendationProduct, index: number) {
    return {
      number: index + 1,
      id: product.id,
      name: product.name,
      category: product.category?.name ?? null,
      price: formatPrice(product.price, product.currency),
      availability: product.stock > 0 ? 'In stock' : 'Out of stock',
      description: product.description.slice(0, 240),
    };
  }

  private describe(product: ProductWithDetails) {
    return {
      id: product.id,
      name: product.name,
      category: product.category?.name ?? null,
      price: formatPrice(product.price, product.currency),
      availability: product.stock > 0 ? `In stock (${product.stock} available)` : 'Out of stock',
      description: product.description,
      variants: product.variants.map((variant) => ({ name: variant.name, options: variant.options })),
    };
  }

  private toCard(product: ProductWithDetails): RecommendationProduct {
    const { id, name, slug, description, price, currency, imageUrl, stock } = product;
    return { id, name, slug, description, price, currency, imageUrl, stock, category: product.category ? { name: product.category.name, slug: product.category.slug } : null };
  }

  private summarizeOrder(order: OrderWithItems) {
    return {
      id: order.id,
      reference: orderReference(order.id),
      placedOn: formatDate(order.createdAt),
      status: order.orderStatus,
      statusMeaning: STATUS_LABELS[order.orderStatus],
      statusLastUpdated: formatDate(order.updatedAt),
      total: formatPrice(order.total, order.currency),
      items: order.items.map((item) => `${item.quantity} x ${item.productName}`),
    };
  }

  private toOrderCard(order: OrderWithItems): OrderCard {
    return {
      id: order.id,
      reference: orderReference(order.id),
      placedAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      status: order.orderStatus,
      statusLabel: STATUS_LABELS[order.orderStatus],
      total: order.total,
      currency: order.currency,
      items: order.items.map((item) => ({ name: item.productName, quantity: item.quantity })),
    };
  }

  private presentCart(cart: Awaited<ReturnType<CartService['getCart']>>) {
    return {
      items: cart.items.map((item) => ({ name: item.product.name, quantity: item.quantity, lineTotal: formatPrice(item.lineTotal, cart.currency) })),
      itemCount: cart.items.reduce((total, item) => total + item.quantity, 0),
      subtotal: formatPrice(cart.subtotal, cart.currency),
    };
  }
}
