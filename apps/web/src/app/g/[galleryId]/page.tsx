import { redirect } from 'next/navigation';

export default async function GalleryIndexPage({ params }: { params: Promise<{ galleryId: string }> }) {
  const { galleryId } = await params;
  redirect(`/g/${galleryId}/feed`);
}
