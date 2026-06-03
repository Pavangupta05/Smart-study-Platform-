import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

export default function StudyProgressCard() {
  const [progress, setProgress] = useState(0);
  const targetProgress = 70; // Mock data
  
  // Count up animation
  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += 2;
        if (current >= targetProgress) {
          setProgress(targetProgress);
          clearInterval(interval);
        } else {
          setProgress(current);
        }
      }, 20);
      return () => clearInterval(interval);
    }, 500); // Small delay before animating
    return () => clearTimeout(timer);
  }, [targetProgress]);

  // Calculate SVG stroke dasharray
  const radius = 90;
  const circumference = Math.PI * radius; // Semi-circle
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="planner-card" 
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255, 184, 107, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--planner-orange)' }}>
            <Crown size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Premium Version</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Try 1 month premium for free</p>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ background: 'var(--planner-purple)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
        >
          Try Now
        </motion.button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', marginTop: '1rem' }}>
        <svg viewBox="0 0 200 120" className="circular-chart">
          {/* Background Track */}
          <path
            className="circle-bg"
            stroke="var(--border-color)"
            d="M 10 110 A 90 90 0 0 1 190 110"
            style={{ fill: 'none', strokeWidth: 16, strokeLinecap: 'round', opacity: 0.3 }}
          />
          {/* Colored Segments - based on the image: Teal -> Orange -> Rose */}
          {/* Base stroke path to act as the mask or just draw over */}
          <motion.path
            className="circle"
            stroke="url(#gradient)"
            d="M 10 110 A 90 90 0 0 1 190 110"
            style={{ 
              fill: 'none', 
              strokeWidth: 16, 
              strokeLinecap: 'round',
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset
            }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--planner-teal)" />
              <stop offset="50%" stopColor="var(--planner-orange)" />
              <stop offset="100%" stopColor="var(--planner-rose)" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, lineHeight: 1 }}>{progress}%</h2>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--planner-teal)' }}></div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Projects 80%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--planner-orange)' }}></div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Task 80%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--planner-rose)' }}></div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Meeting 80%</span>
        </div>
      </div>
    </motion.div>
  );
}
