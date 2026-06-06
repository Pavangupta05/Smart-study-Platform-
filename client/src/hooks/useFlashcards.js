/**
 * useFlashcards — centralized flashcard fetching hook using React Query.
 * Computes due cards count using spaced repetition nextReviewDate.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { flashcardsService } from "../services/index";

export function useFlashcards() {
  const queryClient = useQueryClient();

  const { data: flashcards = [], isLoading: loading, refetch: fetchFlashcards } = useQuery({
    queryKey: ["flashcards"],
    queryFn: async () => {
      try {
        const res = await flashcardsService.getAll();
        return res.data.cards || [];
      } catch (err) {
        console.warn("Flashcards fetch failed:", err.message);
        return [];
      }
    },
  });

  const setFlashcards = (updater) => {
    queryClient.setQueryData(["flashcards"], (oldData) => {
      const current = oldData || [];
      return typeof updater === 'function' ? updater(current) : updater;
    });
  };

  const today = new Date();
  const dueCards = flashcards.filter(c => {
    if (!c.nextReviewDate) return true;
    return new Date(c.nextReviewDate) <= today;
  });

  const dueCardsCount = dueCards.length;
  const masteredCount = flashcards.filter(c => c.mastered).length;

  return { flashcards, dueCards, dueCardsCount, masteredCount, loading, refetch: fetchFlashcards, setFlashcards };
}
