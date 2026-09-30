import { BadRequestException } from '@nestjs/common';
import { ASSISTANT_TOOLS, AssistantToolsService, orderReference } from './assistant-tools.service.js';
import { AssistantService } from './assistant.service.js';

const product = { id: 'throw', name: 'Ribbed Wool Throw', slug: 'ribbed-wool-throw', description: 'Soft merino wool.', price: 9200, currency: 'INR', imageUrl: 'image', stock: 3, active: true, published: true, category: { name: 'Home', slug: 'home' }, variants: [] };
const order = { id: 'cmorder0000000009q7pc1w7', userId: 'user-1', orderStatus: 'DELIVERED', createdAt: new Date('2026-09-21T10:00:00Z'), updatedAt: new Date('2026-09-26T10:00:00Z'), subtotal: 9200, shipping: 0, tax: 0, discount: 0, total: 9200, currency: 'INR', shippingRecipientName: 'Aarav', shippingLine1: '12 MG Road', shippingLine2: null, shippingCity: 'Bengaluru', shippingState: 'Karnataka', shippingPostalCode: '560001', shippingCountry: 'IN', items: [{ productName: 'Ribbed Wool Throw', quantity: 1, unitPrice: 9200, lineTotal: 9200 }] };
const emptyCart = { id: 'cart', items: [], subtotal: 0, currency: 'INR' };

function makeTools() {
  const prisma = {
    product: { findFirst: vi.fn().mockResolvedValue(product), findMany: vi.fn().mockResolvedValue([]) },
    category: { findFirst: vi.fn().mockResolvedValue(null), findMany: vi.fn().mockResolvedValue([]) },
    order: { findFirst: vi.fn().mockResolvedValue(order) },
  };
  const rag = { searchProducts: vi.fn().mockResolvedValue([product]), similarProducts: vi.fn().mockResolvedValue([product]) };
  const orders = { findAll: vi.fn().mockResolvedValue({ data: [order], meta: { total: 1 } }) };
  const cart = { getCart: vi.fn().mockResolvedValue(emptyCart), addItem: vi.fn().mockResolvedValue(emptyCart), updateItem: vi.fn(), removeItem: vi.fn() };
  return { prisma, rag, orders, cart, tools: new AssistantToolsService(prisma as never, rag as never, orders as never, cart as never) };
}

describe('assistant tools', () => {
  it('requires sign-in for order and cart tools', async () => {
    const { tools, orders, cart } = makeTools();
    for (const name of ['list_my_orders', 'get_order_details', 'view_cart', 'add_to_cart', 'update_cart_item']) {
      const outcome = await tools.execute(name, { order: 'latest', product: 'throw', quantity: 1 }, { userId: null });
      expect(outcome.result).toMatchObject({ error: 'SIGN_IN_REQUIRED' });
    }
    expect(orders.findAll).not.toHaveBeenCalled();
    expect(cart.getCart).not.toHaveBeenCalled();
  });

  it('only looks up orders belonging to the signed-in shopper', async () => {
    const { tools, prisma, orders } = makeTools();
    await tools.execute('list_my_orders', {}, { userId: 'user-1' });
    expect(orders.findAll).toHaveBeenCalledWith('user-1', expect.anything());
    const outcome = await tools.execute('get_order_details', { order: orderReference(order.id) }, { userId: 'user-1' });
    expect(prisma.order.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }));
    expect(outcome.result).toMatchObject({ reference: '9Q7PC1W7', status: 'DELIVERED', statusLastUpdated: '26 Sept 2026' });
    expect(outcome.orders?.[0]).toMatchObject({ reference: '9Q7PC1W7', statusLabel: 'Delivered' });
  });

  it('filters orders by a product the shopper bought', async () => {
    const { tools } = makeTools();
    const outcome = await tools.execute('list_my_orders', { productName: 'candle' }, { userId: 'user-1' });
    expect(outcome.result).toMatchObject({ orders: [], message: 'No orders contain that product.' });
  });

  it('converts rupee price limits to minor units and drops unknown categories', async () => {
    const { tools, rag } = makeTools();
    const outcome = await tools.execute('search_products', { query: 'coffee gift', maxPrice: 50, category: 'Gifts' }, { userId: null });
    expect(rag.searchProducts).toHaveBeenCalledWith('coffee gift', expect.objectContaining({ maxPrice: 5000, category: undefined }), 5);
    expect(outcome.result).toMatchObject({ note: expect.stringContaining('no "Gifts" category') });
    expect(outcome.products).toHaveLength(1);
  });

  it('resolves "cheaper" against the original product price', async () => {
    const { tools, rag } = makeTools();
    await tools.execute('similar_products', { product: 'Ribbed Wool Throw', cheaper: true, maxPrice: 10000 }, { userId: null });
    expect(rag.similarProducts).toHaveBeenCalledWith('throw', expect.objectContaining({ maxPrice: 9199 }), 5);
  });

  it('adds to cart for the signed-in shopper and flags the cart as updated', async () => {
    const { tools, cart } = makeTools();
    const outcome = await tools.execute('add_to_cart', { product: 'Ribbed Wool Throw', quantity: 2 }, { userId: 'user-1' });
    expect(cart.addItem).toHaveBeenCalledWith('user-1', 'throw', 2);
    expect(outcome.cartUpdated).toBe(true);
  });

  it('returns business errors to the model instead of throwing', async () => {
    const { tools, cart } = makeTools();
    cart.addItem.mockRejectedValue(new BadRequestException('Requested quantity exceeds available stock'));
    const outcome = await tools.execute('add_to_cart', { product: 'Ribbed Wool Throw' }, { userId: 'user-1' });
    expect(outcome.result).toEqual({ error: 'Requested quantity exceeds available stock' });
  });

  it('accepts namespaced tool names from some models', async () => {
    const { tools, cart } = makeTools();
    await tools.execute('default_api.view_cart', {}, { userId: 'user-1' });
    expect(cart.getCart).toHaveBeenCalledWith('user-1');
  });
});

