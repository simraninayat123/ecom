import type { Metadata } from 'next';
import './globals.css';
import { Header } from '../components/header';
import { CartProvider } from '../components/cart-provider';
import { ProductRecommendationChat } from '../components/product-recommendation-chat';

export const metadata: Metadata = {
  title: 'Morrow Supply',
  description: 'Thoughtful goods for everyday rituals.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <ProductRecommendationChat />
        </CartProvider>
      </body>
    </html>
  );
}
