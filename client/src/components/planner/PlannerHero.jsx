import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, Sparkles } from 'lucide-react';
import { useUser } from '../../context/UserContext';

export default function PlannerHero({ onAIClick }) {
  const { firstName, user } = useUser();

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  })();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="planner-hero"
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}
    >
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          {greeting}, {firstName} <span style={{ display: 'inline-block', transformOrigin: '70% 70%', animation: 'wave 2.5s infinite' }}>👋</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
          You are <span style={{ color: 'var(--planner-teal)', fontWeight: 600 }}>78%</span> closer to your weekly goal.
        </p>
      </div>

      <style>{`
        @keyframes wave {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
          60% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        @media (max-width: 768px) {
          .planner-hero { flex-direction: column; align-items: flex-start !important; gap: 1rem; }
        }
      `}</style>
    </motion.div>
  );
}
