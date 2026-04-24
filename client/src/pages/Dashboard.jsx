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
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  
  // --- Task State ---
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("starNote_tasks");
    return saved ? JSON.parse(saved) : [
      { id: 1, text: "Complete Calculus Quiz", completed: false },
      { id: 2, text: "Read Physics Chapter 4", completed: true },
      { id: 3, text: "Review AI Notes", completed: false }
    ];
  });

  const [newTask, setNewTask] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [recentFiles, setRecentFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem("starNote_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    setIsLoading(true);
    const saved = localStorage.getItem("starNote_files");
    if (saved) {
      const files = JSON.parse(saved);
      // Attach original index so search filtering doesn't break navigation IDs
      setRecentFiles(files.map((f, index) => ({ ...f, originalIndex: index })));
    }
    const timer = setTimeout(() => setIsLoading(false), 500); // Simulate network latency
    return () => clearTimeout(timer);
  }, []);

  const filteredFiles = recentFiles.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 4);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const task = {
      id: Date.now(),
      text: newTask,
      completed: false
    };
    setTasks([task, ...tasks]);
    setNewTask("");
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="dashboard-minimal fade-in">
      <header className="dash-header">
        <div className="dash-greeting">
          <h1>Hello!</h1>
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
      <section className="study-insights slide-up">
        <div className="insight-card">
          <div className="insight-icon streak"><Flame size={20} /></div>
          <div className="insight-info">
            <span className="insight-value">12 Days</span>
            <span className="insight-label">Study Streak</span>
          </div>
        </div>
        <div className="insight-card">
          <div className="insight-icon cards"><Layers size={20} /></div>
          <div className="insight-info">
            <span className="insight-value">124</span>
            <span className="insight-label">Cards Mastered</span>
          </div>
        </div>
        <div className="insight-card">
          <div className="insight-icon notes"><FileText size={20} /></div>
          <div className="insight-info">
            <span className="insight-value">{recentFiles.length}</span>
            <span className="insight-label">Total Notes</span>
          </div>
        </div>
        <div className="insight-card">
          <div className="insight-icon time"><Clock size={20} /></div>
          <div className="insight-info">
            <span className="insight-value">42.5h</span>
            <span className="insight-label">Focus Time</span>
          </div>
        </div>
      </section>

      <div className="dash-content">
        <div className="dash-main">
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
                  <div key={file.originalIndex} className="doc-card-mini" onClick={() => navigate(`/reader/${file.originalIndex}`)}>
                    <div className="doc-icon-small">{file.icon || "📄"}</div>
                    <div className="doc-details">
                      <span className="doc-name">{file.name}</span>
                      <span className="doc-time">{file.date}</span>
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
        </div>

        {/* TASK SIDEBAR */}
        <aside className="dash-sidebar">
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
              {tasks.map(task => (
                <div key={task.id} className={`dash-task-item ${task.completed ? 'is-done' : ''}`}>
                  <button className="btn-check" onClick={() => toggleTask(task.id)}>
                    {task.completed ? <CheckCircle2 size={18} className="icon-done" /> : <Circle size={18} />}
                  </button>
                  <span className="task-text">{task.text}</span>
                  <button className="btn-del-task" onClick={() => deleteTask(task.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="tasks-all-done">
                  <CheckCircle2 size={32} />
                  <p>All caught up!</p>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Dashboard;