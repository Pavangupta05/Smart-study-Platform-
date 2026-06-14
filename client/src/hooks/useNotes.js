/**
 * useNotes — centralized notes fetching hook using React Query.
 * Uses cursor-based pagination. Pass limit to control page size.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notesService } from "../services/index";

export function useNotes({ limit = 20, cloudSyncEnabled = true } = {}) {
  const queryClient = useQueryClient();

  const { data = { notes: [], total: 0, hasMore: false, nextCursor: null }, isLoading: loading, refetch: fetchNotes } = useQuery({
    queryKey: ["notes", { limit, cloudSyncEnabled }],
    queryFn: async () => {
      if (!cloudSyncEnabled) {
        const saved = localStorage.getItem("starNote_files");
        const parsedNotes = saved ? JSON.parse(saved) : [];
        return { notes: parsedNotes, total: parsedNotes.length, hasMore: false, nextCursor: null };
      }

      try {
        const res = await notesService.getAll({ limit });
        return {
          notes: res.data.notes || [],
          total: res.data.total || res.data.notes?.length || 0,
          hasMore: res.data.hasMore || false,
          nextCursor: res.data.nextCursor || null,
        };
      } catch (err) {
        const saved = localStorage.getItem("starNote_files");
        const parsedNotes = saved ? JSON.parse(saved) : [];
        return { notes: parsedNotes, total: parsedNotes.length, hasMore: false, nextCursor: null };
      }
    },
  });

  // Provide a setNotes function for backwards compatibility with optimistic updates
  const setNotes = (updater) => {
    queryClient.setQueryData(["notes", { limit, cloudSyncEnabled }], (oldData) => {
      const currentNotes = oldData?.notes || [];
      const newNotes = typeof updater === 'function' ? updater(currentNotes) : updater;
      return { ...oldData, notes: newNotes, total: oldData?.total || newNotes.length };
    });
  };

  return { notes: data.notes, total: data.total, hasMore: data.hasMore, nextCursor: data.nextCursor, loading, refetch: fetchNotes, setNotes };
}
