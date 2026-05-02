import { useState, useEffect } from "react";
import { 
  ChevronRight, 
  Play, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  BookOpen, 
  Sparkles,
  ArrowRight,
  Layout,
  Flame,
  Layers,
  FileText,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { tasksService, notesService } from "../services/index";
import "../styles/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const { firstName, user, socket } = useUser();
  
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentFiles, setRecentFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load tasks from backend
  const fetchTasks = () => {
    tasksService.getAll()
      .then(res => setTasks(res.data.tasks || []))
      .catch(() => {
        const saved = localStorage.getItem("starNote_tasks");
        if (saved) setTasks(JSON.parse(saved));
      });
  };

  // Load notes from backend
  const fetchNotes = () => {
    notesService.getAll()
      .then(res => setRecentFiles(res.data.notes || []))
      .catch(() => {
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
    } catch {
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
    } catch { /* optimistic UI already updated */ }
  };

  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => (t._id || t.id) !== id));
    try { await tasksService.delete(id); } catch { /* optimistic */ }
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
        <motion.div variants={itemVars} className="insight-card">
          <div className="insight-icon streak"><Flame size={20} /></div>
          <div className="insight-info">
            <span className="insight-value">{user?.studyStats?.streak ?? 0} Days</span>
            <span className="insight-label">Study Streak</span>
          </div>
        </motion.div>
        <motion.div variants={itemVars} className="insight-card">
          <div className="insight-icon cards"><Layers size={20} /></div>
          <div className="insight-info">
            <span className="insight-value">{user?.studyStats?.cardsMastered ?? 0}</span>
            <span className="insight-label">Cards Mastered</span>
          </div>
        </motion.div>
        <motion.div variants={itemVars} className="insight-card">
          <div className="insight-icon notes"><FileText size={20} /></div>
          <div className="insight-info">
            <span className="insight-value">{recentFiles.length}</span>
            <span className="insight-label">Total Notes</span>
          </div>
        </motion.div>
        <motion.div variants={itemVars} className="insight-card">
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
          {/* FOCUS CARD */}
          <section className="dash-section">
            <div className="section-header">
              <h2>Current Focus</h2>
              <span className="badge">{progress}% Goal Completed</span>
            </div>
            <div className="focus-card">
              <div className="focus-info">
                <h3>Daily Study Progress</h3>
                <p>{completedCount} of {tasks.length} tasks finished</p>
                <div className="progress-track-large">
                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
              <button className="btn-start-session" onClick={() => {
                const last = localStorage.getItem("starNote_lastActive");
                if (last && last !== "undefined" && last !== "null") navigate(`/reader/${last}`);
                else navigate("/notes");
              }}>
                <Play size={18} fill="currentColor" />
              </button>
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
                <div className="empty-docs-dash" onClick={() => navigate("/notes")}>
                  <Layout size={24} />
                  <p>{searchQuery ? "No matching materials found." : "No materials yet. Start by uploading one."}</p>
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
                <div className="tasks-all-done">
                  <CheckCircle2 size={32} />
                  <p>All caught up!</p>
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