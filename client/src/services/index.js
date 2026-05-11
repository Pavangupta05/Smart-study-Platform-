import api from "./api";

// AUTH
export const authService = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  forgotPassword: (data) => api.post("/auth/forgotpassword", data),
  resetPassword: (token, data) => api.put(`/auth/resetpassword/${token}`, data),
};

// NOTES
export const notesService = {
  getAll: () => api.get("/notes"),
  getById: (id) => api.get(`/notes/${id}`),
  getTrash: () => api.get("/notes/trash"),
  create: (data) => api.post("/notes", data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  trash: (id) => api.delete(`/notes/${id}`),
  restore: (id) => api.post(`/notes/${id}/restore`),
  deletePermanent: (id) => api.delete(`/notes/${id}/permanent`),
};

// TASKS
export const tasksService = {
  getAll: () => api.get("/tasks"),
  create: (data) => api.post("/tasks", data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  toggle: (id, completed) => api.put(`/tasks/${id}`, { completed }),
};

// SETTINGS
export const settingsService = {
  get: () => api.get("/settings"),
  update: (data) => api.put("/settings", data),
  updateStats: (data) => api.put("/settings/stats", data),
};

export const flashcardsService = {
  getAll: () => api.get("/flashcards"),
  create: (data) => api.post("/flashcards", data),
  bulkCreate: (cards, deck) => api.post("/flashcards/bulk", { cards, deck }),
  update: (id, data) => api.put(`/flashcards/${id}`, data),
  delete: (id) => api.delete(`/flashcards/${id}`),
  markMastered: (id) => api.put(`/flashcards/${id}`, { mastered: true }),
};

// CHATS
export const chatService = {
  getLatest: () => api.get("/chats"),
  sendMessage: (role, text) => api.post("/chats/message", { role, text }),
  clear: () => api.delete("/chats"),
};

// AI SERVICE — all AI calls go through the backend (API key is secure)
export const aiService = {
  /**
   * Standard chat — returns full response at once
   * @param {Array} messages - [{role, text}]
   * @param {Object} context - {currentPage, currentNote, selection, document}
   */
  chat: (messages, context = {}) =>
    api.post("/ai/chat", { messages, context }),

  /**
   * Generate flashcards for a topic
   * @param {string} topic
   * @param {number} count
   */
  generateFlashcards: (topic, count = 10) =>
    api.post("/ai/flashcards", { topic, count }),

  /**
   * Optimize a study schedule
   * @param {Array} tasks
   */
  optimizeSchedule: (tasks) =>
    api.post("/ai/optimize-schedule", { tasks }),

  /**
   * Streaming chat — returns a fetch ReadableStream for SSE
   * Use this for the typewriter effect in the AI chat page.
   * @param {Array} messages
   * @param {Object} context
   */
  streamChat: async (messages, context = {}) => {
    const token = localStorage.getItem("starNote_token");
    const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const response = await fetch(`${BASE_URL}/ai/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messages, context }),
    });
    return response;
  },
};

