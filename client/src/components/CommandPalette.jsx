import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, FileText, CheckSquare, Layers, MessageSquare, Settings, LayoutDashboard } from "lucide-react";
import "./CommandPalette.css";

function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // CMD/CTRL + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
      }
      
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 50);
    }
  }, [isOpen]);

  const commands = [
    { id: "dash", title: "Go to Dashboard", icon: <LayoutDashboard size={18} />, action: () => navigate("/dashboard") },
    { id: "notes", title: "Search Notes", icon: <FileText size={18} />, action: () => navigate("/notes") },
    { id: "tasks", title: "Study Planner", icon: <CheckSquare size={18} />, action: () => navigate("/planner") },
    { id: "cards", title: "Review Flashcards", icon: <Layers size={18} />, action: () => navigate("/flashcards") },
    { id: "ai", title: "Ask AI Tutor", icon: <MessageSquare size={18} />, action: () => navigate("/ai") },
    { id: "settings", title: "Preferences", icon: <Settings size={18} />, action: () => navigate("/settings") },
  ];

  const filteredCommands = commands.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleNav = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cmd-backdrop" onClick={() => setIsOpen(false)}>
      <motion.div 
        className="cmd-palette"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="cmd-header">
          <Search size={20} className="cmd-icon" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="What do you want to do? (e.g. 'Flashcards')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleNav}
            className="cmd-input"
          />
          <div className="cmd-badge">ESC</div>
        </div>
        
        <div className="cmd-body">
          {filteredCommands.length > 0 ? (
            <div className="cmd-group">
              <div className="cmd-group-label">Suggestions</div>
              {filteredCommands.map((cmd, idx) => (
                <div 
                  key={cmd.id} 
                  className={`cmd-item ${idx === selectedIndex ? 'selected' : ''}`}
                  onClick={() => { cmd.action(); setIsOpen(false); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="cmd-item-left">
                    {cmd.icon}
                    <span>{cmd.title}</span>
                  </div>
                  {idx === selectedIndex && <div className="cmd-enter">Enter</div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="cmd-empty">No results found for "{query}"</div>
          )}
        </div>
        
        <div className="cmd-footer">
          <div className="cmd-hint"><span>↑↓</span> to navigate</div>
          <div className="cmd-hint"><span>↵</span> to select</div>
        </div>
      </motion.div>
    </div>
  );
}

export default CommandPalette;
