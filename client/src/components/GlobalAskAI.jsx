import { useState, useRef, useEffect } from "react";
import { Search, Edit3, Command, X, ListFilter, Zap, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import "./GlobalAskAI.css";

function GlobalAskAI() {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const searchInputRef = useRef(null);

  const suggestions = [
    { icon: <Zap size={14} />, text: "Summarize this page" },
    { icon: <Search size={14} />, text: "Explain Quantum Physics" },
    { icon: <Edit3 size={14} />, text: "Help me write a summary" },
  ];

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
    // Navigate to AI page and pass state if needed, or use a global state manager
    // For now, we navigate to /ai
    navigate("/ai", { state: { initialMessage: input } });
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

  return (
    <div className="notion-floating-wrapper global">
      <motion.div 
        className="notion-ask-ai-group"
        animate={{ gap: isSearchActive ? "8px" : "12px" }}
      >
        {/* 1. SEARCH / FULL SEARCH PILL */}
        <motion.div 
          className={isSearchActive ? "full-search-bar" : "notion-circle-btn search-trigger"}
          animate={{ 
            width: isSearchActive ? (window.innerWidth < 768 ? "calc(100vw - 100px)" : "500px") : "52px" 
          }}
          transition={{ type: "spring", stiffness: 600, damping: 38 }}
          onClick={() => !isSearchActive && setIsSearchActive(true)}
        >
          <motion.div 
            className="search-flex-container"
            animate={{ 
              padding: isSearchActive ? "0 20px" : "0",
              justifyContent: isSearchActive ? "flex-start" : "center"
            }}
            transition={{ type: "spring", stiffness: 600, damping: 38 }}
          >
            <motion.div
              animate={{ 
                width: isSearchActive ? "auto" : "52px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}
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
        <AnimatePresence>
          {!isSearchActive && (
            <motion.div 
              className={`notion-ask-ai-pill ${isFocused ? "is-focused" : ""}`}
              initial={{ opacity: 1, width: "240px" }}
              animate={{ 
                opacity: 1, 
                width: isFocused ? "var(--search-width-focused, 500px)" : "var(--search-width-initial, 240px)" 
              }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 38 }}
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

        {/* 3. COMPOSE / CLOSE BUTTON */}
        <div className="action-button-container">
          <AnimatePresence>
            {isSearchActive ? (
              <motion.button 
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
                key="action"
                className="notion-circle-btn action"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                onClick={handleAskAI}
              >
                <Edit3 size={20} strokeWidth={2} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default GlobalAskAI;
