import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';

import '../styles/planner.css';

import PlannerHero from '../components/planner/PlannerHero';
import StudyProgressCard from '../components/planner/StudyProgressCard';
import WeeklyCalendar from '../components/planner/WeeklyCalendar';
import StudyTimeline from '../components/planner/StudyTimeline';

export default function Planner() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [viewFilter, setViewFilter] = useState('task'); // 'task' | 'project' | 'meeting'
  const [newTaskText, setNewTaskText] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Use centralized tasks hook
  const { tasks, loading: isLoading, addTask, toggleTask, deleteTask } = useTasks();

  const handleAddTask = (e) => {
    e?.preventDefault();
    if (!newTaskText.trim()) return;
    addTask(newTaskText.trim());
    setNewTaskText('');
    setIsAddingTask(false);
  };

  const colors = ['var(--planner-teal)', 'var(--planner-orange)', 'var(--planner-rose)', 'var(--planner-purple)'];

  return (
    <div className="planner-page">
      <PlannerHero />

      <div className="planner-grid-top">
        <StudyProgressCard tasks={tasks} />
      </div>

      <div className="planner-grid-main">
        {/* Left Column - Schedule & Timeline */}
        <div className="planner-card">
          <WeeklyCalendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onAddTask={() => {
              setIsAddingTask(true);
              setTimeout(() => {
                document.querySelector('.planner-quick-add-input')?.focus();
              }, 150);
            }}
          />

          {/* Filter Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.5rem' }}>
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

        {/* Right Column - Today's Tasks Only */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
        </div>
      </div>
    </div>
  );
}
