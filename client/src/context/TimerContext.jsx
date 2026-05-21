import React, { createContext, useContext, useEffect, useRef, useReducer, useMemo, useCallback, memo } from "react";
import { useUser } from "./UserContext";

const TimerContext = createContext(null);

const initialState = {
  minutes: 25,
  seconds: 0,
  isActive: false,
  mode: "study", // study | shortBreak | longBreak
  soundEnabled: false,
  showControls: false,
  isVisible: false,
};

function timerReducer(state, action) {
  switch (action.type) {
    case "SET_MINUTES":
      return { ...state, minutes: action.payload };
    case "SET_SECONDS":
      return { ...state, seconds: action.payload };
    case "SET_ACTIVE":
      return { ...state, isActive: action.payload };
    case "SET_MODE":
      return { ...state, mode: action.payload };
    case "SET_SOUND":
      return { ...state, soundEnabled: action.payload };
    case "SET_SHOW_CONTROLS":
      return { ...state, showControls: action.payload };
    case "SET_VISIBLE":
      return { ...state, isVisible: action.payload };
    case "RESET":
      return { ...initialState, minutes: action.payload };
    default:
      return state;
  }
}

// -----------------------------------------------------------------------------
// Provider component (memoized for performance)
// -----------------------------------------------------------------------------
export const TimerProvider = React.memo(function TimerProvider({ children }) {
  const { socket } = useUser();
  const [state, dispatch] = useReducer(timerReducer, initialState);
  const audioRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Helper – play alarm (hoisted above effects for safety)
  // ---------------------------------------------------------------------------
  const playAlarm = () => {
    try {
      const alarm = new Audio(
        "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg"
      );
      alarm.volume = 0.5;
      alarm.play();
    } catch (e) {
      console.error("Failed to play alarm sound:", e);
    }
  };

  // ---------------------------------------------------------------------------
  // Ambient rain sound (controlled by soundEnabled flag)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (state.soundEnabled) {
      if (!audioRef.current) {
        audioRef.current = new Audio(
          "https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3"
        );
        audioRef.current.loop = true;
        audioRef.current.volume = 0.4;
      }
      audioRef.current.play().catch(err => {
        console.error("Autoplay prevented:", err);
        dispatch({ type: "SET_SOUND", payload: false });
      });
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
    return () => {
      if (audioRef.current && !state.soundEnabled) {
        audioRef.current.pause();
      }
    };
  }, [state.soundEnabled]);

  // ---------------------------------------------------------------------------
  // Countdown timer logic
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let interval = null;
    if (state.isActive) {
      interval = setInterval(() => {
        if (state.seconds > 0) {
          dispatch({ type: "SET_SECONDS", payload: state.seconds - 1 });
        } else if (state.minutes > 0) {
          dispatch({ type: "SET_MINUTES", payload: state.minutes - 1 });
          dispatch({ type: "SET_SECONDS", payload: 59 });
        } else {
          dispatch({ type: "SET_ACTIVE", payload: false });
          playAlarm();
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [state.isActive, state.seconds, state.minutes]);

  // ---------------------------------------------------------------------------
  // Auto‑show timer when it becomes active
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (state.isActive) {
      dispatch({ type: "SET_VISIBLE", payload: true });
    }
  }, [state.isActive]);

  // ---------------------------------------------------------------------------
  // Socket sync – broadcast local changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (socket) {
      socket.emit("timer_sync", {
        isActive: state.isActive,
        minutes: state.minutes,
        seconds: state.seconds,
        mode: state.mode,
      });
    }
  }, [state.isActive, state.minutes, state.seconds, state.mode, socket]);

  // ---------------------------------------------------------------------------
  // Actions exposed to consumers
  // ---------------------------------------------------------------------------
  const toggleTimer = () => {
    dispatch({ type: "SET_ACTIVE", payload: !state.isActive });
  };

  const resetTimer = () => {
    const base = state.mode === "shortBreak" ? 5 : state.mode === "longBreak" ? 15 : 25;
    dispatch({ type: "RESET", payload: base });
    if (socket) {
      socket.emit("timer_sync", {
        isActive: false,
        minutes: base,
        seconds: 0,
        mode: state.mode,
      });
    }
  };

  const changeMode = newMode => {
    dispatch({ type: "SET_MODE", payload: newMode });
    dispatch({ type: "SET_ACTIVE", payload: false });
    const base = newMode === "shortBreak" ? 5 : newMode === "longBreak" ? 15 : 25;
    dispatch({ type: "RESET", payload: base });
    if (socket) {
      socket.emit("timer_sync", {
        isActive: false,
        minutes: base,
        seconds: 0,
        mode: newMode,
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Receive remote sync updates (if multiple devices are connected)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!socket) return;
    const handleSync = data => {
      dispatch({ type: "SET_MINUTES", payload: data.minutes });
      dispatch({ type: "SET_SECONDS", payload: data.seconds });
      dispatch({ type: "SET_ACTIVE", payload: data.isActive });
      dispatch({ type: "SET_MODE", payload: data.mode });
    };
    socket.on("timer_sync", handleSync);
    return () => socket.off("timer_sync", handleSync);
  }, [socket]);

  // ---------------------------------------------------------------------------
  // Context value – memoized to avoid unnecessary re‑renders
  // ---------------------------------------------------------------------------
  const contextValue = React.useMemo(
    () => ({
      minutes: state.minutes,
      seconds: state.seconds,
      isActive: state.isActive,
      mode: state.mode,
      soundEnabled: state.soundEnabled,
      showControls: state.showControls,
      isVisible: state.isVisible,
      setSoundEnabled: enabled =>
        dispatch({ type: "SET_SOUND", payload: enabled }),
      setShowControls: flag =>
        dispatch({ type: "SET_SHOW_CONTROLS", payload: flag }),
      setIsVisible: flag =>
        dispatch({ type: "SET_VISIBLE", payload: flag }),
      toggleTimer,
      resetTimer,
      changeMode,
    }),
    [state]
  );

  return (
    <TimerContext.Provider value={contextValue}>{children}</TimerContext.Provider>
  );
});

export const useTimer = () => {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used inside TimerProvider");
  return ctx;
};
