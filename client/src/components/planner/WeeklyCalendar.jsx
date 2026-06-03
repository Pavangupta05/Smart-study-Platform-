import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function WeeklyCalendar({ selectedDate, setSelectedDate, onAddTask }) {
  const today = new Date();
  const todayDate = today.getDate();

  // Generate the current week (Mon-Sun) based on today
  const getWeekDays = () => {
    const days = [];
    const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon ...
    // Monday = start of week (offset: dayOfWeek === 0 means we subtract 6)
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        date: d.getDate(),
        day: dayNames[i],
        month: d.getMonth(),
        fullDate: d
      });
    }
    return days;
  };

  const days = getWeekDays();
  const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {/* Month Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
          {monthName}
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'var(--bg-secondary)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-primary)', cursor: 'pointer'
            }}
            title="Previous week"
          >
            <ChevronLeft size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'var(--bg-secondary)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-primary)', cursor: 'pointer'
            }}
            title="Next week"
          >
            <ChevronRight size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onAddTask}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'var(--planner-purple)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99,102,241,0.35)'
            }}
            title="Add task"
          >
            <Plus size={18} />
          </motion.button>
        </div>
      </div>

      {/* Day Pills */}
      <div className="weekly-calendar-scroll">
        {days.map((d) => {
          const isActive = selectedDate === d.date;
          const isToday = d.date === todayDate && d.month === today.getMonth();
          return (
            <motion.div
              key={`${d.month}-${d.date}`}
              className={`day-pill ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedDate(d.date)}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              style={isToday && !isActive ? { border: '2px solid var(--planner-purple)', position: 'relative' } : {}}
            >
              <span className="day-name">{d.day}</span>
              <span className="day-date">{d.date}</span>
              {isActive && (
                <motion.div
                  layoutId="activeDot"
                  style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }}
                />
              )}
              {isToday && !isActive && (
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--planner-purple)' }} />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Section label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', marginBottom: '0.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>📅 All Schedule</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {selectedDate === todayDate ? 'Today' : `${days.find(d => d.date === selectedDate)?.day || ''} ${selectedDate}`}
        </span>
      </div>
    </div>
  );
}
