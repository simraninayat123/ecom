'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, formatMoney, Product } from '../../../lib/api';
import { useCart } from '../../../components/cart-provider';

export default function ProductPage() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState('');
  const { addItem } = useCart();
  useEffect(() => { api<Product>(`/products/${idOrSlug}`).then(setProduct).catch((error: Error) => setMessage(error.message)); }, [idOrSlug]);
  if (message && !product) return <div className="page"><p className="notice">{message}</p></div>;
  if (!product) return <div className="page"><p>Loading product…</p></div>;
  return <div className="page product-detail"><img src={product.imageUrl} alt={product.name} /><div><p className="eyebrow">{product.category?.name ?? 'Morrow Supply'}</p><h1>{product.name}</h1><strong className="price">{formatMoney(product.price, product.currency)}</strong><p>{product.description}</p><p className="muted">{product.stock} available</p><button disabled={!product.stock} onClick={() => void addItem(product.id).then(() => setMessage('Added to your cart.')).catch((error: Error) => setMessage(error.message))}>{product.stock ? 'Add to cart' : 'Sold out'}</button>{message && <p className="notice">{message}</p>}</div></div>;
}
