import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
      cacheTime: 1000 * 60 * 30, // Unused cache data lives for 30 minutes
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch every time the user switches tabs
    },
  },
});
