import { use } from 'react';
import EditorLayout from '@/modules/editor/components/EditorLayout';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditorPage({ params }: Props) {
  const { id } = use(params);
  return <EditorLayout eventId={id} />;
}
