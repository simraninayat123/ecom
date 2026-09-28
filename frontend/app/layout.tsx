import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '../components/cart-provider';
import { StorefrontChrome } from '../components/storefront-chrome';

export const metadata: Metadata = {
  title: 'Morrow Supply',
  description: 'Thoughtful goods for everyday rituals.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <StorefrontChrome>{children}</StorefrontChrome>
        </CartProvider>
      </body>
    </html>
  );
}
