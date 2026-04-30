/**
 * In-memory mock store — used when MongoDB is not connected.
 * Data is NOT persisted across server restarts (by design for mock mode).
 */
const bcrypt = require("bcryptjs");

const store = {
  users: [],
  notes: [],
  tasks: [],
  flashcards: [],
};

// ── Helper ──────────────────────────────────────────────────────────────────
const nextId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// ── Users ───────────────────────────────────────────────────────────────────
const mockUsers = {
  async findOne({ email }) {
    return store.users.find((u) => u.email === email) || null;
  },
  async findById(id) {
    return store.users.find((u) => u._id === id) || null;
  },
  async create({ name, email, password }) {
    const hashed = await bcrypt.hash(password, 12);
    const user = {
      _id: nextId(),
      name,
      email,
      password: hashed,
      plan: "free",
      avatar: "",
      bio: "",
      settings: {
        theme: "light",
        language: "English (US)",
        emailReports: true,
        studyReminders: true,
        hapticsEnabled: true,
        autoSave: true,
        aiDataUsage: true,
      },
      studyStats: { streak: 0, cardsMastered: 0, focusTime: 0, lastStudied: null },
      createdAt: new Date(),
    };
    store.users.push(user);
    return user;
  },
  async findByIdAndUpdate(id, update) {
    const idx = store.users.findIndex((u) => u._id === id);
    if (idx === -1) return null;
    store.users[idx] = { ...store.users[idx], ...update };
    return store.users[idx];
  },
  comparePassword(user, candidate) {
    return bcrypt.compare(candidate, user.password);
  },
};

// ── Notes ────────────────────────────────────────────────────────────────────
const mockNotes = {
  async find({ user, isTrashed = false }) {
    return store.notes
      .filter((n) => n.user === user && n.isTrashed === isTrashed)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },
  async findOne({ _id, user }) {
    return store.notes.find((n) => n._id === _id && n.user === user) || null;
  },
  async create(data) {
    const note = { _id: nextId(), ...data, isTrashed: false, trashedAt: null, createdAt: new Date(), updatedAt: new Date() };
    store.notes.push(note);
    return note;
  },
  async findOneAndUpdate({ _id, user }, update) {
    const idx = store.notes.findIndex((n) => n._id === _id && n.user === user);
    if (idx === -1) return null;
    store.notes[idx] = { ...store.notes[idx], ...update, updatedAt: new Date() };
    return store.notes[idx];
  },
  async findOneAndDelete({ _id, user }) {
    const idx = store.notes.findIndex((n) => n._id === _id && n.user === user);
    if (idx !== -1) store.notes.splice(idx, 1);
  },
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
const mockTasks = {
  async find({ user }) {
    return store.tasks.filter((t) => t.user === user).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async create(data) {
    const task = { _id: nextId(), ...data, completed: false, completedAt: null, createdAt: new Date() };
    store.tasks.push(task);
    return task;
  },
  async findOneAndUpdate({ _id, user }, update) {
    const idx = store.tasks.findIndex((t) => t._id === _id && t.user === user);
    if (idx === -1) return null;
    store.tasks[idx] = { ...store.tasks[idx], ...update };
    return store.tasks[idx];
  },
  async findOneAndDelete({ _id, user }) {
    const idx = store.tasks.findIndex((t) => t._id === _id && t.user === user);
    if (idx !== -1) store.tasks.splice(idx, 1);
  },
};

// ── Flashcards ────────────────────────────────────────────────────────────────
const mockFlashcards = {
  async find({ user }) {
    return store.flashcards.filter((f) => f.user === user).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async create(data) {
    const card = { _id: nextId(), ...data, mastered: false, lastReviewed: null, createdAt: new Date() };
    store.flashcards.push(card);
    return card;
  },
  async insertMany(cards) {
    const created = cards.map((c) => ({ _id: nextId(), ...c, mastered: false, lastReviewed: null, createdAt: new Date() }));
    store.flashcards.push(...created);
    return created;
  },
  async findOneAndUpdate({ _id, user }, update) {
    const idx = store.flashcards.findIndex((f) => f._id === _id && f.user === user);
    if (idx === -1) return null;
    store.flashcards[idx] = { ...store.flashcards[idx], ...update, lastReviewed: new Date() };
    return store.flashcards[idx];
  },
  async findOneAndDelete({ _id, user }) {
    const idx = store.flashcards.findIndex((f) => f._id === _id && f.user === user);
    if (idx !== -1) store.flashcards.splice(idx, 1);
  },
};

module.exports = { mockUsers, mockNotes, mockTasks, mockFlashcards };
