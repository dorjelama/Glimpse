import GuestsPageClient from './GuestsPageClient';

export default async function GuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GuestsPageClient projectId={id} />;
}
