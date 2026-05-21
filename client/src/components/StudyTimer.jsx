import { useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Music, Coffee, Brain, GripVertical, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimer } from "../context/TimerContext";
import "./StudyTimer.css";

function StudyTimer() {
  const {
    minutes,
    seconds,
    isActive,
    mode,
    soundEnabled,
    setSoundEnabled,
    showControls,
    setShowControls,
    isVisible,
    setIsVisible,
    toggleTimer,
    resetTimer,
    changeMode
  } = useTimer();

  const containerRef = useRef(null);

  if (!isVisible) return null;

  return (
    <motion.div 
      ref={containerRef}
      drag
      dragMomentum={false}
      dragElastic={0.05}
      dragConstraints={{
        left: -window.innerWidth + 180,
        right: 10,
        top: -window.innerHeight + 180,
        bottom: 80
      }}
      className={`study-timer-floating-wrapper ${isActive ? "timer-active" : ""}`}
    >
      {/* Drag handle area */}
      <div className="timer-pill-drag-handle">
        <GripVertical size={14} className="drag-icon" />
      </div>
      
      {/* Close button to hide timer pill */}
      <div
        className="timer-close-button"
        onClick={() => setIsVisible(false)}
        style={{ position: "absolute", top: 4, right: 4, cursor: "pointer" }}
      >
        <X size={12} />
      </div>
      <div 
        className="timer-pill-clickable"
        onClick={() => setShowControls(!showControls)}
      >
        {mode === "study" ? (
          <Brain size={16} className="mode-icon study" />
        ) : (
          <Coffee size={16} className="mode-icon break" />
        )}
        <span className="time-display">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>

      {/* Dropdown controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            className="timer-controls-card"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            onPointerDown={(e) => e.stopPropagation()} // Stop drag when clicking controls card
          >
            <div className="mode-switcher">
              <button 
                className={mode === "study" ? "active" : ""} 
                onClick={() => changeMode("study")}
              >
                Study
              </button>
              <button 
                className={mode === "shortBreak" ? "active" : ""} 
                onClick={() => changeMode("shortBreak")}
              >
                Short
              </button>
              <button 
                className={mode === "longBreak" ? "active" : ""} 
                onClick={() => changeMode("longBreak")}
              >
                Long
              </button>
            </div>

            <div className="main-controls">
              <button onClick={toggleTimer} className="play-pause">
                {isActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              </button>
              <button onClick={resetTimer} className="reset-btn" title="Reset Timer">
                <RotateCcw size={15} />
              </button>
            </div>

            <div className="soundscapes">
              <div className="sound-header">
                <Music size={11} />
                <span>Focus Sound</span>
              </div>
              <button 
                className={`sound-toggle-btn ${soundEnabled ? "active" : ""}`}
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                <span>Lo-Fi Rain</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default StudyTimer;
