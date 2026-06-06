/**
 * useNotes — centralized notes fetching hook.
 * Supports optional pagination (page, limit) and localStorage fallback.
 * Used by Dashboard (paginated) and Notes page (full list).
 */
import { useState, useEffect, useCallback } from "react";
import { notesService } from "../services/index";

export function useNotes({ page = 0, limit = 0, cloudSyncEnabled = true } = {}) {
  const [notes, setNotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(() => {
    setLoading(true);

    if (!cloudSyncEnabled) {
      const saved = localStorage.getItem("starNote_files");
      if (saved) {
        try { setNotes(JSON.parse(saved)); } catch (_) {}
      }
      setLoading(false);
      return;
    }

    const params = {};
    if (limit > 0) params.limit = limit;
    if (page > 0) params.page = page;

    notesService.getAll(params)
      .then(res => {
        setNotes(res.data.notes || []);
        setTotal(res.data.total || res.data.notes?.length || 0);
      })
      .catch(() => {
        // Fall back to localStorage if backend is unreachable
        const saved = localStorage.getItem("starNote_files");
        if (saved) {
          try { setNotes(JSON.parse(saved)); } catch (_) {}
        }
      })
      .finally(() => setLoading(false));
  }, [cloudSyncEnabled, page, limit]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return { notes, total, loading, refetch: fetchNotes, setNotes };
}
