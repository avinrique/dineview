import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/providers';

const inter = Inter({ subsets: ['latin'] });
// Display serif for headlines and text-only dish tiles
const fraunces = Fraunces({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'DineView - Smart Restaurant Ordering',
  description: 'Scan the table QR, see every dish on your table in AR, and order from your phone.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f97316',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${fraunces.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
