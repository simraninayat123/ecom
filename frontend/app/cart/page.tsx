'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { api, formatMoney } from '../../lib/api';
import { useCart } from '../../components/cart-provider';

export default function CartPage() {
  const { cart, loading, changeQuantity, removeItem, refresh } = useCart();
  const [message, setMessage] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(''); setCheckingOut(true);
    const token = localStorage.getItem('morrow_access_token');
    if (!token) { setMessage('Please sign in before checking out.'); setCheckingOut(false); return; }
    const fields = new FormData(event.currentTarget);
    try {
      const address = await api<{ id: string }>('/addresses', { method: 'POST', body: JSON.stringify({ label: 'Checkout address', recipientName: fields.get('recipientName'), line1: fields.get('line1'), city: fields.get('city'), state: fields.get('state'), postalCode: fields.get('postalCode'), country: fields.get('country') || 'IN', phone: fields.get('phone') || undefined }) }, token);
      const order = await api<{ id: string; total: number; currency: string }>('/checkout', { method: 'POST', body: JSON.stringify({ shippingAddressId: address.id }) }, token);
      setMessage(`Order ${order.id} placed successfully — ${formatMoney(order.total, order.currency)}.`);
      await refresh();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Checkout failed'); }
    finally { setCheckingOut(false); }
  }
  if (loading) return <div className="page"><p>Loading cart…</p></div>;
  if (!cart) return <div className="page"><h1>Your cart</h1><p>Please <Link href="/login">sign in</Link> to add products and check out.</p></div>;
  return <div className="page cart"><h1>Your cart</h1>{!cart.items.length ? <p>Your cart is empty. <Link href="/">Continue shopping</Link>.</p> : <><section>{cart.items.map((item) => <div className="cart-item" key={item.id}><img src={item.product.imageUrl} alt="" /><div><h2>{item.product.name}</h2><p>{formatMoney(item.product.price, item.product.currency)}</p><div className="quantity"><button aria-label="Decrease quantity" onClick={() => item.quantity > 1 ? void changeQuantity(item.id, item.quantity - 1) : void removeItem(item.id)}>−</button><span>{item.quantity}</span><button aria-label="Increase quantity" disabled={item.quantity >= item.product.stock} onClick={() => void changeQuantity(item.id, item.quantity + 1)}>+</button><button className="text-action" onClick={() => void removeItem(item.id)}>Remove</button></div></div><strong>{formatMoney(item.lineTotal, cart.currency)}</strong></div>)}</section><aside className="checkout"><h2>Checkout</h2><div className="total"><span>Subtotal</span><strong>{formatMoney(cart.subtotal, cart.currency)}</strong></div><p className="muted">Shipping and tax are calculated as zero in this demo API.</p><form onSubmit={checkout}><label>Full name<input name="recipientName" required /></label><label>Address<input name="line1" required /></label><div className="form-row"><label>City<input name="city" required /></label><label>State<input name="state" required /></label></div><div className="form-row"><label>Postal code<input name="postalCode" required /></label><label>Country<input name="country" defaultValue="IN" required /></label></div><label>Phone (optional)<input name="phone" /></label><button disabled={checkingOut}>{checkingOut ? 'Placing order…' : 'Place order'}</button></form>{message && <p className="notice">{message}</p>}</aside></>}</div>;
}
