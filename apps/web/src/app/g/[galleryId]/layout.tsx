import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';

export async function generateMetadata(
  { params }: { params: Promise<{ galleryId: string }> },
): Promise<Metadata> {
  const { galleryId } = await params;
  return {
    manifest: `/g/${galleryId}/pwa-manifest`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'Glimpses',
    },
    icons: {
      apple: '/logo without text.png',
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#B85C37',
};

export default function GalleryLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
