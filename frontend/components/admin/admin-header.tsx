'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function AdminHeader({ title, onMenu }: { title: string; onMenu: () => void }) {
  const router = useRouter();
  function signOut() { localStorage.removeItem('morrow_access_token'); window.dispatchEvent(new Event('morrow-auth-changed')); router.replace('/admin/login'); }
  return <header className="admin-header"><button className="admin-menu-button" aria-label="Open navigation" onClick={onMenu}>Menu</button><div><span className="eyebrow">Morrow Supply Admin</span><h1>{title}</h1></div><div className="admin-header-actions"><Link className="admin-text-link" href="/">View Store</Link><button className="admin-button secondary" onClick={signOut}>Sign out</button></div></header>;
}