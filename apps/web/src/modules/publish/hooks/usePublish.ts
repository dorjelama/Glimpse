import { useState } from 'react';
import { useEditorStore } from '../../editor/store/editorStore';
import { api } from '@/lib/api';

export function usePublish() {
  const event = useEditorStore((s) => s.event);
  const setEvent = useEditorStore((s) => s.setEvent);
  const saveNow = useEditorStore((s) => s.saveNow);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publish = async () => {
    if (!event) return;
    setPublishing(true);
    setError(null);
    try {
      // Save latest state first
      await saveNow();
      const result = await api.publishEvent(event.id);
      setEvent(result.event);
      return result;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setPublishing(false);
    }
  };

  const unpublish = async () => {
    if (!event) return;
    setPublishing(true);
    setError(null);
    try {
      const updated = await api.unpublishEvent(event.id);
      setEvent(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPublishing(false);
    }
  };

  return { event, publish, unpublish, publishing, error };
}
