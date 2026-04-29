import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> },
) {
  const { galleryId } = await params;
  let eventTitle = 'Glimpses';
  try {
    const res = await fetch(`${API_URL}/gallery/${galleryId}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.project?.title) eventTitle = `${data.project.title} · Glimpses`;
    }
  } catch { /* fall back to generic name */ }

  const manifest = {
    name: eventTitle,
    short_name: 'Glimpses',
    description: 'Live photo feed for your event',
    start_url: `/g/${galleryId}/feed`,
    display: 'standalone',
    background_color: '#fdf6e8',
    theme_color: '#B85C37',
    orientation: 'portrait',
    icons: [
      {
        src: '/logo without text.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
}
