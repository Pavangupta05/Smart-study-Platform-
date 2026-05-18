import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, Headphones } from "lucide-react";
import "./PomodoroWidget.css";

function PomodoroWidget() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState("focus"); // focus, shortBreak, longBreak

  const modes = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  };

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      // Play a simple notification beep
      try {
        const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
        audio.play().catch(e => console.log("Audio play blocked by browser:", e));
      } catch(err) {
        console.error("Audio error", err);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(modes[mode]);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(modes[newMode]);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress = ((modes[mode] - timeLeft) / modes[mode]) * 100;

  return (
    <div className="pomodoro-widget">
      <div className="pomo-header">
        <div className="pomo-tabs">
          <button className={mode === "focus" ? "active" : ""} onClick={() => switchMode("focus")}>Focus</button>
          <button className={mode === "shortBreak" ? "active" : ""} onClick={() => switchMode("shortBreak")}>Short Break</button>
          <button className={mode === "longBreak" ? "active" : ""} onClick={() => switchMode("longBreak")}>Long Break</button>
        </div>
        <button className="btn-lofi">
          <Headphones size={16} /> Lofi
        </button>
      </div>

      <div className="pomo-body">
        <div className="pomo-circle">
          <svg viewBox="0 0 100 100" className="pomo-svg">
            <circle cx="50" cy="50" r="45" className="pomo-bg" />
            <circle 
              cx="50" cy="50" r="45" 
              className="pomo-progress"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * progress) / 100}
            />
          </svg>
          <div className="pomo-time">{formatTime(timeLeft)}</div>
        </div>

        <div className="pomo-controls">
          <button className="pomo-btn-main" onClick={toggleTimer}>
            {isActive ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button className="pomo-btn-sub" onClick={resetTimer}>
            <RotateCcw size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PomodoroWidget;
