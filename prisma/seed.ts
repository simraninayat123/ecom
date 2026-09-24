import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Carry', slug: 'carry', description: 'Everyday bags and useful things.' },
  { name: 'Home', slug: 'home', description: 'Objects for slow mornings and quiet evenings.' },
];
const products = [
  { name: 'Field Notes Tote', slug: 'field-notes-tote', sku: 'MOR-TOTE-001', description: 'A durable everyday carry made from recycled canvas.', price: 4800, imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80', stock: 25, categorySlug: 'carry' },
  { name: 'Stoneware Mug', slug: 'stoneware-mug', sku: 'MOR-MUG-001', description: 'Hand-finished ceramic with a quiet, speckled glaze.', price: 2600, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80', stock: 40, categorySlug: 'home' },
  { name: 'Ribbed Wool Throw', slug: 'ribbed-wool-throw', sku: 'MOR-THROW-001', description: 'Soft merino wool woven for cool evenings and slow mornings.', price: 9200, imageUrl: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80', stock: 12, categorySlug: 'home' },
];

await prisma.orderItem.deleteMany();
await prisma.order.deleteMany();
await prisma.cartItem.deleteMany();
await prisma.cart.deleteMany();
await prisma.product.deleteMany();
await prisma.category.deleteMany();
await prisma.category.createMany({ data: categories });
const categoryMap = Object.fromEntries((await prisma.category.findMany()).map((category) => [category.slug, category.id]));
await prisma.product.createMany({ data: products.map(({ categorySlug, ...product }) => ({ ...product, categoryId: categoryMap[categorySlug] })) });
await prisma.$disconnect();