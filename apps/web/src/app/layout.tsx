import type { Metadata, Viewport } from 'next';
import './globals.css';
import StatusBar from '@/components/StatusBar';

export const metadata: Metadata = {
  title: 'Glimpse — Invitation Builder',
  description: 'Create beautiful digital invitations with a drag-and-drop editor',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <StatusBar />
      </body>
    </html>
  );
}
