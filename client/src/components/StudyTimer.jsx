import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Music, Coffee, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "./StudyTimer.css";

function StudyTimer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState("study"); // study, shortBreak, longBreak
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  const audioRef = useRef(null);

  // Soundscapes (using royalty-free noise or browser generated)
  // For now, we'll use a placeholder or simulated ambient noise
  
  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          setIsActive(false);
          // Alert user (notification or sound)
          playAlarm();
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    if (mode === "study") setMinutes(25);
    else if (mode === "shortBreak") setMinutes(5);
    else setMinutes(15);
    setSeconds(0);
  };

  const playAlarm = () => {
    // Simple notification sound logic
  };

  const changeMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    if (newMode === "study") setMinutes(25);
    else if (newMode === "shortBreak") setMinutes(5);
    else setMinutes(15);
    setSeconds(0);
  };

  return (
    <div className="study-timer-wrapper">
      <motion.div 
        className={`timer-pill ${isActive ? "active" : ""}`}
        onClick={() => setShowControls(!showControls)}
        whileHover={{ scale: 1.02 }}
      >
        {mode === "study" ? <Brain size={16} /> : <Coffee size={16} />}
        <span className="time-display">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </motion.div>

      <AnimatePresence>
        {showControls && (
          <motion.div 
            className="timer-controls-card"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
          >
            <div className="mode-switcher">
              <button className={mode === "study" ? "active" : ""} onClick={() => changeMode("study")}>Study</button>
              <button className={mode === "shortBreak" ? "active" : ""} onClick={() => changeMode("shortBreak")}>Short Break</button>
            </div>

            <div className="main-controls">
              <button onClick={toggleTimer} className="play-pause">
                {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>
              <button onClick={resetTimer} className="reset">
                <RotateCcw size={18} />
              </button>
            </div>

            <div className="soundscapes">
              <div className="sound-header">
                <Music size={14} />
                <span>Ambient Sound</span>
              </div>
              <div className="sound-options">
                <button 
                  className={soundEnabled ? "active" : ""} 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <span>Lo-Fi Rain</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StudyTimer;
