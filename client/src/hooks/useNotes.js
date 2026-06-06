/**
 * useNotes — centralized notes fetching hook using React Query.
 * Supports optional pagination (page, limit) and localStorage fallback.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notesService } from "../services/index";

export function useNotes({ page = 0, limit = 0, cloudSyncEnabled = true } = {}) {
  const queryClient = useQueryClient();

  const { data = { notes: [], total: 0 }, isLoading: loading, refetch: fetchNotes } = useQuery({
    queryKey: ["notes", { page, limit, cloudSyncEnabled }],
    queryFn: async () => {
      if (!cloudSyncEnabled) {
        const saved = localStorage.getItem("starNote_files");
        const parsedNotes = saved ? JSON.parse(saved) : [];
        return { notes: parsedNotes, total: parsedNotes.length };
      }

      const params = {};
      if (limit > 0) params.limit = limit;
      if (page > 0) params.page = page;

      try {
        const res = await notesService.getAll(params);
        return {
          notes: res.data.notes || [],
          total: res.data.total || res.data.notes?.length || 0
        };
      } catch (err) {
        const saved = localStorage.getItem("starNote_files");
        const parsedNotes = saved ? JSON.parse(saved) : [];
        return { notes: parsedNotes, total: parsedNotes.length };
      }
    },
  });

  // Provide a setNotes function for backwards compatibility with optimistic updates
  const setNotes = (updater) => {
    queryClient.setQueryData(["notes", { page, limit, cloudSyncEnabled }], (oldData) => {
      const currentNotes = oldData?.notes || [];
      const newNotes = typeof updater === 'function' ? updater(currentNotes) : updater;
      return { notes: newNotes, total: oldData?.total || newNotes.length };
    });
  };

  return { notes: data.notes, total: data.total, loading, refetch: fetchNotes, setNotes };
}
