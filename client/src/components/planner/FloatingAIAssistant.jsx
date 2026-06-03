import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Sparkles, Calendar, BookOpen, Brain, Activity } from 'lucide-react';

export default function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { id: 1, label: 'Create Study Plan', icon: <Calendar size={18} /> },
    { id: 2, label: 'Generate Revision Strategy', icon: <BookOpen size={18} /> },
    { id: 3, label: 'Analyze Weak Subjects', icon: <Activity size={18} /> },
    { id: 4, label: 'Exam Preparation Plan', icon: <Brain size={18} /> },
  ];

  return (
    <>
      <motion.button 
        className="ai-fab"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Bot size={28} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="drawer-overlay"
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="ai-planner-drawer"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--planner-purple), var(--planner-teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Sparkles size={20} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>AI Study Coach</h2>
                </div>
                <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
                How can I help you optimize your study schedule today?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {actions.map((action) => (
                  <motion.button
                    key={action.id}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ color: 'var(--planner-purple)' }}>{action.icon}</div>
                    {action.label}
                  </motion.button>
                ))}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="Ask me anything..." 
                    style={{ width: '100%', padding: '16px 48px 16px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '24px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                  <button style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--planner-purple)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Sparkles size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
