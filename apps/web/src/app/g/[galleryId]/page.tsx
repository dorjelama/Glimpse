import { redirect } from 'next/navigation';

export default function GalleryIndexPage({ params }: { params: { galleryId: string } }) {
  redirect(`/g/${params.galleryId}/feed`);
}
