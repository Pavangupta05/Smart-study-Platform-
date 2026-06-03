import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';

export default function StudyTimeline({ tasks = [] }) {
  // Expand hours to cover a full study day (8 AM to 8 PM)
  const hours = Array.from({ length: 13 }, (_, i) => {
    const h = i + 8;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h > 12 ? h - 12 : h;
    return { 
      time: `${h < 10 ? '0'+h : h}:00`, 
      label: `${hour12 < 10 ? '0'+hour12 : hour12} ${ampm}` 
    };
  });

  // AI Scheduling Algorithm: 
  // Automatically assign incomplete tasks to non-overlapping 1-hour blocks starting from 8 AM (or current hour if later)
  const colors = ['teal', 'orange', 'rose', 'purple'];
  const pendingTasks = tasks.filter(t => !t.completed);
  
  let currentHour = Math.max(8, new Date().getHours());
  if (currentHour > 19) currentHour = 8; // Reset to morning if it's too late

  const scheduledTasks = pendingTasks.map((task, index) => {
    const startHour = currentHour;
    currentHour += 1; // Increment by 1 hour for each task to prevent overlap!
    
    // Format time label
    const endHour = startHour + 1;
    const formatHour = (h) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h > 12 ? h - 12 : h;
      return `${h12}${ampm}`;
    };

    return {
      id: task._id || task.id,
      title: task.text,
      time: `${formatHour(startHour)} - ${formatHour(endHour)}`,
      startHour: startHour,
      duration: 1,
      color: colors[index % colors.length]
    };
  });

  return (
    <div className="timeline-container">
      {hours.map((h) => (
        <div key={h.time} className="timeline-hour">
          <span>{h.time}</span>
        </div>
      ))}
      
      {scheduledTasks.length === 0 && (
        <div style={{ position: 'absolute', top: '100px', left: '20px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          No pending tasks to schedule. Take a break!
        </div>
      )}

      {scheduledTasks.map((task) => {
        // Base hour is 8
        const topOffset = (task.startHour - 8) * 100; // 100px per hour
        const height = task.duration * 100 - 10; // -10 for gap
        
        // Hide tasks that fall outside the 8 AM - 8 PM window
        if (task.startHour > 20) return null;

        return (
          <motion.div
            key={task.id}
            drag="y"
            dragConstraints={{ top: 0, bottom: (12 * 100) }}
            dragElastic={0.2}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98, cursor: 'grabbing' }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className={`timeline-block ${task.color}`}
            style={{ top: `${topOffset}px`, height: `${height}px` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ overflow: 'hidden' }}>
                <div className="timeline-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{task.title}</div>
                <div className="timeline-time">{task.time}</div>
              </div>
              {task.duration >= 1 && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PlayCircle size={18} />
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
