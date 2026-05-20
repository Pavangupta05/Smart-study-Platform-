const STREAK_KEY = "starNote_dailyStreak";
const XP_KEY = "starNote_xp";
const TTS_KEY = "starNote_ttsCount";
const ACTIVITY_KEY = "starNote_chatActivity";
const VOICE_GURU_THRESHOLD = 5;

export function getStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw ? JSON.parse(raw) : { count: 0, lastDate: null };
  } catch {
    return { count: 0, lastDate: null };
  }
}

export function recordAIStudySession() {
  const today = new Date().toISOString().slice(0, 10);
  const streak = getStreak();
  if (streak.lastDate === today) return streak;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  const next = {
    count: streak.lastDate === yStr ? streak.count + 1 : 1,
    lastDate: today,
  };
  localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  addXP(10);
  return next;
}

export function getXP() {
  return parseInt(localStorage.getItem(XP_KEY) || "0", 10);
}

export function addXP(amount) {
  const next = getXP() + amount;
  localStorage.setItem(XP_KEY, String(next));
  return next;
}

export function getTTSCount() {
  return parseInt(localStorage.getItem(TTS_KEY) || "0", 10);
}

export function recordTTSListen() {
  const next = getTTSCount() + 1;
  localStorage.setItem(TTS_KEY, String(next));
  return { count: next, voiceGuru: next >= VOICE_GURU_THRESHOLD };
}

export function hasVoiceGuruBadge() {
  return getTTSCount() >= VOICE_GURU_THRESHOLD;
}

export function recordChatQuestion() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[today] = (map[today] || 0) + 1;
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(map));
    return map;
  } catch {
    return {};
  }
}

export function getChatActivityMap() {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function buildHeatmapFromActivity(weeks = 12) {
  const map = getChatActivityMap();
  const data = [];
  const today = new Date();
  for (let w = weeks - 1; w >= 0; w--) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dayOffset = w * 7 + (6 - d);
      const dte = new Date(today);
      dte.setDate(dte.getDate() - dayOffset);
      const key = dte.toISOString().slice(0, 10);
      const count = map[key] || 0;
      week.push(Math.min(4, count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 10 ? 3 : 4));
    }
    data.push(week);
  }
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  return { data, total, map };
}
