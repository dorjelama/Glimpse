import { useState } from 'react';
import { useEditorStore } from '../../editor/store/editorStore';
import { api } from '@/lib/api';

export function usePublish() {
  const project = useEditorStore((s) => s.project);
  const setProject = useEditorStore((s) => s.setProject);
  const saveNow = useEditorStore((s) => s.saveNow);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publish = async () => {
    if (!project) return;
    setPublishing(true);
    setError(null);
    try {
      // Save latest state first
      await saveNow();
      const result = await api.publishProject(project.id);
      setProject(result.project);
      return result;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setPublishing(false);
    }
  };

  const unpublish = async () => {
    if (!project) return;
    setPublishing(true);
    setError(null);
    try {
      const updated = await api.unpublishProject(project.id);
      setProject(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPublishing(false);
    }
  };

  return { project, publish, unpublish, publishing, error };
}
