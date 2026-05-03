import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Music, Coffee, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import "./StudyTimer.css";

function StudyTimer() {
  const { socket } = useUser();
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState("study"); // study, shortBreak, longBreak
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  const audioRef = useRef(null);

  // Play ambient rain sound when enabled
  useEffect(() => {
    if (soundEnabled) {
      if (!audioRef.current) {
        audioRef.current = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3");
        audioRef.current.loop = true;
        audioRef.current.volume = 0.4;
      }
      audioRef.current.play().catch(err => {
        console.error("Autoplay prevented:", err);
        setSoundEnabled(false);
      });
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
    
    return () => {
      if (audioRef.current && !soundEnabled) {
        audioRef.current.pause();
      }
    };
  }, [soundEnabled]);
  
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

  const toggleTimer = () => {
    const nextActive = !isActive;
    setIsActive(nextActive);
    if (socket) {
      socket.emit("timer_sync", { isActive: nextActive, minutes, seconds, mode });
    }
  };
  
  const resetTimer = () => {
    setIsActive(false);
    let newMins = 25;
    if (mode === "shortBreak") newMins = 5;
    else if (mode === "longBreak") newMins = 15;
    
    setMinutes(newMins);
    setSeconds(0);
    
    if (socket) {
      socket.emit("timer_sync", { isActive: false, minutes: newMins, seconds: 0, mode });
    }
  };

  const changeMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    let newMins = 25;
    if (newMode === "shortBreak") newMins = 5;
    else if (newMode === "longBreak") newMins = 15;
    
    setMinutes(newMins);
    setSeconds(0);
    
    if (socket) {
      socket.emit("timer_sync", { isActive: false, minutes: newMins, seconds: 0, mode: newMode });
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleSync = (data) => {
      setMinutes(data.minutes);
      setSeconds(data.seconds);
      setIsActive(data.isActive);
      setMode(data.mode);
    };

    socket.on("timer_sync", handleSync);
    return () => socket.off("timer_sync", handleSync);
  }, [socket]);

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
