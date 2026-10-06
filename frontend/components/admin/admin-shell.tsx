'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminApi, ApiError } from '../../lib/api';
import { AdminHeader } from './admin-header';
import { AdminSidebar } from './admin-sidebar';

const titles: Record<string, string> = { '/admin': 'Dashboard', '/admin/products': 'Products', '/admin/products/new': 'Add product', '/admin/categories': 'Categories', '/admin/rag': 'RAG indexing' };
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [verified, setVerified] = useState(pathname === '/admin/login' ? true : false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (pathname === '/admin/login') return;
    let active = true;
    adminApi('/admin/products').then(() => { if (active) setVerified(true); }).catch((error: unknown) => {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) { localStorage.removeItem('morrow_access_token'); router.replace('/admin/login'); return; }
      if (active) setVerified(true);
    });
    return () => { active = false; };
  }, [pathname, router]);
  if (pathname === '/admin/login') return children;
  if (!verified) return <main className="admin-loading" aria-busy="true">Verifying administrator access...</main>;
  const title = pathname.startsWith('/admin/products/') && pathname !== '/admin/products/new' ? 'Edit product' : titles[pathname] ?? 'Admin';
  return <div className="admin-app"><AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="admin-main"><AdminHeader title={title} onMenu={() => setSidebarOpen(true)} /><div className="admin-content">{children}</div></div></div>;
}