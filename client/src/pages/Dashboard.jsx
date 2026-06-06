import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Plus, CheckCircle2, Circle, Trash2,
  Sparkles, ArrowRight, Layout, Flame, Layers,
  FileText, Clock, TrendingUp, TrendingDown, BarChart2, Brain,
  Upload, Zap, Target, BookOpen, Award, Calendar, Edit2,
  Trophy, Quote, List, AlignLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { settingsService } from "../services/index";
import { useTasks } from "../hooks/useTasks";
import { useNotes } from "../hooks/useNotes";
import { useFlashcards } from "../hooks/useFlashcards";
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { toast } from "sonner";
import PomodoroWidget from "../components/PomodoroWidget";
import HeatmapWidget from "../components/HeatmapWidget";
import "../styles/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const { firstName, user, socket } = useUser();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [chartTab, setChartTab] = useState("tasks");
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [timelineMode, setTimelineMode] = useState(false);

  const isCloudSyncEnabled = user?.settings?.cloudSync ?? true;

  // ── Custom hooks replace 120 lines of duplicated fetch/CRUD logic ─────────
  const {
    tasks, loading: tasksLoading,
    addTask: addTaskToList, toggleTask, deleteTask, pendingCount
  } = useTasks(isCloudSyncEnabled);

  const {
    notes: recentFiles, loading: notesLoading,
    refetch: refetchNotes
  } = useNotes({ page: 1, limit: 20, cloudSyncEnabled: isCloudSyncEnabled });

  const { dueCardsCount, refetch: refetchFlashcards } = useFlashcards();

  // Loading state = all data is ready
  useEffect(() => {
    if (!tasksLoading && !notesLoading) setIsLoading(false);
  }, [tasksLoading, notesLoading]);

  // Real-time synchronization via socket
  useEffect(() => {
    if (!socket) return;
    socket.on("sync_tasks", () => {});
    socket.on("sync_notes", refetchNotes);
    socket.on("sync_flashcards", refetchFlashcards);
    return () => {
      socket.off("sync_tasks");
      socket.off("sync_notes", refetchNotes);
      socket.off("sync_flashcards", refetchFlashcards);
    };
  }, [socket, refetchNotes, refetchFlashcards]);

  // ── Exam countdown — synced to DB (persists across devices) ──────────────
  const [examDateStr, setExamDateStr] = useState(() => {
    // Prefer DB value (from user.studyStats.examDate), fall back to localStorage
    if (user?.studyStats?.examDate) return user.studyStats.examDate;
    const saved = localStorage.getItem("starNote_examDate");
    if (saved) return saved;
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [isEditingExam, setIsEditingExam] = useState(false);

  const saveExamDate = useCallback(async (dateStr) => {
    // Always save to localStorage as immediate fallback
    localStorage.setItem("starNote_examDate", dateStr);
    // Sync to DB so it persists on all devices
    try {
      await settingsService.updateStats({ examDate: dateStr });
    } catch (err) {
      console.warn("Could not sync exam date to server:", err.message);
    }
  }, []);

  // ── Gamification XP Calculation ───────────────────────────────────────────
  const completedTaskCount = tasks.filter(t => t.completed).length;
  const userXP = (user?.studyStats?.cardsMastered || 0) * 10
    + Math.round((user?.studyStats?.focusTime || 0) / 60 * 5)
    + (completedTaskCount * 15);
  const currentLevel = Math.floor(userXP / 100) + 1;
  const currentLevelXP = userXP % 100;
  const xpProgress = (currentLevelXP / 100) * 100;

  // ── Dynamic AI Daily Brief ────────────────────────────────────────────────
  const dailyBrief = useMemo(() => {
    const streak = user?.studyStats?.streak || 0;
    const pending = tasks.filter(t => !t.completed).length;
    const mastered = user?.studyStats?.cardsMastered || 0;
    
    if (streak >= 7) return `🔥 ${streak}-day streak! You're on fire. Don't break the chain — knock out ${pending > 0 ? `your ${pending} remaining task${pending > 1 ? 's' : ''}` : 'a flashcard session'} today.`;
    if (dueCardsCount > 5) return `🧠 You have ${dueCardsCount} flashcards due. Your retention will drop significantly if you skip today's review. 15 minutes is all it takes.`;
    if (pending === 0 && mastered > 0) return `✅ All tasks done! You've mastered ${mastered} cards so far. Try generating a new flashcard deck or a mock exam to push further.`;
    if (pending > 5) return `📋 ${pending} tasks queued. Focus on the 2–3 most important ones first — don't let the list overwhelm you.`;
    if (streak === 0) return `👋 Welcome back! Start fresh today. Even 20 minutes of focused study compounds over time. What's the first task?`;
    return `🎯 ${pending > 0 ? `${pending} task${pending > 1 ? 's' : ''} left today.` : "All caught up!"} Streak: ${streak} day${streak !== 1 ? 's' : ''}. Keep building momentum!`;
  }, [tasks, user, dueCardsCount]);

  // ── Brain Facts — rotate randomly per session ─────────────────────────────
  const [dailyFact] = useState(() => {
    const facts = [
      "Spaced repetition can improve long-term retention by up to 200%.",
      "Taking a 5-minute break every 25 minutes (Pomodoro) maximizes focus.",
      "Your brain processes visual information 60,000× faster than text.",
      "Sleep consolidates memory — studying before bed boosts retention.",
      "Teaching a concept to someone else is the best way to master it (Feynman Technique).",
      "Interleaving different subjects in one study session improves long-term recall.",
      "Drinking 500ml of water before study can boost cognitive performance by ~14%.",
      "Active recall (testing yourself) is 3× more effective than re-reading notes.",
      "Handwriting notes encodes information deeper than typing them.",
      "The spacing effect: reviewing material at increasing intervals beats cramming.",
    ];
    return facts[Math.floor(Math.random() * facts.length)];
  });

  const [dailyQuote] = useState(() => {
    const quotes = [
      "Discipline equals freedom. Let's study.",
      "The expert in anything was once a beginner.",
      "Don't stop when you're tired. Stop when you're done.",
      "Focus on being productive instead of busy.",
      "Success is the sum of small efforts, repeated day in and day out.",
      "It always seems impossible until it is done."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  });


  // Build last-7-days data from real tasks & notes
  const { weeklyData, weekChange } = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const data = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dayStr = d.toDateString();
      const tasksDone = tasks.filter(t => {
        if (!t.updatedAt && !t.createdAt) return false;
        return t.completed && new Date(t.updatedAt || t.createdAt).toDateString() === dayStr;
      }).length;
      const notesCount = recentFiles.filter(f => {
        if (!f.updatedAt && !f.createdAt) return false;
        return new Date(f.updatedAt || f.createdAt).toDateString() === dayStr;
      }).length;
      // Focus = strict weighted estimate based on real activity (25 min/task + 15 min/note)
      return {
        day: days[d.getDay()],
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        tasks: tasksDone,
        notes: notesCount,
        focus: Math.round(tasksDone * 25 + notesCount * 15),
        isToday: d.toDateString() === today.toDateString(),
      };
    });
    // Stable week change using first 3 days vs last 4 days
    const firstHalf = data.slice(0, 3).reduce((s, d) => s + d.tasks + d.notes, 0);
    const lastHalf  = data.slice(3).reduce((s, d) => s + d.tasks + d.notes, 0);
    const change = firstHalf === 0 ? 0 : Math.round(((lastHalf - firstHalf) / Math.max(firstHalf, 1)) * 100);
    return { weeklyData: data, weekChange: change };
  }, [tasks, recentFiles]);

  const thisWeekTotal = weeklyData.reduce((s, d) => s + (d[chartTab] || 0), 0);

  const CHART_COLOR = { tasks: "#8b5cf6", notes: "#f59e0b", focus: "#10b981" };
  const CHART_LABEL = { tasks: "Tasks Done", notes: "Notes Created", focus: "Focus Mins" };



  const [newTask, setNewTask] = useState("");

  const filteredFiles = recentFiles.filter(f => 
    f.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 4);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const text = newTask;
    setNewTask("");
    await addTaskToList(text);
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;


  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="dashboard-minimal">
      <header className="dash-header">
        <div className="dash-greeting">
          <h1>Welcome back, {firstName}! 👋</h1>
          <p>{tasks.filter(t => !t.completed).length} tasks left today.</p>
        </div>
        <div className="dash-header-actions">
          <div className="dash-search">
            <input 
              type="text" 
              placeholder="Search materials..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn-resume" aria-label="Ask AI Tutor" onClick={() => navigate("/ai")}>
            <Sparkles size={16} />
            <span>Ask AI Tutor</span>
          </button>
        </div>
      </header>

      {/* MOTIVATIONAL BANNER */}
      <motion.div 
        className="motivational-banner"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
          color: "white",
          borderRadius: "16px",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
          boxShadow: "0 4px 12px rgba(var(--primary-rgb), 0.2)"
        }}
      >
        <Quote size={24} style={{ opacity: 0.8 }} />
        <p style={{ margin: 0, fontSize: "15px", fontWeight: 500, letterSpacing: "0.2px" }}>
          {dailyQuote}
        </p>
      </motion.div>

      {/* QUICK START ACTION HUB */}
      <motion.section 
        className="quick-start-hub"
        variants={containerVars}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVars} className="quick-action-card" onClick={() => navigate("/notes")}>
          <div className="qa-icon" style={{ background: "rgba(99, 102, 241, 0.1)", color: "#6366f1" }}>
            <Upload size={24} />
          </div>
          <div className="qa-text">
            <h3>Upload PDF</h3>
            <p>Read & annotate</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVars} className="quick-action-card" onClick={() => navigate("/flashcards")}>
          <div className="qa-icon" style={{ background: "rgba(236, 72, 153, 0.1)", color: "#ec4899" }}>
            <Zap size={24} />
          </div>
          <div className="qa-text">
            <h3>AI Flashcards</h3>
            <p>Generate from notes</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVars} className="quick-action-card" onClick={() => navigate("/ai")}>
          <div className="qa-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
            <Target size={24} />
          </div>
          <div className="qa-text">
            <h3>Mock Exam</h3>
            <p>Test your knowledge</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVars} className="quick-action-card" onClick={() => navigate("/notes")}>
          <div className="qa-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
            <BookOpen size={24} />
          </div>
          <div className="qa-text">
            <h3>Blank Note</h3>
            <p>Start writing</p>
          </div>
        </motion.div>
      </motion.section>

      {/* STUDY INSIGHTS */}
      <motion.section 
        className="study-insights"
        variants={containerVars}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVars} className="insight-card streak-card">
          <div className="insight-icon streak"><Flame size={20} /></div>
          <div className="insight-info">
            <span className="insight-value">{user?.studyStats?.streak ?? 0}</span>
            <span className="insight-label">Day Streak</span>
          </div>
        </motion.div>
        <motion.div variants={itemVars} className="insight-card cards-card">
          <div className="insight-icon cards"><Layers size={20} /></div>
          <div className="insight-info">
            <span className="insight-value">{user?.studyStats?.cardsMastered ?? 0}</span>
            <span className="insight-label">Cards Mastered</span>
          </div>
        </motion.div>
        <motion.div variants={itemVars} className="insight-card notes-card">
          <div className="insight-icon notes"><FileText size={20} /></div>
          <div className="insight-info">
            <span className="insight-value">{recentFiles.length}</span>
            <span className="insight-label">Total Notes</span>
          </div>
        </motion.div>
        <motion.div variants={itemVars} className="insight-card time-card">
          <div className="insight-icon time"><Clock size={20} /></div>
          <div className="insight-info">
            <span className="insight-value">{user?.studyStats?.focusTime ? Math.round(user.studyStats.focusTime / 60 * 10) / 10 : 0}h</span>
            <span className="insight-label">Focus Time</span>
          </div>
        </motion.div>
      </motion.section>

      <motion.div 
        className="dash-content"
        variants={containerVars}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVars} className="dash-main">

          {/* AI DAILY STUDY BRIEF & FACT */}
          <div className="daily-insights-widget">
            <div className="di-header">
              <Sparkles size={18} className="di-icon" />
              <h3>AI Daily Brief</h3>
            </div>
            <div className="di-content">
              <p className="di-brief">{dailyBrief}</p>
              <div className="di-fact">
                <div className="di-fact-label">💡 Study Science Fact</div>
                <div className="di-fact-text">{dailyFact}</div>
              </div>
            </div>
          </div>

          {/* ACTIVE RECALL DUE TODAY ALERT */}
          {dueCardsCount > 0 && (
            <motion.div 
              className="insight-card due-flashcards-widget"
              whileHover={{ y: -4 }}
              onClick={() => navigate("/flashcards")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                background: "linear-gradient(135deg, rgba(var(--primary-rgb), 0.08), rgba(var(--primary-rgb), 0.02))",
                border: "1px dashed var(--primary)",
                borderRadius: "24px",
                cursor: "pointer",
                marginBottom: "24px",
                gap: "16px",
                width: "100%"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "16px",
                  background: "rgba(var(--primary-rgb), 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary)"
                }}>
                  <Brain size={24} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: 0 }}>Active Recall Study Session</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0" }}>
                    You have <strong>{dueCardsCount} flashcard{dueCardsCount === 1 ? "" : "s"}</strong> due for review today! Retain your knowledge with spaced repetition.
                  </p>
                </div>
              </div>
              <button 
                className="btn-resume" 
                style={{
                  padding: "10px 20px",
                  borderRadius: "14px",
                  fontSize: "13px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <span>Study Now</span>
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

          {/* FOCUS CARD & POMODORO */}
          <section className="dash-section dash-widgets-grid">
            <PomodoroWidget />
            <HeatmapWidget />
          </section>

          {/* WEEKLY ANALYTICS — INTERACTIVE */}
          <section className="dash-section" style={{ marginTop: '32px' }}>
            <div className="section-header">
              <h2>Weekly Activity</h2>
              <div className="chart-tab-group">
                {["tasks","notes","focus"].map(tab => (
                  <button
                    key={tab}
                    className={`chart-tab-btn ${chartTab === tab ? "active" : ""}`}
                    style={chartTab === tab ? { "--tab-color": CHART_COLOR[tab] } : {}}
                    onClick={() => setChartTab(tab)}
                  >
                    {tab === "tasks" ? "Tasks" : tab === "notes" ? "Notes" : "Focus"}
                  </button>
                ))}
              </div>
            </div>

            <div className="analytics-card-modern">
              {/* Stat row */}
              <div className="chart-stat-row">
                <div className="chart-stat-main">
                  <span className="chart-stat-value">{thisWeekTotal}</span>
                  <span className="chart-stat-label">{CHART_LABEL[chartTab]} this week</span>
                </div>
                <div className={`chart-trend ${weekChange >= 0 ? "up" : "down"}`}>
                  {weekChange >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                  <span>{Math.abs(weekChange)}% vs last week</span>
                </div>
              </div>

              {/* Recharts AreaChart */}
              <div className="recharts-wrapper">
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                    onMouseMove={(e) => {
                      if (e && e.activeTooltipIndex !== undefined) {
                        setHoveredIndex(e.activeTooltipIndex);
                      }
                    }}
                    onMouseLeave={() => setHoveredIndex(null)}>
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={CHART_COLOR[chartTab]} stopOpacity={0.25}/>
                        <stop offset="95%" stopColor={CHART_COLOR[chartTab]} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} strokeOpacity={0.4} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 600, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                    <Tooltip
                      cursor={{ stroke: CHART_COLOR[chartTab], strokeWidth: 1, strokeDasharray: "3 3", opacity: 0.5 }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload;
                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className="chart-tooltip-glass"
                          >
                            <div className="chart-tooltip-date">{d?.date}{d?.isToday ? " · Today" : ""}</div>
                            <div className="chart-tooltip-val" style={{ color: CHART_COLOR[chartTab] }}>
                              {payload[0]?.value} <span>{CHART_LABEL[chartTab]}</span>
                            </div>
                          </motion.div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={chartTab}
                      stroke={CHART_COLOR[chartTab]}
                      strokeWidth={3}
                      fill="url(#chartGrad)"
                      animationDuration={1500}
                      animationEasing="ease-in-out"
                      dot={(props) => {
                        const { cx, cy, payload, index } = props;
                        const isActive = hoveredIndex === index;
                        if (!payload.isToday && !isActive) return <circle key={`dot-${cx}`} cx={cx} cy={cy} r={0} fill="none"/>;
                        return (
                          <circle 
                            key={`dot-${cx}`} 
                            cx={cx} cy={cy} 
                            r={isActive ? 6 : 5} 
                            fill={CHART_COLOR[chartTab]} 
                            stroke="var(--bg)" 
                            strokeWidth={2}
                            style={{ transition: 'all 0.3s ease' }}
                          />
                        );
                      }}
                      activeDot={{ r: 7, strokeWidth: 2, stroke: "var(--bg)", fill: CHART_COLOR[chartTab] }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Day mini-pills */}
              <div className="chart-day-pills">
                {weeklyData.map((d, i) => {
                  const isHovered = hoveredIndex === i;
                  const isToday = d.isToday;
                  const activeStyle = (isHovered || isToday) ? { 
                    borderColor: CHART_COLOR[chartTab], 
                    color: CHART_COLOR[chartTab],
                    background: isHovered ? `rgba(${chartTab === 'tasks' ? '139, 92, 246' : chartTab === 'notes' ? '245, 158, 11' : '16, 185, 129'}, 0.1)` : 'transparent',
                    transform: isHovered ? 'translateY(-2px)' : 'none'
                  } : {};
                  
                  return (
                    <div 
                      key={i} 
                      className={`chart-day-pill ${isToday ? "today" : ""} ${isHovered ? "hovered" : ""}`}
                      style={{ ...activeStyle, transition: 'all 0.2s ease', cursor: 'default' }}
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <span className="cdp-day">{d.day}</span>
                      <span className="cdp-val">{d[chartTab]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* RECENT DOCUMENTS */}
          <section className="dash-section">
            <div className="section-header">
              <h2>Recent Materials</h2>
              <button className="btn-text-link" onClick={() => navigate("/notes")}>
                View all <ArrowRight size={14} />
              </button>
            </div>
            <div className="doc-grid">
              {isLoading ? (
                [1, 2, 3, 4].map((i) => (
                  <div key={`skel-${i}`} className="doc-card-mini skeleton">
                    <div className="skeleton-icon" style={{ width: 32, height: 32, marginBottom: 0, marginRight: 12 }}></div>
                    <div className="doc-details" style={{ width: '100%' }}>
                      <div className="skeleton-text short" style={{ height: 10, marginBottom: 6 }}></div>
                      <div className="skeleton-text long" style={{ height: 8 }}></div>
                    </div>
                  </div>
                ))
              ) : filteredFiles.length > 0 ? (
                filteredFiles.map((file) => (
                  <div key={file._id || file.id || file.originalIndex} className="doc-card-mini" onClick={() => navigate(`/reader/${file._id || file.id || file.originalIndex}`)}>
                    <div className="doc-icon-small">{file.icon || "📄"}</div>
                    <div className="doc-details">
                      <span className="doc-name">{file.name}</span>
                      <span className="doc-time">{file.date || "Just now"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-premium" onClick={() => navigate("/notes")}>
                  <div className="empty-state-visual">
                    <div className="blob bg-purple"></div>
                    <Layout size={40} className="icon-main" />
                  </div>
                  <h3>No materials yet</h3>
                  <p>{searchQuery ? "No matching materials found." : "Start your journey by creating or uploading your first study note."}</p>
                  <button className="btn-primary-small">Create Note</button>
                </div>
              )}
            </div>
          </section>
        </motion.div>

        {/* TASK SIDEBAR */}
        <motion.div variants={itemVars} className="dash-sidebar">
          
          {/* GAMIFICATION WIDGET */}
          <section className="dash-section gamification-widget">
            <div className="gamification-header">
              <div className="gamification-title">
                <Award size={18} className="icon-award" />
                <h2>Level {currentLevel} Scholar</h2>
              </div>
              <span className="gamification-xp">{currentLevelXP} / 100 XP</span>
            </div>
            <div className="xp-progress-bar">
              <motion.div 
                className="xp-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, type: "spring" }}
              />
            </div>
            <p className="gamification-hint">Earn XP by finishing tasks and reviewing cards!</p>
          </section>

          {/* EXAM COUNTDOWN WIDGET */}
          <section className="dash-section exam-countdown-widget">
            <div className="section-header" style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={16} color="var(--primary)" />
                <h2>Next Big Goal</h2>
              </div>
              <button className="btn-icon-small" aria-label="Edit Exam Date" onClick={() => setIsEditingExam(!isEditingExam)}>
                <Edit2 size={14} />
              </button>
            </div>
            
            {isEditingExam ? (
              <div className="exam-edit-mode">
                <input 
                  type="date" 
                  value={examDateStr}
                  onChange={(e) => {
                    setExamDateStr(e.target.value);
                    saveExamDate(e.target.value);
                  }}
                  className="exam-date-input"
                />
                <button className="btn-primary-small" onClick={() => setIsEditingExam(false)}>Save</button>
              </div>
            ) : (
              <div className="exam-display-mode">
                {(() => {
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const target = new Date(examDateStr);
                  const diffTime = target - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  if (diffDays < 0) return <div className="exam-days">Goal Passed! 🎉</div>;
                  if (diffDays === 0) return <div className="exam-days">It's Today! 🚀</div>;
                  
                  return (
                    <>
                      <div className="exam-days-count">
                        <span className="exam-number">{diffDays}</span>
                        <span className="exam-label">Days Left</span>
                      </div>
                      <div className="exam-target-date">
                        Target: {target.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </section>

          {/* FRIENDS LEADERBOARD WIDGET */}
          <section className="dash-section leaderboard-widget">
            <div className="section-header" style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Trophy size={16} color="#f59e0b" />
                <h2>Weekly Leaderboard</h2>
              </div>
            </div>
            <div className="leaderboard-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { rank: 1, name: "Alex Chen", hours: 14.5, color: "#f59e0b", you: false },
                { rank: 2, name: `${firstName} (You)`, hours: Math.round((user?.studyStats?.focusTime || 0) / 60 * 10) / 10 || 12.2, color: "var(--primary)", you: true },
                { rank: 3, name: "Sarah M.", hours: 8.4, color: "var(--text-muted)", you: false }
              ].sort((a,b) => b.hours - a.hours).map((userCard, i) => (
                <div key={i} style={{ 
                  display: "flex", alignItems: "center", justifyContent: "space-between", 
                  padding: "10px 12px", background: userCard.you ? "rgba(var(--primary-rgb), 0.1)" : "var(--bg-secondary)", 
                  borderRadius: "10px", border: userCard.you ? "1px solid var(--primary-weak)" : "1px solid transparent"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: userCard.color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>
                      {i + 1}
                    </div>
                    <span style={{ fontWeight: userCard.you ? 600 : 500, color: "var(--text)", fontSize: "14px" }}>{userCard.name}</span>
                  </div>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>{userCard.hours}h</span>
                </div>
              ))}
            </div>
          </section>

          {/* TASKS LIST */}
          <section className="dash-section">
            <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2>Tasks</h2>
              <div style={{ display: "flex", background: "var(--bg-secondary)", borderRadius: "8px", padding: "2px" }}>
                <button 
                  onClick={() => setTimelineMode(false)}
                  style={{ background: !timelineMode ? "var(--bg)" : "transparent", border: "none", padding: "4px 8px", borderRadius: "6px", cursor: "pointer", color: !timelineMode ? "var(--text)" : "var(--text-muted)" }}
                >
                  <List size={14} />
                </button>
                <button 
                  onClick={() => setTimelineMode(true)}
                  style={{ background: timelineMode ? "var(--bg)" : "transparent", border: "none", padding: "4px 8px", borderRadius: "6px", cursor: "pointer", color: timelineMode ? "var(--text)" : "var(--text-muted)" }}
                >
                  <AlignLeft size={14} />
                </button>
              </div>
            </div>
            
            <form className="quick-add-task" onSubmit={addTask}>
              <Plus size={16} className="icon-plus" />
              <input 
                placeholder="Quick add task..." 
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
              />
            </form>

            <div className={`dashboard-task-list ${timelineMode ? 'timeline-mode' : ''}`}>
              {tasksLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="dash-task-item skeleton" style={{ height: '48px', marginBottom: '8px', border: 'none' }}></div>
                ))
              ) : tasks.length === 0 ? (
                <div className="empty-state-premium small">
                  <div className="empty-state-visual small">
                    <div className="blob bg-green"></div>
                    <CheckCircle2 size={32} className="icon-main" />
                  </div>
                  <h3>All caught up!</h3>
                  <p>You have no pending tasks today.</p>
                </div>
              ) : timelineMode ? (
                <div style={{ position: "relative", paddingLeft: "16px", marginTop: "16px" }}>
                  <div style={{ position: "absolute", left: "0", top: "0", bottom: "0", width: "2px", background: "var(--border)", borderRadius: "2px" }}></div>
                  {tasks.map((task, idx) => {
                    const taskId = task._id || task.id;
                    const dateObj = new Date(task.createdAt || Date.now());
                    const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <div key={taskId} style={{ position: "relative", marginBottom: "20px", display: "flex", gap: "12px", opacity: task.completed ? 0.6 : 1 }}>
                        <div style={{ position: "absolute", left: "-21px", top: "4px", width: "12px", height: "12px", borderRadius: "50%", background: task.completed ? "var(--primary)" : "var(--bg)", border: `2px solid ${task.completed ? "var(--primary)" : "var(--border)"}`, zIndex: 1 }}></div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", width: "50px", paddingTop: "2px" }}>{timeString}</div>
                        <div style={{ flex: 1, background: "var(--bg-secondary)", padding: "10px 14px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                           <span style={{ fontSize: "14px", color: "var(--text)", textDecoration: task.completed ? "line-through" : "none" }}>{task.text}</span>
                           <button className="btn-check" aria-label="Toggle Task" onClick={() => toggleTask(taskId)} style={{ background: "transparent", border: "none", cursor: "pointer", color: task.completed ? "var(--primary)" : "var(--text-muted)" }}>
                             {task.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                           </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                tasks.map(task => {
                  const taskId = task._id || task.id;
                  return (
                    <div key={taskId} className={`dash-task-item ${task.completed ? 'is-done' : ''}`}>
                      <button className="btn-check" aria-label="Toggle Task" onClick={() => toggleTask(taskId)}>
                        {task.completed ? <CheckCircle2 size={18} className="icon-done" /> : <Circle size={18} />}
                      </button>
                      <span className="task-text">{task.text}</span>
                      <button className="btn-del-task" aria-label="Delete Task" onClick={() => deleteTask(taskId)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Dashboard;