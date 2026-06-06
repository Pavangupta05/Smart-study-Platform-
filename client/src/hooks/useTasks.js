/**
 * useTasks — centralized task management hook.
 * Handles fetch / add / toggle / delete with localStorage fallback.
 * Used by Dashboard, Planner, and any other page that needs tasks.
 */
import { useState, useEffect, useCallback } from "react";
import { tasksService } from "../services/index";
import { toast } from "sonner";

export function useTasks(cloudSyncEnabled = true) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(() => {
    if (!cloudSyncEnabled) {
      const saved = localStorage.getItem("starNote_tasks");
      if (saved) {
        try { setTasks(JSON.parse(saved)); } catch (_) {}
      }
      setLoading(false);
      return;
    }
    tasksService.getAll()
      .then(res => {
        setTasks(res.data.tasks || []);
      })
      .catch(() => {
        // Fall back to localStorage if backend is unreachable
        const saved = localStorage.getItem("starNote_tasks");
        if (saved) {
          try { setTasks(JSON.parse(saved)); } catch (_) {}
        }
      })
      .finally(() => setLoading(false));
  }, [cloudSyncEnabled]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(async (text) => {
    if (!text?.trim()) return;
    const optimistic = { _id: `local_${Date.now()}`, text, completed: false };

    if (!cloudSyncEnabled) {
      setTasks(prev => {
        const next = [optimistic, ...prev];
        localStorage.setItem("starNote_tasks", JSON.stringify(next));
        return next;
      });
      return;
    }

    // Optimistic update
    setTasks(prev => [optimistic, ...prev]);
    try {
      const res = await tasksService.create({ text });
      // Replace optimistic entry with server response
      setTasks(prev => prev.map(t => t._id === optimistic._id ? res.data.task : t));
    } catch {
      toast.error("Failed to sync task with server.");
      setTasks(prev => prev.filter(t => t._id !== optimistic._id));
    }
  }, [cloudSyncEnabled]);

  const toggleTask = useCallback(async (id) => {
    const task = tasks.find(t => (t._id || t.id) === id);
    if (!task) return;
    const completed = !task.completed;

    setTasks(prev => {
      const next = prev.map(t => (t._id || t.id) === id ? { ...t, completed } : t);
      if (!cloudSyncEnabled) localStorage.setItem("starNote_tasks", JSON.stringify(next));
      return next;
    });

    if (cloudSyncEnabled) {
      try {
        await tasksService.toggle(id, completed);
      } catch {
        toast.error("Failed to update task.");
        setTasks(prev => prev.map(t => (t._id || t.id) === id ? { ...t, completed: !completed } : t));
      }
    }
  }, [tasks, cloudSyncEnabled]);

  const deleteTask = useCallback(async (id) => {
    const taskToDelete = tasks.find(t => (t._id || t.id) === id);
    if (!taskToDelete) return;

    setTasks(prev => {
      const next = prev.filter(t => (t._id || t.id) !== id);
      if (!cloudSyncEnabled) localStorage.setItem("starNote_tasks", JSON.stringify(next));
      return next;
    });

    if (cloudSyncEnabled) {
      try {
        await tasksService.delete(id);
      } catch {
        toast.error("Failed to delete task.");
        setTasks(prev => [taskToDelete, ...prev]);
      }
    }
  }, [tasks, cloudSyncEnabled]);

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.filter(t => !t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return { tasks, loading, fetchTasks, addTask, toggleTask, deleteTask, completedCount, pendingCount, progress };
}
