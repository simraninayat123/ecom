'use client';

import { usePathname } from 'next/navigation';
import { Header } from './header';
import { ProductRecommendationChat } from './product-recommendation-chat';

export function StorefrontChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  if (isAdmin) return <main>{children}</main>;
  return (
    <>
      <Header />
      <main>{children}</main>
      <ProductRecommendationChat />
    </>
  );
}
