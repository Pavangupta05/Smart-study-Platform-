/**
 * useTasks — centralized task management hook using React Query.
 * Handles fetch / add / toggle / delete with localStorage fallback.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksService } from "../services/index";
import { toast } from "sonner";

export function useTasks(cloudSyncEnabled = true) {
  const queryClient = useQueryClient();

  // 1. Fetch Tasks
  const { data: tasks = [], isLoading: loading, refetch: fetchTasks } = useQuery({
    queryKey: ["tasks", cloudSyncEnabled],
    queryFn: async () => {
      if (!cloudSyncEnabled) {
        const saved = localStorage.getItem("starNote_tasks");
        return saved ? JSON.parse(saved) : [];
      }
      try {
        const res = await tasksService.getAll();
        return res.data.tasks || [];
      } catch (err) {
        // Fallback to local
        const saved = localStorage.getItem("starNote_tasks");
        return saved ? JSON.parse(saved) : [];
      }
    },
  });

  // Helper to update local storage if needed
  const updateLocal = (newTasks) => {
    if (!cloudSyncEnabled) {
      localStorage.setItem("starNote_tasks", JSON.stringify(newTasks));
    }
  };

  // 2. Add Task Mutation
  const addMutation = useMutation({
    mutationFn: async (text) => {
      if (!cloudSyncEnabled) return { _id: `local_${Date.now()}`, text, completed: false };
      const res = await tasksService.create({ text });
      return res.data.task;
    },
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData(["tasks", cloudSyncEnabled]);
      const optimistic = { _id: `temp_${Date.now()}`, text, completed: false };
      
      const newTasks = [optimistic, ...(previousTasks || [])];
      queryClient.setQueryData(["tasks", cloudSyncEnabled], newTasks);
      updateLocal(newTasks);
      
      return { previousTasks };
    },
    onError: (err, text, context) => {
      toast.error("Failed to add task.");
      queryClient.setQueryData(["tasks", cloudSyncEnabled], context.previousTasks);
      updateLocal(context.previousTasks);
    },
    onSuccess: (newTask, text, context) => {
      if (cloudSyncEnabled) {
        // Replace temp ID with real ID
        queryClient.setQueryData(["tasks", cloudSyncEnabled], (old) => 
          old.map(t => t._id?.startsWith('temp_') ? newTask : t)
        );
      }
    }
  });

  // 3. Toggle Task Mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }) => {
      if (!cloudSyncEnabled) return { id, completed };
      await tasksService.toggle(id, completed);
      return { id, completed };
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData(["tasks", cloudSyncEnabled]);
      
      const newTasks = (previousTasks || []).map(t => 
        (t._id || t.id) === id ? { ...t, completed } : t
      );
      queryClient.setQueryData(["tasks", cloudSyncEnabled], newTasks);
      updateLocal(newTasks);
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      toast.error("Failed to update task.");
      queryClient.setQueryData(["tasks", cloudSyncEnabled], context.previousTasks);
      updateLocal(context.previousTasks);
    }
  });

  // 4. Delete Task Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      if (!cloudSyncEnabled) return id;
      await tasksService.delete(id);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData(["tasks", cloudSyncEnabled]);
      
      const newTasks = (previousTasks || []).filter(t => (t._id || t.id) !== id);
      queryClient.setQueryData(["tasks", cloudSyncEnabled], newTasks);
      updateLocal(newTasks);
      
      return { previousTasks };
    },
    onError: (err, id, context) => {
      toast.error("Failed to delete task.");
      queryClient.setQueryData(["tasks", cloudSyncEnabled], context.previousTasks);
      updateLocal(context.previousTasks);
    }
  });

  // Simplified public API
  const addTask = (text) => addMutation.mutate(text);
  const toggleTask = (id) => {
    const task = tasks.find(t => (t._id || t.id) === id);
    if (task) toggleMutation.mutate({ id, completed: !task.completed });
  };
  const deleteTask = (id) => deleteMutation.mutate(id);

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.filter(t => !t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return { 
    tasks, 
    loading, 
    fetchTasks, 
    addTask, 
    toggleTask, 
    deleteTask, 
    completedCount, 
    pendingCount, 
    progress 
  };
}
