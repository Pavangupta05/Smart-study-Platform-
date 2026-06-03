import React from 'react';
import { motion } from 'framer-motion';

export default function SubjectAnalyticsGrid() {
  const subjects = [
    { name: 'Data Structures', progress: 82, color: 'var(--planner-teal)', hours: 24 },
    { name: 'Operating Systems', progress: 71, color: 'var(--planner-orange)', hours: 18 },
    { name: 'DBMS', progress: 88, color: 'var(--planner-purple)', hours: 32 },
    { name: 'Computer Networks', progress: 65, color: 'var(--planner-rose)', hours: 14 }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
      {subjects.map((sub, i) => (
        <motion.div 
          key={sub.name}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          whileHover={{ y: -5 }}
          className="planner-card"
          style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
        >
          <div style={{ position: 'relative', width: '60px', height: '60px', marginBottom: '1rem' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--border-color)"
                strokeWidth="3"
              />
              <motion.path
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${sub.progress}, 100` }}
                transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={sub.color}
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.75rem', fontWeight: 700 }}>
              {sub.progress}%
            </div>
          </div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 600 }}>{sub.name}</h4>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sub.hours}h studied</span>
        </motion.div>
      ))}
    </div>
  );
}
