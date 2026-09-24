'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, Cart } from '../lib/api';

type CartContextValue = {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (productId: string) => Promise<void>;
  changeQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);
const tokenKey = 'morrow_access_token';

function getToken() {
  return typeof window === 'undefined' ? null : localStorage.getItem(tokenKey);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) { setCart(null); setLoading(false); return; }
    try { setCart(await api<Cart>('/cart', {}, token)); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load cart'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const onAuthChange = () => { setLoading(true); void refresh(); };
    window.addEventListener('morrow-auth-changed', onAuthChange);
    return () => window.removeEventListener('morrow-auth-changed', onAuthChange);
  }, [refresh]);

  const requireToken = () => {
    const token = getToken();
    if (!token) throw new Error('Please sign in before adding products to your cart.');
    return token;
  };
  const addItem = async (productId: string) => { setCart(await api<Cart>('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity: 1 }) }, requireToken())); };
  const changeQuantity = async (itemId: string, quantity: number) => { setCart(await api<Cart>(`/cart/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }, requireToken())); };
  const removeItem = async (itemId: string) => { setCart(await api<Cart>(`/cart/items/${itemId}`, { method: 'DELETE' }, requireToken())); };
  const value = useMemo(() => ({ cart, loading, error, refresh, addItem, changeQuantity, removeItem }), [cart, loading, error, refresh]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}
