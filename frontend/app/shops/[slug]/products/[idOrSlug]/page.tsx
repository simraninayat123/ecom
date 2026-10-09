'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  getShopProduct,
  Product,
  Shop,
  formatMoney,
} from '../../../../../lib/api';
import { useCart } from '../../../../../components/cart-provider';

export default function ShopProductPage() {
  const { slug, idOrSlug } = useParams<{ slug: string; idOrSlug: string }>();
  const [data, setData] = useState<{ shop: Shop; product: Product }>();
  const [error, setError] = useState('');
  const { addItem } = useCart();
  useEffect(() => {
    if (slug && idOrSlug)
      getShopProduct(slug, idOrSlug)
        .then(setData)
        .catch((cause: unknown) =>
          setError(
            cause instanceof Error ? cause.message : 'Unable to load product',
          ),
        );
  }, [slug, idOrSlug]);
  if (error)
    return (
      <div className="page">
        <p className="notice">{error}</p>
      </div>
    );
  if (!data)
    return (
      <div className="page">
        <p className="muted">Loading product…</p>
      </div>
    );
  const { product, shop } = data;
  return (
    <div className="page product-detail">
      <img src={product.imageUrl} alt={product.name} />
      <div>
        <Link className="admin-text-link" href={`/shops/${shop.slug}`}>
          ← {shop.name}
        </Link>
        <p className="eyebrow">{product.category?.name ?? shop.name}</p>
        <h1>{product.name}</h1>
        <strong className="price">
          {formatMoney(product.price, product.currency)}
        </strong>
        <p>{product.description}</p>
        <p className="muted">{product.stock} available</p>
        <button
          disabled={!product.stock}
          onClick={() => void addItem(product.id)}
        >
          {product.stock ? 'Add to cart' : 'Sold out'}
        </button>
      </div>
    </div>
  );
}
