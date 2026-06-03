import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Plus, Trash2, Sparkles } from 'lucide-react';
import { tasksService } from '../services/index';
import { toast } from 'sonner';

import '../styles/planner.css';

import PlannerHero from '../components/planner/PlannerHero';
import StudyProgressCard from '../components/planner/StudyProgressCard';
import WeeklyCalendar from '../components/planner/WeeklyCalendar';
import StudyTimeline from '../components/planner/StudyTimeline';
import AISuggestionsPanel from '../components/planner/AISuggestionsPanel';
import SubjectAnalyticsGrid from '../components/planner/SubjectAnalyticsGrid';
import FocusWidget from '../components/planner/FocusWidget';
import FloatingAIAssistant from '../components/planner/FloatingAIAssistant';
import CreateTaskSheet from '../components/planner/CreateTaskSheet';

export default function Planner() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [viewFilter, setViewFilter] = useState('task'); // 'task' | 'project' | 'meeting'
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTaskText, setNewTaskText] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Fetch tasks on mount
  React.useEffect(() => {
    tasksService.getAll()
      .then(res => {
        setTasks(res.data.tasks || []);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  // Add new task
  const handleAddTask = useCallback(async (e) => {
    e?.preventDefault();
    if (!newTaskText.trim()) return;
    const text = newTaskText.trim();
    setNewTaskText('');
    setIsAddingTask(false);
    try {
      const res = await tasksService.create({ text });
      setTasks(prev => [res.data.task, ...prev]);
      toast.success('Task added!');
    } catch {
      toast.error('Failed to add task.');
    }
  }, [newTaskText]);

  // Toggle task completion
  const toggleTask = useCallback(async (id) => {
    const task = tasks.find(t => (t._id || t.id) === id);
    if (!task) return;
    const completed = !task.completed;
    setTasks(prev => prev.map(t => (t._id || t.id) === id ? { ...t, completed } : t));
    try {
      await tasksService.toggle(id, completed);
    } catch {
      setTasks(prev => prev.map(t => (t._id || t.id) === id ? { ...t, completed: !completed } : t));
    }
  }, [tasks]);

  // Delete task
  const deleteTask = useCallback(async (id) => {
    const backup = tasks.find(t => (t._id || t.id) === id);
    setTasks(prev => prev.filter(t => (t._id || t.id) !== id));
    try {
      await tasksService.delete(id);
      toast.success('Task removed.');
    } catch {
      setTasks(prev => [backup, ...prev]);
      toast.error('Failed to delete task.');
    }
  }, [tasks]);

  // Handle task created from bottom sheet
  const handleTaskCreated = useCallback((newTask) => {
    setTasks(prev => [newTask, ...prev]);
    setIsTaskSheetOpen(false);
  }, []);

  const colors = ['var(--planner-teal)', 'var(--planner-orange)', 'var(--planner-rose)', 'var(--planner-purple)'];

  return (
    <div className="planner-page">
      <PlannerHero />

      <div className="planner-grid-top">
        <StudyProgressCard tasks={tasks} />
        <AISuggestionsPanel />
      </div>

      <div className="planner-grid-main">
        {/* Left Column - Schedule & Timeline */}
        <div className="planner-card" style={{ padding: '2rem' }}>
          <WeeklyCalendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onAddTask={() => {
              setIsAddingTask(true);
              // Scroll sidebar into view on mobile
              setTimeout(() => {
                document.querySelector('.planner-quick-add-input')?.focus();
              }, 150);
            }}
          />

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            {[
              { key: 'task', label: `Tasks (${tasks.length})` },
              { key: 'project', label: 'Projects' },
              { key: 'meeting', label: 'Meetings' }
            ].map(({ key, label }) => (
              <motion.button
                key={key}
                onClick={() => setViewFilter(key)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  border: viewFilter === key ? '1px solid var(--planner-purple)' : '1px solid transparent',
                  background: viewFilter === key ? 'var(--bg-secondary)' : 'transparent',
                  color: viewFilter === key ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                }}
              >
                {label}
              </motion.button>
            ))}
          </div>

          <StudyTimeline tasks={tasks} />
        </div>

        {/* Right Column - Today's Tasks & Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Today's Tasks Card */}
          <div className="planner-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Today's Tasks</h3>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => setIsAddingTask(true)}
                style={{
                  width: '34px', height: '34px', borderRadius: '10px',
                  background: 'var(--planner-purple)', color: 'white',
                  border: 'none', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.35)'
                }}
                title="Add new task"
              >
                <Plus size={18} />
              </motion.button>
            </div>

            {/* Inline Quick-Add Form */}
            <AnimatePresence>
              {isAddingTask && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleAddTask}
                  style={{ marginBottom: '1rem', overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      autoFocus
                      className="planner-quick-add-input"
                      value={newTaskText}
                      onChange={e => setNewTaskText(e.target.value)}
                      onKeyDown={e => e.key === 'Escape' && setIsAddingTask(false)}
                      placeholder="What do you need to study?"
                      style={{
                        flex: 1, padding: '12px 16px',
                        background: 'var(--bg-secondary)',
                        border: '1.5px solid var(--planner-purple)',
                        borderRadius: '12px', color: 'var(--text-primary)',
                        fontSize: '0.95rem', outline: 'none'
                      }}
                    />
                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.95 }}
                      style={{
                        padding: '0 16px', background: 'var(--planner-purple)',
                        color: 'white', border: 'none', borderRadius: '12px',
                        fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                      }}
                    >
                      Add
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsAddingTask(false)}
                      style={{
                        padding: '0 12px', background: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)', border: 'none',
                        borderRadius: '12px', cursor: 'pointer'
                      }}
                    >
                      ✕
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Task List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} style={{ height: '64px', borderRadius: '14px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease infinite' }} />
                ))
              ) : tasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>No tasks yet. Hit <strong>+</strong> to add your first study task!</p>
                </motion.div>
              ) : (
                <AnimatePresence initial={false}>
                  {tasks.slice(0, 6).map((task, i) => {
                    const color = colors[i % colors.length];
                    const taskId = task._id || task.id;
                    return (
                      <motion.div
                        key={taskId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          padding: '14px 16px',
                          background: 'var(--bg-secondary)',
                          borderRadius: '14px',
                          borderLeft: `4px solid ${color}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <button
                          onClick={() => toggleTask(taskId)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', color }}
                        >
                          {task.completed
                            ? <CheckCircle2 size={22} />
                            : <Circle size={22} style={{ color: 'var(--text-secondary)' }} />}
                        </button>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            margin: 0, fontSize: '0.95rem', fontWeight: 600,
                            textDecoration: task.completed ? 'line-through' : 'none',
                            opacity: task.completed ? 0.55 : 1,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            {task.text}
                          </p>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {task.completed ? '✓ Completed' : 'Pending'}
                          </span>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteTask(taskId)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                        >
                          <Trash2 size={15} />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* More tasks indicator */}
            {tasks.length > 6 && (
              <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                +{tasks.length - 6} more tasks on Dashboard
              </p>
            )}
          </div>

          {/* Upcoming Exams */}
          <div className="planner-card" style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.08), rgba(225,29,72,0.03))', borderColor: 'rgba(244,63,94,0.2)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--planner-rose)' }}>
              🗓 Upcoming Exams
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>Operating Systems Final</h4>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Syllabus: Chapters 1–6</span>
              </div>
              <div style={{ background: 'var(--planner-rose)', color: 'white', padding: '6px 14px', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem' }}>
                12 Days
              </div>
            </div>
          </div>

          <SubjectAnalyticsGrid />

          <FocusWidget />
        </div>
      </div>

      {/* Floating AI FAB */}
      <FloatingAIAssistant />

      {/* "Create Task" bottom sheet with save to DB */}
      <CreateTaskSheet
        isOpen={isTaskSheetOpen}
        onClose={() => setIsTaskSheetOpen(false)}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}
