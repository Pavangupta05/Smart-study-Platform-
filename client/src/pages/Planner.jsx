import { useState, useEffect } from "react";
import { Plus, Clock, Coffee, Brain, ChevronRight, CheckCircle2 } from "lucide-react";
import "../styles/planner.css";

function Planner() {
  const [tasks, setTasks] = useState([
    { id: 1, time: "08:00", title: "Quantum Physics Research", load: "High", completed: false, type: "task" },
    { id: 2, time: "10:30", title: "Quick Break", load: "None", completed: false, type: "break" },
    { id: 3, time: "11:00", title: "Linear Algebra Problem Set", load: "Medium", completed: false, type: "task" },
    { id: 4, time: "13:00", title: "Lunch", load: "None", completed: false, type: "break" },
    { id: 5, time: "14:00", title: "Write Thesis Draft", load: "High", completed: false, type: "task" },
  ]);

  const [newTask, setNewTask] = useState("");
  const [newLoad, setNewLoad] = useState("Medium");

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const lastTime = tasks[tasks.length - 1]?.time || "08:00";
    const [hours, minutes] = lastTime.split(":").map(Number);
    const nextTime = new Date();
    nextTime.setHours(hours + 1, minutes);
    
    const formattedTime = nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const taskObj = {
      id: Date.now(),
      time: formattedTime,
      title: newTask,
      load: newLoad,
      completed: false,
      type: "task"
    };

    setTasks([...tasks, taskObj]);
    setNewTask("");
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
            <h2 className="section-title">Today's Schedule</h2>
            <div className="energy-indicator">
              <Brain size={14} /> Best Focus Time: 08:00 - 11:30
            </div>
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
            <h3 className="card-title">Study Tip</h3>
            <p>Since you have a <strong>High Difficulty</strong> task this morning, we've added a break at 10:30 to help you stay fresh.</p>
            <div className="velocity-metric">
              <span>Progress Bar</span>
              <div className="progress-mini">
                <div className="progress-fill" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Planner;
