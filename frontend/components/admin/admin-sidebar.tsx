'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getActiveSellerName } from '../../lib/api';

const links = [['Dashboard', '/admin'], ['Products', '/admin/products'], ['Categories', '/admin/categories'], ['RAG Indexing', '/admin/rag']];
export function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const sellerName = getActiveSellerName();
  return <aside className={`admin-sidebar ${open ? 'open' : ''}`}><div className="admin-brand"><span className="eyebrow">Operations</span><strong>{sellerName}</strong></div><nav aria-label="Admin navigation">{links.map(([label, href]) => <Link className={pathname === href ? 'current' : ''} onClick={onClose} href={href} key={href}>{label}</Link>)}</nav><Link className="admin-store-link" href="/">Back to Store</Link></aside>;
}
