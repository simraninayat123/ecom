'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from './cart-provider';

export function Header() {
  const { cart } = useCart();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const update = () => setSignedIn(Boolean(localStorage.getItem('morrow_access_token')));
    update(); window.addEventListener('morrow-auth-changed', update);
    return () => window.removeEventListener('morrow-auth-changed', update);
  }, []);
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  return <header><nav><Link className="brand" href="/">Morrow Supply</Link><div className="nav-links"><Link href="/">Shop</Link><Link href="/cart">Cart ({itemCount})</Link>{signedIn ? <button className="link-button" onClick={() => { localStorage.removeItem('morrow_access_token'); window.dispatchEvent(new Event('morrow-auth-changed')); }}>Sign out</button> : <Link href="/login">Sign in</Link>}</div></nav></header>;
}
