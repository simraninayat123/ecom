'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getShops, Shop } from '../lib/api';

export default function Home() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    getShops()
      .then(setShops)
      .catch((cause) => setError(cause.message));
  }, []);
  return (
    <div className="page">
      <section className="hero">
        <p className="eyebrow">Independent shops, thoughtfully chosen</p>
        <h1>Find your next favourite store.</h1>
        <p>Browse products from every seller in one place.</p>
      </section>
      {error && <p className="notice">{error}</p>}
      <section className="grid">
        {shops.map((shop) => (
          <Link
            className="card shop-card"
            href={`/shops/${shop.slug}`}
            key={shop.id}
          >
            {shop.products?.[0]?.imageUrl ? (
              <img
                className="shop-card-image"
                src={shop.products[0].imageUrl}
                alt=""
              />
            ) : (
              <div className="shop-card-mark">{shop.name.slice(0, 1)}</div>
            )}
            <h2>{shop.name}</h2>
            <p className="muted">{shop._count?.products ?? 0} products</p>
            <span className="admin-text-link">Visit shop →</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
