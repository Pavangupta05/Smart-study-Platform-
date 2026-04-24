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
  Layout
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

  // --- Recent Files State ---
  const [recentFiles, setRecentFiles] = useState([]);

  useEffect(() => {
    localStorage.setItem("starNote_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const saved = localStorage.getItem("starNote_files");
    if (saved) {
      const files = JSON.parse(saved);
      // Attach original index so search filtering doesn't break navigation IDs
      setRecentFiles(files.map((f, index) => ({ ...f, originalIndex: index })));
    }
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
          <h1>Welcome back!</h1>
          <p>You have {tasks.filter(t => !t.completed).length} tasks remaining for today.</p>
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
              {filteredFiles.length > 0 ? filteredFiles.map((file) => (
                <div key={file.originalIndex} className="doc-card-mini" onClick={() => navigate(`/reader/${file.originalIndex}`)}>
                  <div className="doc-icon-small">{file.icon || "📄"}</div>
                  <div className="doc-details">
                    <span className="doc-name">{file.name}</span>
                    <span className="doc-time">{file.date}</span>
                  </div>
                </div>
              )) : (
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