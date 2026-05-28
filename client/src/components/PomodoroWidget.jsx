import { Play, Pause, RotateCcw, Headphones } from "lucide-react";
import { useTimer } from "../context/TimerContext";
import "./PomodoroWidget.css";

function PomodoroWidget() {
  const {
    minutes,
    seconds,
    isActive,
    mode,
    toggleTimer,
    resetTimer,
    changeMode,
    soundEnabled,
    setSoundEnabled,
    soundType,
    setSoundType
  } = useTimer();

  const totalTime = mode === "study" ? 25 * 60 : mode === "shortBreak" ? 5 * 60 : 15 * 60;
  const timeLeft = minutes * 60 + seconds;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const formatTime = () => {
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="pomodoro-widget">
      <div className="pomo-header">
        <div className={`pomo-tabs mode-${mode}`}>
          <div className="pomo-tab-indicator" />
          <button className={mode === "study" ? "active" : ""} onClick={() => changeMode("study")}>Focus</button>
          <button className={mode === "shortBreak" ? "active" : ""} onClick={() => changeMode("shortBreak")}>Short Break</button>
          <button className={mode === "longBreak" ? "active" : ""} onClick={() => changeMode("longBreak")}>Long Break</button>
        </div>
        
        <div className="zen-room-controls">
          {soundEnabled && (
            <select 
              className="zen-sound-select" 
              value={soundType} 
              onChange={(e) => setSoundType(e.target.value)}
            >
              <option value="lofi">🎶 Lofi</option>
              <option value="rain">🌧️ Rain</option>
              <option value="cafe">☕ Cafe</option>
            </select>
          )}
          <button className={`btn-lofi ${soundEnabled ? "active" : ""}`} onClick={() => setSoundEnabled(!soundEnabled)}>
            <Headphones size={16} /> {soundEnabled ? "Zen Mode" : "Focus Room"}
          </button>
        </div>
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
          <div className="pomo-time">{formatTime()}</div>
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
