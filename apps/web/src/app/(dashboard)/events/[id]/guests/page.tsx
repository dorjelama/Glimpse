import GuestsPageClient from './GuestsPageClient';

export default async function GuestsPage({ params }: { params: { id: string } }) {
  return <GuestsPageClient projectId={params.id} />;
}
