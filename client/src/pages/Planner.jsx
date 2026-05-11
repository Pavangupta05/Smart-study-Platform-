import { useState, useEffect } from "react";
import { Plus, Clock, Coffee, Brain, CheckCircle2, Wand2, Trash2, CalendarDays } from "lucide-react";
import { tasksService, aiService } from "../services/index";
import { useUser } from "../context/UserContext";
import { toast } from "sonner";
import EmptyState from "../components/ui/EmptyState";
import "../styles/planner.css";


function Planner() {
  const { socket } = useUser();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchTasks = () => {
    tasksService.getAll().then(res => {
      const plannerItems = (res.data.tasks || []).filter(t => t.time);
      setTasks(plannerItems.sort((a, b) => a.time.localeCompare(b.time)));
    }).catch(err => {
      console.error(err);
      toast.error("Failed to load your schedule.");
    }).finally(() => setIsLoading(false));
  };

  useEffect(() => {
    setIsLoading(true);
    fetchTasks();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("sync_tasks", fetchTasks);
    return () => socket.off("sync_tasks", fetchTasks);
  }, [socket]);

  const [newTask, setNewTask] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newLoad, setNewLoad] = useState("Medium");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeTip, setOptimizeTip] = useState("");

  const toggleTask = async (id) => {
    const task = tasks.find(t => (t._id || t.id) === id);
    if (!task) return;
    setTasks(prev => prev.map(t => (t._id || t.id) === id ? { ...t, completed: !t.completed } : t));
    try { 
      await tasksService.toggle(id, !task.completed); 
    } catch (err) {
      toast.error("Failed to update task status.");
      // Rollback optimistic update
      setTasks(prev => prev.map(t => (t._id || t.id) === id ? { ...t, completed: task.completed } : t));
    }
  };

  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => (t._id || t.id) !== id));
    try { 
      await tasksService.delete(id); 
      toast.success("Task deleted");
    } catch (err) {
      toast.error("Failed to delete task.");
      // Rollback
      setTasks(prev => [...prev, task].sort((a, b) => a.time.localeCompare(b.time)));
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setOptimizeTip("");

    try {
      const res = await aiService.optimizeSchedule(tasks);
      const { tasks: optimizedTasks, tip } = res.data.data;

      if (optimizedTasks?.length) {
        const newTasks = [];
        for (const t of optimizedTasks) {
          const payload = {
            text: t.title,
            time: t.time,
            priority: t.load,
            type: t.type || "task",
            completed: false
          };
          try {
            const taskRes = await tasksService.create(payload);
            newTasks.push(taskRes.data.task);
          } catch (e) {
            console.error("Failed to save optimized task:", e);
          }
        }
        const allRes = await tasksService.getAll();
        const plannerItems = (allRes.data.tasks || []).filter(item => item.time);
        setTasks(plannerItems.sort((a, b) => a.time.localeCompare(b.time)));
      }

      if (tip) setOptimizeTip(tip);
    } catch (err) {
      console.error("AI Optimize Error:", err);
      setOptimizeTip("Could not optimize right now. Try again in a moment.");
    }

    setIsOptimizing(false);
  };


  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    let formattedTime = newTime;
    
    if (!formattedTime) {
      const lastTime = tasks[tasks.length - 1]?.time || "08:00";
      const [hours, minutes] = lastTime.split(":").map(Number);
      const nextTime = new Date();
      nextTime.setHours(hours + 1, minutes);
      formattedTime = nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    const payload = {
      text: newTask,
      time: formattedTime,
      priority: newLoad,
      type: "task"
    };

    try {
      const res = await tasksService.create(payload);
      setTasks(prev => [...prev, res.data.task].sort((a, b) => a.time.localeCompare(b.time)));
    } catch (e) {
      console.error(e);
      toast.error("Failed to add task.");
    }
    setNewTask("");
    setNewTime("");
  };

  return (
    <div className="planner-page fade-in">
      <div className="planner-header">
        <h1 className="page-title">Study Planner</h1>
        <p className="page-subtitle">Organize your day and manage your study time.</p>
      </div>

      <div className="planner-container">
        
        {/* TIMELINE COLUMN */}
        <div className="timeline-column">
          <div className="timeline-header">
            <div>
              <h2 className="section-title">Today's Schedule</h2>
              <div className="energy-indicator">
                <Brain size={14} /> Best Focus Time: 08:00 - 11:30
              </div>
            </div>
            <button className={`btn-ai-optimize ${isOptimizing ? 'loading' : ''}`} onClick={handleOptimize}>
              <Wand2 size={16} />
              <span>{isOptimizing ? "Optimizing..." : "Optimize with AI"}</span>
            </button>
          </div>

          <div className="adaptive-timeline">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="timeline-block skeleton" style={{ minHeight: "80px", marginBottom: "16px", borderRadius: "16px", background: "rgba(120, 120, 120, 0.1)" }}></div>
              ))
            ) : tasks.length === 0 ? (
              <EmptyState
                icon={<CalendarDays size={44} strokeWidth={1.2} />}
                title="Your schedule is clear"
                description="Add your first task to start planning your study session, or let AI build you an optimized schedule."
                ctaLabel="+ Add a task"
                onCta={() => document.querySelector(".input-group input")?.focus()}
              />
            ) : tasks.map((item, index) => (
              <div 
                key={item._id || item.id} 
                className={`timeline-block ${item.type} ${item.completed ? 'completed' : ''} ${(item.priority || item.load) === 'High' ? 'high-priority' : ''}`}
              >
                <div className="block-time">
                  <span>{item.time}</span>
                  <div className="time-line"></div>
                </div>

                <div className="block-content">
                  <div className="block-main">
                    <div className="block-info">
                      {item.type === 'break' ? <Coffee size={18} className="break-icon" /> : null}
                      <h3>{item.text || item.title}</h3>
                    </div>
                    
                    <div className="block-meta">
                      {(item.priority || item.load) !== "None" && (
                        <span className={`load-label ${(item.priority || item.load).toLowerCase()}`}>
                          {item.priority || item.load} Difficulty
                        </span>
                      )}
                      <button 
                        className={`btn-check ${item.completed ? 'active' : ''}`}
                        onClick={() => toggleTask(item._id || item.id)}
                      >
                        <CheckCircle2 size={18} />
                      </button>
                      <button 
                        className="btn-delete-task"
                        onClick={() => deleteTask(item._id || item.id)}
                        title="Delete Task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CONTROLS COLUMN */}
        <div className="planner-controls">
          <div className="control-card">
            <h3 className="card-title">Add New Task</h3>
            <form onSubmit={addTask}>
              <div className="input-group">
                <label>What are you studying?</label>
                <input 
                  type="text" 
                  placeholder="e.g. Master Neural Networks"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Target Time</label>
                <input 
                  type="time" 
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="time-input-smooth"
                />
              </div>

              <div className="input-group">
                <label>Difficulty Level</label>
                <div className="load-selector">
                  {['Low', 'Medium', 'High'].map(load => (
                    <button 
                      key={load}
                      type="button"
                      className={`load-btn ${newLoad === load ? 'active' : ''}`}
                      onClick={() => setNewLoad(load)}
                    >
                      {load}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-add-task">
                <Plus size={18} /> Add Task
              </button>
            </form>
          </div>

          <div className="insight-card">
            <h3 className="card-title">
              {optimizeTip ? "🤖 AI Insight" : "Study Tip"}
            </h3>
            <p>
              {optimizeTip 
                ? optimizeTip 
                : `You have ${tasks.filter(t => (t.priority || t.load) === 'High').length} high-difficulty task(s) today. Use the "Optimize with AI" button to get a smarter schedule.`
              }
            </p>
            <div className="velocity-metric">
              <span>Today's Progress — {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%</span>
              <div className="progress-mini">
                <div 
                  className="progress-fill" 
                  style={{ width: tasks.length > 0 ? `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Planner;
