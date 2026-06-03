import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

export default function FocusWidget() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="planner-card" 
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, var(--planner-purple), #8B5CF6)', color: 'white', marginTop: '2rem' }}
    >
      <div>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', opacity: 0.9 }}>Current Focus Session</h4>
        <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>25:00</h2>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '8px' }}>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Focus: 92%</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Distractions: Low</span>
        </div>
      </div>

      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
      >
        <Play size={28} style={{ marginLeft: '4px' }} />
      </motion.button>
    </motion.div>
  );
}
