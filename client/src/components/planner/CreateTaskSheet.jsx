import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Tag, Sparkles } from 'lucide-react';
import { tasksService } from '../../services/index';
import { toast } from 'sonner';

export default function CreateTaskSheet({ isOpen, onClose, onTaskCreated }) {
  const [taskText, setTaskText] = useState('');
  const [priority, setPriority] = useState('High');
  const [subject, setSubject] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const priorityOptions = ['High', 'Medium', 'Low'];
  const priorityColors = { High: '#EF4444', Medium: '#F59E0B', Low: '#22C55E' };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  const handleSave = async () => {
    if (!taskText.trim()) {
      toast.error('Please enter a task name.');
      return;
    }
    setIsSaving(true);
    try {
      const text = subject ? `[${subject}] ${taskText.trim()}` : taskText.trim();
      const res = await tasksService.create({ text });
      toast.success('Task created!');
      onTaskCreated?.(res.data.task);
      setTaskText('');
      setSubject('');
      setPriority('High');
    } catch {
      toast.error('Failed to save task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setTaskText('');
    setSubject('');
    setPriority('High');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="drawer-overlay"
            onClick={handleClose}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="task-sheet"
          >
            {/* Handle Bar */}
            <div style={{ width: '40px', height: '4px', background: 'var(--border-color)', borderRadius: '2px', margin: '0 auto 1.5rem' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>✨ New Study Task</h2>
              <button onClick={handleClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Task Name */}
              <input
                type="text"
                placeholder="What do you want to study?"
                value={taskText}
                onChange={e => setTaskText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '1.05rem',
                  background: 'var(--bg-secondary)',
                  border: '1.5px solid var(--planner-purple)',
                  borderRadius: '16px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />

              {/* Subject */}
              <input
                type="text"
                placeholder="Subject (e.g. Data Structures, OS, DBMS...)"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '0.95rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />

              {/* Date Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: '14px' }}>
                <Calendar size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.95rem' }}>{today}</span>
              </div>

              {/* Priority Selector */}
              <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <Clock size={18} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Priority</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {priorityOptions.map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '10px',
                        border: `1.5px solid ${priority === p ? priorityColors[p] : 'transparent'}`,
                        background: priority === p ? `${priorityColors[p]}18` : 'var(--bg-primary)',
                        color: priority === p ? priorityColors[p] : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Suggest */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px', background: 'rgba(99,102,241,0.08)',
                  color: 'var(--planner-purple)',
                  border: '1px dashed var(--planner-purple)', borderRadius: '14px',
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                <Sparkles size={17} /> AI: Auto-Suggest Best Time Slot
              </motion.button>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.75rem' }}>
              <motion.button
                onClick={handleClose}
                whileTap={{ scale: 0.96 }}
                style={{
                  flex: 1, padding: '15px', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', border: 'none',
                  borderRadius: '16px', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem'
                }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleSave}
                disabled={isSaving}
                whileTap={{ scale: 0.96 }}
                style={{
                  flex: 2, padding: '15px',
                  background: isSaving ? 'var(--bg-secondary)' : 'var(--planner-purple)',
                  color: isSaving ? 'var(--text-secondary)' : 'white',
                  border: 'none', borderRadius: '16px', fontWeight: 700,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  boxShadow: isSaving ? 'none' : '0 8px 25px rgba(99,102,241,0.35)',
                  fontSize: '0.95rem', transition: 'all 0.2s ease'
                }}
              >
                {isSaving ? 'Saving...' : '✓ Create Task'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
