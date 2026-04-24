import { useState, useEffect } from "react";
import { Plus, Clock, Coffee, Brain, ChevronRight, CheckCircle2, Wand2, Trash2 } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "../styles/planner.css";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

function Planner() {
  const [tasks, setTasks] = useState([
    { id: 1, time: "08:00", title: "Quantum Physics Research", load: "High", completed: false, type: "task" },
    { id: 2, time: "10:30", title: "Quick Break", load: "None", completed: false, type: "break" },
    { id: 3, time: "11:00", title: "Linear Algebra Problem Set", load: "Medium", completed: false, type: "task" },
    { id: 4, time: "13:00", title: "Lunch", load: "None", completed: false, type: "break" },
    { id: 5, time: "14:00", title: "Write Project Draft", load: "High", completed: false, type: "task" },
  ]);

  const [newTask, setNewTask] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newLoad, setNewLoad] = useState("Medium");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeTip, setOptimizeTip] = useState("");

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setOptimizeTip("");

    try {
      const taskList = tasks.map(t => `${t.time} - ${t.title} (${t.load} difficulty, type: ${t.type})`).join("\n");

      const prompt = `You are a study schedule optimizer. Given this student's study plan:

${taskList}

Optimize the schedule by:
1. Placing high-difficulty tasks during peak focus hours (8AM-11AM)
2. Adding strategic breaks after intense sessions
3. Grouping related subjects together
4. Ensuring proper rest periods

Return TWO things:
1. A JSON array of the optimized tasks with keys: "time" (HH:MM 24h), "title", "load" (High/Medium/Low/None), "type" (task/break)
2. A short 1-line tip explaining the optimization

Format your response EXACTLY like this (no markdown, no code fences):
TASKS: [{"time":"08:00","title":"...","load":"High","type":"task"}]
TIP: Your optimization tip here`;

      const result = await aiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      // Parse TASKS line
      const tasksMatch = text.match(/TASKS:\s*(\[.*\])/s);
      const tipMatch = text.match(/TIP:\s*(.*)/);

      if (tasksMatch) {
        const optimizedTasks = JSON.parse(tasksMatch[1]);
        const newTasks = optimizedTasks.map((t, i) => ({
          id: Date.now() + i,
          time: t.time,
          title: t.title,
          load: t.load,
          completed: false,
          type: t.type || "task"
        }));
        setTasks(newTasks.sort((a, b) => a.time.localeCompare(b.time)));
      }

      if (tipMatch) {
        setOptimizeTip(tipMatch[1]);
      }
    } catch (err) {
      console.error("AI Optimize Error:", err);
      setOptimizeTip("Could not optimize right now. Try again in a moment.");
    }

    setIsOptimizing(false);
  };


  const addTask = (e) => {
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

    const taskObj = {
      id: Date.now(),
      time: formattedTime,
      title: newTask,
      load: newLoad,
      completed: false,
      type: "task"
    };

    setTasks([...tasks, taskObj].sort((a, b) => a.time.localeCompare(b.time)));
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
            {tasks.map((item, index) => (
              <div 
                key={item.id} 
                className={`timeline-block ${item.type} ${item.completed ? 'completed' : ''} ${item.load === 'High' ? 'high-priority' : ''}`}
              >
                <div className="block-time">
                  <span>{item.time}</span>
                  <div className="time-line"></div>
                </div>

                <div className="block-content">
                  <div className="block-main">
                    <div className="block-info">
                      {item.type === 'break' ? <Coffee size={18} className="break-icon" /> : null}
                      <h3>{item.title}</h3>
                    </div>
                    
                    <div className="block-meta">
                      {item.load !== "None" && (
                        <span className={`load-label ${item.load.toLowerCase()}`}>
                          {item.load} Difficulty
                        </span>
                      )}
                      <button 
                        className={`btn-check ${item.completed ? 'active' : ''}`}
                        onClick={() => toggleTask(item.id)}
                      >
                        <CheckCircle2 size={18} />
                      </button>
                      <button 
                        className="btn-delete-task"
                        onClick={() => deleteTask(item.id)}
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
                : `You have ${tasks.filter(t => t.load === 'High').length} high-difficulty task(s) today. Use the "Optimize with AI" button to get a smarter schedule.`
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
