# Morrow Supply

Morrow Supply is a demo e-commerce application with a NestJS API, PostgreSQL database managed by Prisma, and a small Next.js storefront.

## Included

- JWT registration, login, and profile endpoint
- Public catalogue with categories, search, price filters, sorting, and pagination
- Authenticated cart, address book, checkout, and customer order history
- Admin APIs for catalogue management, images, variants, inventory adjustments, and order status changes
- Health check, rate limiting, environment validation, and Swagger UI
- Next.js demo storefront for browsing, authentication, cart management, and checkout

Prices are stored as integer minor units. The default currency is INR; for example, `4800` represents ₹48.00.

## Tech stack

- API: NestJS, TypeScript, Prisma, PostgreSQL
- Storefront: Next.js and React
- Authentication: bcrypt and JWT bearer tokens
- Local database: Docker Compose / PostgreSQL 16

## Run locally

Requirements: Node.js, npm, Docker, and Docker Compose.

```bash
# API dependencies and configuration
npm install
cp .env.example .env

# Start Postgres, apply versioned migrations, and seed the catalogue
npm run db:up
npm run db:migrate
npm run db:seed

# Start the API at http://localhost:3000
npm run start:dev
```

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open the storefront at `http://localhost:3001`. Swagger documentation is available at `http://localhost:3000/docs` and the health check at `http://localhost:3000/health`.

Change `JWT_SECRET` in `.env` before using the application outside local development. `NEXT_PUBLIC_API_URL` in `frontend/.env.local` defaults to `http://localhost:3000`.

## API overview

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /users/me` |
| Catalogue | `GET /categories`, `GET /categories/:slug`, `GET /products`, `GET /products/:idOrSlug` |
| Cart | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:itemId`, `DELETE /cart/items/:itemId`, `DELETE /cart` |
| Addresses | `GET /addresses`, `POST /addresses`, `PATCH /addresses/:id`, `DELETE /addresses/:id` |
| Orders | `POST /checkout`, `GET /orders`, `GET /orders/:id` |
| Operations | `GET /health`, `GET /docs` |

Catalogue filtering example:

```text
GET /products?search=mug&category=home&minPrice=1000&maxPrice=5000&sort=price_asc&page=1&limit=20
```

Cart, addresses, checkout, and orders require `Authorization: Bearer <accessToken>`.

## Admin access

All `/admin/*` routes require a JWT for a user with the `ADMIN` role. The admin API supports category and product CRUD, image and variant management, inventory adjustments, order listing, and valid order-status transitions.

There is no admin-registration endpoint. For local development, promote an existing user directly in Postgres:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

Then log in again to receive a token containing the new role.

## Testing and builds

```bash
# API checks
npm run lint
npm run build
npm test
npm run test:e2e

# Storefront production build
cd frontend && npm run build
```

## Current demo limitations

- Payment processing, shipping, tax calculation, refunds, and transactional email are not implemented.
- Product variants can be managed by admins but are not yet selectable in the cart or checkout.
- Checkout needs idempotency/cart locking before production use to prevent duplicate concurrent orders.
- Inventory should be changed through the dedicated adjustment endpoint to keep an audit trail.
- The storefront is intentionally basic and does not include account, order-history, search/filter, or admin screens.

## Database commands

Use migrations for schema changes:

```bash
npx prisma migrate dev --name describe_the_change
npx prisma generate
```

Do not use `prisma db push` as the normal schema workflow. Keep `prisma/migrations` committed.