describe('assistant agent loop', () => {
  const toolCall = (name: string, args: object) => ({ id: `call-${name}`, type: 'function' as const, function: { name, arguments: JSON.stringify(args) } });

  function makeAssistant(completions: unknown[]) {
    const generation = { enabled: true, complete: vi.fn() };
    completions.forEach((completion) => generation.complete.mockImplementationOnce(async () => {
      if (completion instanceof Error) throw completion;
      return completion;
    }));
    const tools = { execute: vi.fn().mockResolvedValue({ result: { ok: true }, orders: [{ id: 'o1', reference: 'O1' }], cartUpdated: true }) };
    const rag = { recommend: vi.fn().mockResolvedValue({ answer: 'Template answer', products: [product], answerSource: 'template' }) };
    const prisma = { user: { findUnique: vi.fn().mockResolvedValue({ name: 'Aarav' }) } };
    return { generation, tools, rag, prisma, assistant: new AssistantService(prisma as never, generation as never, tools as never, rag as never) };
  }

  it('runs tools with the session user and returns the final answer with cards', async () => {
    const { assistant, generation, tools } = makeAssistant([
      { message: { content: null, tool_calls: [toolCall('get_order_details', { order: 'latest' })] }, model: 'm' },
      { message: { content: 'Your order was delivered.\n[Orders shown: 1. O1 (DELIVERED)]' }, model: 'm' },
    ]);
    const result = await assistant.chat('where is my order?', [], 'user-1');
    expect(tools.execute).toHaveBeenCalledWith('get_order_details', { order: 'latest' }, { userId: 'user-1' });
    expect(result).toMatchObject({ answer: 'Your order was delivered.', answerSource: 'llm', cartUpdated: true, orders: [{ reference: 'O1' }] });
    expect(generation.complete.mock.calls[0][2]).toBe('required');
    expect(generation.complete.mock.calls[1][2]).toBe('auto');
    expect(generation.complete.mock.calls[1][0].at(-1)).toMatchObject({ role: 'tool', tool_call_id: 'call-get_order_details' });
  });

  it('ignores a user id whose account no longer exists', async () => {
    const { assistant, tools, prisma } = makeAssistant([
      { message: { content: null, tool_calls: [toolCall('view_cart', {})] }, model: 'm' },
      { message: { content: 'Please sign in.' }, model: 'm' },
    ]);
    prisma.user.findUnique.mockResolvedValue(null);
    await assistant.chat('my cart', [], 'deleted-user');
    expect(tools.execute).toHaveBeenCalledWith('view_cart', {}, { userId: null });
  });

  it('falls back to plain retrieval when the first LLM call fails', async () => {
    const { assistant, rag } = makeAssistant([new Error('provider down')]);
    const result = await assistant.chat('warm blanket', [], null);
    expect(rag.recommend).toHaveBeenCalledWith('warm blanket');
    expect(result).toMatchObject({ answer: 'Template answer', answerSource: 'template', orders: [], cartUpdated: false });
  });

  it('withholds tools on the final step so the loop always ends', async () => {
    const loop = { message: { content: null, tool_calls: [toolCall('list_categories', {})] }, model: 'm' };
    const { assistant, generation } = makeAssistant([loop, loop, loop, loop, { message: { content: 'Done.' }, model: 'm' }]);
    const result = await assistant.chat('hi', [], null);
    expect(generation.complete).toHaveBeenCalledTimes(5);
    expect(generation.complete.mock.calls[4][1]).toBeUndefined();
    expect(result.answer).toBe('Done.');
  });

  it('offers every tool definition to the model', () => {
    expect(ASSISTANT_TOOLS.map((tool) => tool.function.name)).toEqual(['search_products', 'get_product_details', 'compare_products', 'similar_products', 'list_categories', 'list_my_orders', 'get_order_details', 'view_cart', 'add_to_cart', 'update_cart_item']);
  });
});
