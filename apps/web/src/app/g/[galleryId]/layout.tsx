import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';

export async function generateMetadata(
  { params }: { params: { galleryId: string } },
): Promise<Metadata> {
  return {
    manifest: `/g/${params.galleryId}/pwa-manifest`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'Glimpses',
    },
    icons: {
      apple: '/icon.png',
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#B85C37',
};

export default function GalleryLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
