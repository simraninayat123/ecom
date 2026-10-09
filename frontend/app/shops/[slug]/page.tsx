'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getShopProducts, Product, formatMoney } from '../../../lib/api';

export default function ShopPage() {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (slug)
      getShopProducts(slug)
        .then(setProducts)
        .catch((cause: unknown) =>
          setError(
            cause instanceof Error ? cause.message : 'Unable to load shop',
          ),
        );
  }, [slug]);
  return (
    <div className="page">
      <Link className="admin-text-link" href="/">
        ← All shops
      </Link>
      <section className="hero">
        <p className="eyebrow">Shop</p>
        <h1>{slug}</h1>
        <p>Products from this seller.</p>
      </section>
      {error && <p className="notice">{error}</p>}
      <section className="grid">
        {products.map((product) => (
          <Link
            className="card"
            href={`/shops/${slug}/products/${product.slug}`}
            key={product.id}
          >
            <img src={product.imageUrl} alt={product.name} />
            <h2>{product.name}</h2>
            <p className="muted">{product.category?.name}</p>
            <strong>{formatMoney(product.price, product.currency)}</strong>
          </Link>
        ))}
      </section>
    </div>
  );
}
