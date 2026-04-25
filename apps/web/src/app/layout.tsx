import type { Metadata, Viewport } from 'next';
import './globals.css';
import StatusBar from '@/components/StatusBar';
import NavigationProgress from '@/components/NavigationProgress';
import CookieBanner from '@/components/CookieBanner';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: 'Glimpse',
  description: 'Create beautiful digital cards with a drag-and-drop editor',
  icons: {
    icon: '/logo without text.png',
    apple: '/logo without text.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavigationProgress />
        {children}
        <CookieBanner />
        <StatusBar />
      </body>
    </html>
  );
}
