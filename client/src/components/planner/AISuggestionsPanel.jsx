import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Clock, Target, Zap } from 'lucide-react';

export default function AISuggestionsPanel() {
  const suggestions = [
    { id: 1, icon: <TrendingUp size={18} />, text: "Revise Operating Systems today based on forgetting curve.", color: 'var(--planner-rose)' },
    { id: 2, icon: <Target size={18} />, text: "Complete DSA Sheet #3 before tomorrow.", color: 'var(--planner-teal)' },
    { id: 3, icon: <Clock size={18} />, text: "Your best focus time is between 7 PM - 9 PM.", color: 'var(--planner-orange)' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="planner-card" 
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--planner-purple)', opacity: 0.1, filter: 'blur(40px)', borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', background: 'var(--planner-teal)', opacity: 0.1, filter: 'blur(30px)', borderRadius: '50%' }}></div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
        <Sparkles size={20} style={{ color: 'var(--planner-purple)' }} />
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>AI Recommendations</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {suggestions.map((s) => (
          <motion.div 
            key={s.id}
            whileHover={{ scale: 1.02, x: 5 }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${s.color}20`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.icon}
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{s.text}</p>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ width: '100%', marginTop: '1.5rem', padding: '12px', background: 'linear-gradient(135deg, var(--planner-purple), #8B5CF6)', color: 'white', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}
      >
        <Zap size={18} /> Generate Personalized Plan
      </motion.button>
    </motion.div>
  );
}
