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

- API: NestJS, TypeScript, Prisma, PostgreSQL, pgvector
- Storefront: Next.js and React
- Authentication: bcrypt and JWT bearer tokens
- Local database: Docker Compose / PostgreSQL 16

## Run locally

Requirements: Node.js, npm, Docker, and Docker Compose. PostgreSQL runs from the `pgvector/pgvector:pg16` image so the vector extension is available locally.

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

### RAG recommendations

The recommendation API uses Hugging Face hosted inference for embeddings with
`BAAI/bge-small-en-v1.5` (384 dimensions) and pgvector for cosine similarity.
Set the following in `.env` to enable it:

```env
HF_TOKEN="your-hugging-face-token"
HF_EMBEDDING_MODEL="BAAI/bge-small-en-v1.5"
HF_EMBEDDING_PROVIDER="hf-inference"
RAG_INDEXING_INTERVAL_MS=5000
RAG_RETRIEVAL_LIMIT=5
RAG_MIN_SIMILARITY=0.35
```

Create a Hugging Face access token with permission to use Inference Providers
from your Hugging Face account settings. The token stays on the API server and
must never be exposed to the frontend. Hosted inference is subject to Hugging
Face account credits and provider rate limits even though the embedding model
is open source.

Product creates, updates, and deactivations made through the admin API enqueue
one durable Postgres indexing job per product. The NestJS worker claims jobs
with row locks, embeds the latest canonical product document, and upserts the
pgvector record. Failed provider calls retry with exponential backoff and then
become visible as terminal failures.

```http
POST /rag/recommendations
Content-Type: application/json

{"query":"I need a warm blanket for cool evenings","limit":5}
```

Admin indexing operations require an `ADMIN` bearer token:

```http
GET /admin/rag/indexing-status
POST /admin/rag/reindex
Authorization: Bearer <adminAccessToken>
```

`reindex` only queues work; it does not make Hugging Face requests during the
HTTP request. A missing `HF_TOKEN` returns `503` when recommendations or a
worker job needs embeddings.

#### LLM answers (OpenRouter)

After retrieval, the top matching products are sent to an LLM through
[OpenRouter](https://openrouter.ai) to write a conversational answer grounded
only in those catalog entries. Set the following in `.env`:

```env
OPENROUTER_API_KEY="your-openrouter-key"
OPENROUTER_MODEL="openai/gpt-4.1-mini,google/gemini-2.5-flash,openai/gpt-4.1-nano"
OPENROUTER_TIMEOUT_MS=20000
```

`OPENROUTER_MODEL` is a comma-separated list: OpenRouter tries the first model
and falls back to the next ones if it is rate-limited or unavailable. Free models
(ending in `:free`) also work, but they have low rate limits and their
availability changes. The defaults are low-cost paid models (roughly $0.002 per
assistant turn), which need OpenRouter credits but are far more reliable.

If the key is missing, the model errors, or it times out, the API falls
back to a template answer built from the top product, so recommendations keep
working. The response's `answerSource` field is `llm` or `template` to show
which path produced the answer.

#### Shopping assistant with tools

The storefront chat widget calls `POST /rag/chat`, an agent loop where the LLM
calls tools to answer from live data:

| Tool | Sign-in | Purpose |
| --- | --- | --- |
| `search_products` | No | Semantic search with optional price (in rupees), category and stock filters |
| `get_product_details`, `compare_products` | No | Details, variants and stock for one or several products |
| `similar_products` | No | Nearest neighbours of a product, optionally only cheaper ones |
| `list_categories` | No | Categories and product counts |
| `list_my_orders`, `get_order_details` | Yes | The shopper's orders: status, dates, items, amounts, shipping address |
| `view_cart`, `add_to_cart`, `update_cart_item` | Yes | Read and change the shopper's cart |

```http
POST /rag/chat
Authorization: Bearer <accessToken>   (optional)
Content-Type: application/json

{"message":"where's my latest order?","history":[{"role":"user","content":"..."},{"role":"assistant","content":"..."}]}
```

The response contains `answer`, product cards (`products`), order cards
(`orders`), `cartUpdated`, and `answerSource`. The bearer token is optional:
without it, order and cart tools reply that the shopper must sign in. Tools
always use the user id from the token, never from the model, so a prompt cannot
read another shopper's orders. Each turn is capped at five LLM calls, and the
first call must use a tool so answers come from fresh data. Payment and refund
data is not modelled yet, so the assistant says it cannot see it.

## API overview

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /users/me` |
| Catalogue | `GET /categories`, `GET /categories/:slug`, `GET /products`, `GET /products/:idOrSlug` |
| Cart | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:itemId`, `DELETE /cart/items/:itemId`, `DELETE /cart` |
| Addresses | `GET /addresses`, `POST /addresses`, `PATCH /addresses/:id`, `DELETE /addresses/:id` |
| Orders | `POST /checkout`, `GET /orders`, `GET /orders/:id` |
| Recommendations | `POST /rag/recommendations`, `POST /rag/chat` |
| Admin RAG | `GET /admin/rag/indexing-status`, `POST /admin/rag/reindex` |
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
