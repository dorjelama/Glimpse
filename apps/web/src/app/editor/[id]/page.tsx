import EditorLayout from '@/modules/editor/components/EditorLayout';

interface Props {
  params: { id: string };
}

export default function EditorPage({ params }: Props) {
  return <EditorLayout eventId={params.id} />;
}
