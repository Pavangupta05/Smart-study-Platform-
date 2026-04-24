import { useState, useRef, useEffect } from "react";
import { Search, Mic, MicOff, Command, X, ListFilter, Zap, Loader2, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import "./GlobalAskAI.css";

function GlobalAskAI() {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const searchInputRef = useRef(null);
  const transcriptRef = useRef("");

  const suggestions = [
    { icon: <Zap size={14} />, text: "Summarize this page" },
    { icon: <Search size={14} />, text: "Explain Quantum Physics" },
    { icon: <Edit3 size={14} />, text: "Help me write a summary" },
  ];

  // 🌀 Unified Spring Transition
  const springTransition = { type: "spring", stiffness: 500, damping: 40, mass: 1 };


  // ⌨️ Ctrl + K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isSearchActive) {
          searchInputRef.current?.focus();
        } else {
          inputRef.current?.focus();
        }
      }
      if (e.key === "Escape") {
        setIsFocused(false);
        setIsSearchActive(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchActive]);

  const handleAskAI = () => {
    if (!input.trim()) return;
    
    if (location.pathname === "/ai") {
      window.dispatchEvent(new CustomEvent("globalAskAI", { detail: input }));
    } else {
      navigate("/ai", { state: { initialMessage: input } });
    }
    
    setInput("");
    setIsFocused(false);
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      console.log("Searching for:", e.target.value);
      // Logic for search navigation or triggering global search modal
      setIsSearchActive(false);
    }
  };

  // 🎙️ Bulletproof Voice Recognition Setup
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join("");
      
      transcriptRef.current = transcript;
      setInput(transcript);
      inputRef.current?.focus();
      setIsFocused(true);
      setShowDropdown(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      
      // Auto-submit when voice finishes
      if (transcriptRef.current.trim()) {
        if (window.location.pathname === "/ai") {
          window.dispatchEvent(new CustomEvent("globalAskAI", { detail: transcriptRef.current }));
        } else {
          navigate("/ai", { state: { initialMessage: transcriptRef.current } });
        }
        setInput("");
        setIsFocused(false);
        transcriptRef.current = ""; // Reset
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    try {
      recognition.start();
      setIsListening(true);
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="notion-floating-wrapper global">
      <motion.div 
        className="notion-ask-ai-group"
        layout
        animate={{ gap: isSearchActive ? "8px" : "12px" }}
        transition={springTransition}
      >
        {/* 1. SEARCH / FULL SEARCH PILL */}
        <motion.div 
          layout
          className={isSearchActive ? "full-search-bar" : "notion-circle-btn search-trigger"}
          animate={{ 
            width: isSearchActive ? (window.innerWidth < 768 ? "calc(100vw - 100px)" : "500px") : "52px" 
          }}
          transition={springTransition}
          onClick={() => !isSearchActive && setIsSearchActive(true)}
        >
          <motion.div 
            layout
            className="search-flex-container"
            animate={{ 
              padding: isSearchActive ? "0 20px" : "0",
              justifyContent: isSearchActive ? "flex-start" : "center"
            }}
            transition={springTransition}
          >
            <motion.div
              layout
              animate={{ 
                width: isSearchActive ? "auto" : "52px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}
              transition={springTransition}
            >
              <Search size={isSearchActive ? 22 : 20} className="search-icon-left" />
            </motion.div>
            
            <AnimatePresence>
              {isSearchActive && (
                <motion.div 
                  className="search-input-wrapper"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.1 }}
                >
                  <input 
                    autoFocus
                    ref={searchInputRef}
                    className="full-search-input"
                    placeholder="Search for anything..."
                    onKeyDown={handleSearch}
                  />
                  <ListFilter size={20} className="filter-icon" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* 2. ASK AI PILL */}
        <AnimatePresence mode="popLayout">
          {!isSearchActive && (
            <motion.div 
              layout
              className={`notion-ask-ai-pill ${isFocused ? "is-focused" : ""}`}
              initial={{ opacity: 0, width: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                width: isFocused ? "var(--search-width-focused, 500px)" : "var(--search-width-initial, 240px)",
                scale: 1 
              }}
              exit={{ opacity: 0, width: 0, scale: 0.9 }}
              transition={springTransition}
            >
              <div className="pill-content">
                <div className="pill-avatar">
                  <div className="ai-face">
                    <div className="eye left"></div>
                    <div className="eye right"></div>
                    <div className="nose"></div>
                  </div>
                </div>
                
                <input
                  ref={inputRef}
                  className="pill-input"
                  placeholder="Ask AI"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => {
                    setIsFocused(true);
                    setShowDropdown(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setIsFocused(false);
                      setShowDropdown(false);
                    }, 200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAskAI();
                    }
                  }}
                />

                {!isFocused && !input && (
                  <div className="pill-kbd">
                    <Command size={10} />
                    <span>K</span>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div 
                    className="pill-dropdown"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="dropdown-section">
                      {suggestions.map((s, idx) => (
                        <div key={idx} className="dropdown-item" onClick={() => {
                          setInput(s.text);
                          // Trigger AI logic
                        }}>
                          {s.icon}
                          <span>{s.text}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. VOICE / CLOSE BUTTON */}
        <motion.div layout transition={springTransition} className="action-button-container">
          <AnimatePresence mode="wait">
            {isSearchActive ? (
              <motion.button 
                layout
                key="close"
                className="notion-circle-btn close"
                initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSearchActive(false);
                }}
              >
                <X size={24} />
              </motion.button>
            ) : (
              <motion.button 
                layout
                key="voice"
                className={`notion-circle-btn voice ${isListening ? 'listening' : ''}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                onClick={toggleVoice}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} strokeWidth={2} />}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default GlobalAskAI;
