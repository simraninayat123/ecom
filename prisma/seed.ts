import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Carry', slug: 'carry', description: 'Everyday bags and useful things.' },
  { name: 'Home', slug: 'home', description: 'Objects for slow mornings and quiet evenings.' },
  { name: 'Kitchen', slug: 'kitchen', description: 'Practical tools for cooking, serving, and sharing.' },
  { name: 'Desk', slug: 'desk', description: 'Thoughtful stationery and tools for focused work.' },
  { name: 'Outdoor', slug: 'outdoor', description: 'Dependable essentials for time outside.' },
];

const products = [
  { name: 'Field Notes Tote', slug: 'field-notes-tote', sku: 'MOR-TOTE-001', description: 'A durable recycled-canvas tote with a roomy main compartment, interior pocket, and reinforced handles for groceries, books, and everyday carry.', price: 4800, imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80', stock: 25, categorySlug: 'carry' },
  { name: 'Stoneware Mug', slug: 'stoneware-mug', sku: 'MOR-MUG-001', description: 'A hand-finished ceramic mug with a quiet speckled glaze and generous shape for tea, coffee, or a slow morning at home.', price: 2600, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80', stock: 40, categorySlug: 'home' },
  { name: 'Ribbed Wool Throw', slug: 'ribbed-wool-throw', sku: 'MOR-THROW-001', description: 'A soft merino wool throw with a warm ribbed weave, made for cool evenings, reading on the sofa, and adding texture to a bedroom.', price: 9200, imageUrl: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80', stock: 12, categorySlug: 'home' },
  { name: 'Waxed Canvas Daypack', slug: 'waxed-canvas-daypack', sku: 'MOR-PACK-001', description: 'A weather-resistant waxed-canvas backpack with padded shoulder straps, a laptop sleeve, and practical pockets for commuting, campus, or day trips.', price: 11800, imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80', stock: 18, categorySlug: 'carry' },
  { name: 'Leather Card Wallet', slug: 'leather-card-wallet', sku: 'MOR-WALLET-001', description: 'A slim vegetable-tanned leather card wallet with four card slots and a central folded-note pocket for people who prefer a minimal everyday carry.', price: 3900, imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80', stock: 30, categorySlug: 'carry' },
  { name: 'Packing Cube Set', slug: 'packing-cube-set', sku: 'MOR-PACK-002', description: 'Three lightweight zippered packing cubes that separate clothes, cables, and toiletries to make weekend travel and suitcase organization easier.', price: 3400, imageUrl: 'https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=900&q=80', stock: 24, categorySlug: 'carry' },
  { name: 'Linen Apron', slug: 'linen-apron', sku: 'MOR-APR-001', description: 'A washed linen cross-back apron with deep front pockets, designed for baking, cooking, pottery, gardening, and long afternoons in the kitchen.', price: 5200, imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80', stock: 16, categorySlug: 'kitchen' },
  { name: 'Acacia Serving Board', slug: 'acacia-serving-board', sku: 'MOR-BOARD-001', description: 'A solid acacia wood board for serving cheese, fruit, bread, and small shared meals; its natural grain makes it useful on the table as well as in the kitchen.', price: 4100, imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80', stock: 20, categorySlug: 'kitchen' },
  { name: 'Pour-Over Coffee Set', slug: 'pour-over-coffee-set', sku: 'MOR-COFFEE-001', description: 'A simple glass dripper and server set for making clean, slow pour-over coffee at home. Includes a reusable metal filter for everyday brewing.', price: 6800, imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80', stock: 14, categorySlug: 'kitchen' },
  { name: 'Insulated Travel Flask', slug: 'insulated-travel-flask', sku: 'MOR-FLASK-001', description: 'A leakproof stainless-steel flask that keeps tea and coffee hot for six hours or water cold for twelve, ideal for commutes, hikes, and long workdays.', price: 3200, imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80', stock: 35, categorySlug: 'outdoor' },
  { name: 'Amber Glass Candle', slug: 'amber-glass-candle', sku: 'MOR-CANDLE-001', description: 'A soy wax candle in an amber glass jar with cedar, fig, and soft smoke notes. A calm gift for housewarmings, evenings, or a reading corner.', price: 2900, imageUrl: 'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?auto=format&fit=crop&w=900&q=80', stock: 28, categorySlug: 'home' },
  { name: 'Linen Duvet Cover', slug: 'linen-duvet-cover', sku: 'MOR-BED-001', description: 'A breathable washed linen duvet cover in a warm oat colour, made for comfortable sleep in every season and a relaxed, lived-in bedroom.', price: 14500, imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80', stock: 10, categorySlug: 'home' },
  { name: 'Desk Planner Pad', slug: 'desk-planner-pad', sku: 'MOR-PLAN-001', description: 'An undated weekly desk planner with space for priorities, appointments, notes, and small habits. Designed to make busy workdays feel more manageable.', price: 1600, imageUrl: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=900&q=80', stock: 45, categorySlug: 'desk' },
  { name: 'Brass Bookmark Ruler', slug: 'brass-bookmark-ruler', sku: 'MOR-DESK-001', description: 'A slim brass bookmark that doubles as a 15-centimetre ruler, suitable for readers, students, sketchbooks, and thoughtful small gifts.', price: 1200, imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80', stock: 50, categorySlug: 'desk' },
  { name: 'Hardcover Sketchbook', slug: 'hardcover-sketchbook', sku: 'MOR-SKETCH-001', description: 'A cloth-bound sketchbook with heavyweight blank paper that handles pencil, ink, and light watercolour. Built for drawing at a desk or on the move.', price: 2400, imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80', stock: 32, categorySlug: 'desk' },
  { name: 'Wool Camp Socks', slug: 'wool-camp-socks', sku: 'MOR-SOCK-001', description: 'Thick merino-blend camp socks with cushioned soles for chilly walks, cabin weekends, and keeping warm around the house.', price: 1800, imageUrl: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=900&q=80', stock: 38, categorySlug: 'outdoor' },
  { name: 'Picnic Blanket', slug: 'picnic-blanket', sku: 'MOR-PICNIC-001', description: 'A foldable water-resistant picnic blanket with a soft woven top and carry strap, made for park lunches, beach days, and outdoor concerts.', price: 5600, imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80', stock: 15, categorySlug: 'outdoor' },
  { name: 'Enamel Camping Mug', slug: 'enamel-camping-mug', sku: 'MOR-MUG-002', description: 'A lightweight enamel mug with a durable rolled rim, suitable for morning coffee by a campfire, picnics, and everyday use at home.', price: 1500, imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80', stock: 42, categorySlug: 'outdoor' },
  { name: 'Ceramic Oil Pourer', slug: 'ceramic-oil-pourer', sku: 'MOR-OIL-001', description: 'A glazed ceramic oil bottle with a controlled pour spout for olive oil, dressings, and everyday cooking. Keeps the counter tidy and the table useful.', price: 3100, imageUrl: 'https://images.unsplash.com/photo-1572003414030-4175bcadd3cf?auto=format&fit=crop&w=900&q=80', stock: 22, categorySlug: 'kitchen' },
  { name: 'Cable Organizer Roll', slug: 'cable-organizer-roll', sku: 'MOR-CABLE-001', description: 'A compact canvas roll with elastic loops and zip pockets for chargers, earphones, adapters, and small tech accessories when travelling or commuting.', price: 2800, imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80', stock: 26, categorySlug: 'carry' },
];

for (const category of categories) {
  await prisma.category.upsert({ where: { slug: category.slug }, create: category, update: category });
}

const categoryMap = Object.fromEntries((await prisma.category.findMany()).map((category) => [category.slug, category.id]));

for (const { categorySlug, ...product } of products) {
  await prisma.product.upsert({
    where: { sku: product.sku },
    create: { ...product, categoryId: categoryMap[categorySlug] },
    update: { ...product, categoryId: categoryMap[categorySlug] },
  });
}

await prisma.$disconnect();
