'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getProducts, Product, formatMoney } from '../lib/api';
import { useCart } from '../components/cart-provider';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const { addItem } = useCart();
  useEffect(() => { getProducts().then((result) => setProducts(result.data)).catch((cause) => setError(cause.message)); }, []);
  async function add(productId: string) { try { setAdding(productId); await addItem(productId); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not add item'); } finally { setAdding(null); } }
  return <div className="page"><section className="hero"><p className="eyebrow">Small objects, well chosen</p><h1>Everyday goods for quieter rituals.</h1><p>Browse the current Morrow Supply collection.</p></section>{error && <p className="notice">{error}</p>}<section className="grid">{products.map((product) => <article className="card" key={product.id}><Link href={`/products/${product.slug}`}><img src={product.imageUrl} alt={product.name} /><h2>{product.name}</h2></Link><p className="muted">{product.category?.name}</p><div className="card-footer"><strong>{formatMoney(product.price, product.currency)}</strong><button disabled={!product.stock || adding === product.id} onClick={() => void add(product.id)}>{adding === product.id ? 'Adding…' : product.stock ? 'Add to cart' : 'Sold out'}</button></div></article>)}</section></div>;
}
