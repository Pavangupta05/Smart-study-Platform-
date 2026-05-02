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
