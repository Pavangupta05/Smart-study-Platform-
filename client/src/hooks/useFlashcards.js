/**
 * useFlashcards — centralized flashcard fetching hook.
 * Computes due cards count using spaced repetition nextReviewDate.
 * Used by Dashboard, Flashcards page, and Reader AI sidebar.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { flashcardsService } from "../services/index";

export function useFlashcards() {
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFlashcards = useCallback(() => {
    flashcardsService.getAll()
      .then(res => setFlashcards(res.data.cards || []))
      .catch(err => console.warn("Flashcards fetch failed:", err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  // Compute due cards count (cards whose review date has passed or has no date)
  const dueCards = useMemo(() => {
    const today = new Date();
    return flashcards.filter(c => {
      if (!c.nextReviewDate) return true;
      return new Date(c.nextReviewDate) <= today;
    });
  }, [flashcards]);

  const dueCardsCount = dueCards.length;
  const masteredCount = flashcards.filter(c => c.mastered).length;

  return { flashcards, dueCards, dueCardsCount, masteredCount, loading, refetch: fetchFlashcards, setFlashcards };
}
