import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useUser } from "./UserContext";

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const { socket } = useUser();
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState("study"); // study, shortBreak, longBreak
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isVisible, setIsVisible] = useState(true); // Control visibility of the global floating pill

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

  // Main countdown timer interval
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
          playAlarm();
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const playAlarm = () => {
    try {
      const alarm = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
      alarm.volume = 0.5;
      alarm.play();
    } catch (e) {
      console.error("Failed to play alarm sound:", e);
    }
  };

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

  // Sync with websocket if multiple devices are connected
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
    <TimerContext.Provider value={{
      minutes, setMinutes,
      seconds, setSeconds,
      isActive, setIsActive,
      mode, setMode,
      soundEnabled, setSoundEnabled,
      showControls, setShowControls,
      isVisible, setIsVisible,
      toggleTimer, resetTimer, changeMode
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used inside TimerProvider");
  return ctx;
};
