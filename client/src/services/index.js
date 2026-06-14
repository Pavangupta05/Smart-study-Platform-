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
  getAll: (params = {}) => api.get("/notes", { params }), // supports ?page=1&limit=20
  getById: (id) => api.get(`/notes/${id}`),
  getTrash: () => api.get("/notes/trash"),
  create: (data) => api.post("/notes", data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  trash: (id) => api.delete(`/notes/${id}`),
  restore: (id) => api.post(`/notes/${id}/restore`),
  deletePermanent: (id) => api.delete(`/notes/${id}/permanent`),
  toggleShare: (id, isPublic) => api.patch(`/notes/${id}/share`, { isPublic }),
  getShared: (shareId) => api.get(`/notes/shared/${shareId}`),
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
  getDue: () => api.get("/flashcards/due"),
  create: (data) => api.post("/flashcards", data),
  bulkCreate: (cards, deck) => api.post("/flashcards/bulk", { cards, deck }),
  update: (id, data) => api.put(`/flashcards/${id}`, data),
  delete: (id) => api.delete(`/flashcards/${id}`),
  markMastered: (id) => api.put(`/flashcards/${id}`, { mastered: true }),
  review: (id, grade) => api.post(`/flashcards/${id}/review`, { grade }),
};

// CHATS
export const chatService = {
  getAll: () => api.get("/chats"),
  getById: (id) => api.get(`/chats/${id}`),
  create: (title, messages) => api.post("/chats", { title, messages }),
  sendMessage: (id, role, text) => api.post(`/chats/${id}/message`, { role, text }),
  update: (id, title) => api.put(`/chats/${id}`, { title }),
  delete: (id) => api.delete(`/chats/${id}`),
};

// AI SERVICE — all AI calls go through the backend (API key is secure)
export const aiService = {
  /**
   * Standard chat — returns full response at once
   * @param {Array} messages - [{role, text}]
   * @param {Object} context - {currentPage, currentNote, selection, document}
   * @param {Array} contextNoteIds - optional array of note IDs for multi-doc context
   */
  chat: (messages, context = {}, provider = null, options = {}, contextNoteIds = []) =>
    api.post("/ai/chat", { messages, context, provider, contextNoteIds }, options),

  /**
   * Generate flashcards for a topic
   * @param {string} topic
   * @param {number} count
   */
  generateFlashcards: (topic, count = 10, provider = null) =>
    api.post("/ai/flashcards", { topic, count, provider }),

  /**
   * Optimize a study schedule
   * @param {Array} tasks
   */
  optimizeSchedule: (tasks, provider = null) =>
    api.post("/ai/optimize-schedule", { tasks, provider }),

  /**
   * Streaming chat — returns a fetch ReadableStream for SSE
   * Use this for the typewriter effect in the AI chat page.
   * @param {Array} messages
   * @param {Object} context
   */
  streamChat: async (messages, context = {}, provider = null, file = null, options = {}) => {
    const token = localStorage.getItem("starNote_token");
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const BASE_URL = import.meta.env.VITE_API_URL || (isLocalhost ? `http://${window.location.hostname}:5000/api` : "https://starnote-backend.onrender.com/api");
    const response = await fetch(`${BASE_URL}/ai/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messages, context, provider, file }),
      signal: options.signal
    });
    return response;
  },

  /** One-shot completion with custom system prompt (summarize, etc.) */
  completeWithPrompt: (messages, systemPrompt, context = {}, provider = null) =>
    api.post("/ai/chat", {
      messages,
      context: { ...context, systemPrompt },
      provider,
    }),

  /** Generate an AI mind map from note content */
  generateMindMap: (noteContent, provider = null) =>
    api.post("/ai/mindmap", { noteContent, provider }),

  /** Generate a podcast dialogue script for a topic */
  generatePodcast: (topic, length = "short", provider = null) =>
    api.post("/ai/podcast", { topic, length, provider }),

  /** Generate a mock exam from note content */
  generateExam: (noteContent, numQuestions = 5, examType = "mixed", provider = null) =>
    api.post("/ai/exam/generate", { noteContent, numQuestions, examType, provider }),

  /** AI-grade a completed exam */
  gradeExam: (questions, answers, noteContent = "", provider = null) =>
    api.post("/ai/exam/grade", { questions, answers, noteContent, provider }),
};

// EXAM SERVICE
export const examService = {
  getAll: () => api.get("/exams"),
  getById: (id) => api.get(`/exams/${id}`),
  create: (data) => api.post("/exams", data),
  delete: (id) => api.delete(`/exams/${id}`),
  getStats: () => api.get("/exams/stats"),
  getHistory: () => api.get("/exams/history"),
  generate: (data) => api.post("/exams/generate", data),
  submit: (id, answers) => api.post(`/exams/${id}/submit`, { answers }),
  getDetails: (id) => api.get(`/exams/${id}`),
};

// NOTIFICATIONS
export const notificationsService = {
  getAll: () => api.get("/notifications"),
  markAllRead: () => api.patch("/notifications/read-all"),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  clearAll: () => api.delete("/notifications/clear"),
  clear: (id) => api.delete(`/notifications/${id}`),
};

// BILLING & PLAN
export const billingService = {
  getUsage: () => api.get("/billing/usage"),
  upgrade: (plan) => api.post("/billing/upgrade", { plan }),
  trackAiQuery: () => api.post("/billing/track-ai-query"),
};

