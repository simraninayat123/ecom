'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getShops, Shop } from '../../lib/api';

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getShops()
      .then(setShops)
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : 'Unable to load shops'),
      );
  }, []);

  return (
    <div className="page">
      <Link className="admin-text-link" href="/">
        ← Home
      </Link>
      <section className="hero">
        <p className="eyebrow">Marketplace</p>
        <h1>Browse independent shops.</h1>
        <p>Discover products from every seller on the platform.</p>
      </section>
      {error && <p className="notice">{error}</p>}
      <section className="grid">
        {shops.map((shop) => (
          <Link className="card shop-card" href={`/shops/${shop.slug}`} key={shop.id}>
            {shop.products?.[0]?.imageUrl ? <img className="shop-card-image" src={shop.products[0].imageUrl} alt="" /> : <div className="shop-card-mark">{shop.name.slice(0, 1)}</div>}
            <h2>{shop.name}</h2>
            <p className="muted">{shop._count?.products ?? 0} products</p>
            <span className="admin-text-link">Visit shop →</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
