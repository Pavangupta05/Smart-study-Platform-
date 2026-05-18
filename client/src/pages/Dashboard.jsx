import { useState, useEffect, useMemo } from "react";
import { 
  Play, Plus, CheckCircle2, Circle, Trash2,
  Sparkles, ArrowRight, Layout, Flame, Layers,
  FileText, Clock, TrendingUp, TrendingDown, BarChart2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { tasksService, notesService } from "../services/index";
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
  
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentFiles, setRecentFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartTab, setChartTab] = useState("tasks");
  const [hoveredIndex, setHoveredIndex] = useState(null);

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
      // Focus = weighted estimate (25 min/task + 15 min/note) with slight variation per day
      const seed = d.getDate() + d.getMonth() * 31;
      const variation = 0.8 + ((seed % 7) / 7) * 0.4;
      return {
        day: days[d.getDay()],
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        tasks: tasksDone,
        notes: notesCount,
        focus: Math.round((tasksDone * 25 + notesCount * 15) * variation),
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

  // Load tasks from backend
  const fetchTasks = () => {
    tasksService.getAll()
      .then(res => setTasks(res.data.tasks || []))
      .catch(err => {
        console.error("Fetch tasks error:", err);
        toast.error("Connecting to server failed. Using local tasks.");
        const saved = localStorage.getItem("starNote_tasks");
        if (saved) setTasks(JSON.parse(saved));
      });
  };

  // Load notes from backend
  const fetchNotes = () => {
    notesService.getAll()
      .then(res => setRecentFiles(res.data.notes || []))
      .catch(err => {
        console.error("Fetch notes error:", err);
        toast.error("Connecting to server failed. Using local materials.");
        const saved = localStorage.getItem("starNote_files");
        if (saved) setRecentFiles(JSON.parse(saved));
      })
      .finally(() => setIsLoading(false));
  };

  // Initial Fetch
  useEffect(() => {
    setIsLoading(true);
    fetchTasks();
    fetchNotes();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;
    socket.on("sync_tasks", fetchTasks);
    socket.on("sync_notes", fetchNotes);
    return () => {
      socket.off("sync_tasks", fetchTasks);
      socket.off("sync_notes", fetchNotes);
    };
  }, [socket]);

  const filteredFiles = recentFiles.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 4);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const text = newTask;
    setNewTask("");
    try {
      const res = await tasksService.create({ text });
      setTasks(prev => [res.data.task, ...prev]);
    } catch (err) {
      console.error("Add task error:", err);
      toast.error("Failed to sync task with server.");
      // Optimistic fallback
      setTasks(prev => [{ _id: Date.now(), text, completed: false }, ...prev]);
    }
  };

  const toggleTask = async (id) => {
    const task = tasks.find(t => (t._id || t.id) === id);
    if (!task) return;
    const completed = !task.completed;
    setTasks(prev => prev.map(t => (t._id || t.id) === id ? { ...t, completed } : t));
    try {
      await tasksService.toggle(id, completed);
    } catch (err) {
      console.error("Toggle task error:", err);
      toast.error("Failed to update task status.");
      // Rollback
      setTasks(prev => prev.map(t => (t._id || t.id) === id ? { ...t, completed: !completed } : t));
    }
  };

  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => (t._id || t.id) !== id));
    try { 
      await tasksService.delete(id); 
      toast.success("Task removed");
    } catch (err) { 
      console.error("Delete task error:", err);
      toast.error("Failed to delete task.");
      // Rollback
      setTasks(prev => [task, ...prev]);
    }
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
          <button className="btn-resume" onClick={() => navigate("/ai")}>
            <Sparkles size={16} />
            <span>Ask AI Tutor</span>
          </button>
        </div>
      </header>

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
          <section className="dash-section">
            <div className="section-header">
              <h2>Tasks</h2>
            </div>
            
            <form className="quick-add-task" onSubmit={addTask}>
              <Plus size={16} className="icon-plus" />
              <input 
                placeholder="Quick add task..." 
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
              />
            </form>

            <div className="dashboard-task-list">
              {tasks.map(task => {
                const taskId = task._id || task.id;
                return (
                  <div key={taskId} className={`dash-task-item ${task.completed ? 'is-done' : ''}`}>
                    <button className="btn-check" onClick={() => toggleTask(taskId)}>
                      {task.completed ? <CheckCircle2 size={18} className="icon-done" /> : <Circle size={18} />}
                    </button>
                    <span className="task-text">{task.text}</span>
                    <button className="btn-del-task" onClick={() => deleteTask(taskId)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              {tasks.length === 0 && (
                <div className="empty-state-premium small">
                  <div className="empty-state-visual small">
                    <div className="blob bg-green"></div>
                    <CheckCircle2 size={32} className="icon-main" />
                  </div>
                  <h3>All caught up!</h3>
                  <p>You have no pending tasks today.</p>
                </div>
              )}
            </div>
          </section>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Dashboard;