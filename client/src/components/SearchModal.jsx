import { useState, useEffect, useRef } from "react";
import { Search, FileText, Command as CmdIcon, ArrowRight, Sun, Moon, Clock, Plus, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./SearchModal.css";

function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Commands available in the palette
  const commands = [
    { id: "c1", icon: <Sun size={16} />, title: "Toggle Light Theme", action: () => { document.body.classList.remove("dark"); localStorage.setItem("starNote_theme", "light"); } },
    { id: "c2", icon: <Moon size={16} />, title: "Toggle Dark Theme", action: () => { document.body.classList.add("dark"); localStorage.setItem("starNote_theme", "dark"); } },
    { id: "c3", icon: <Plus size={16} />, title: "Create New Note", action: () => navigate("/notes") },
    { id: "c4", icon: <Clock size={16} />, title: "Open Study Planner", action: () => navigate("/planner") },
    { id: "c5", icon: <Zap size={16} />, title: "Start 25m Pomodoro", action: () => { alert("Timer feature coming soon!"); } },
  ];

  // Dummy recent files
  const recentFiles = [
    { id: "f1", icon: <FileText size={16} />, title: "Calculus Chapter 4", type: "Note" },
    { id: "f2", icon: <FileText size={16} />, title: "Project Draft", type: "Page" },
  ];

  // Filter logic
  let filteredResults = [];
  if (query.startsWith("/")) {
    const term = query.slice(1).toLowerCase();
    filteredResults = commands.filter(c => c.title.toLowerCase().includes(term));
  } else if (query) {
    const term = query.toLowerCase();
    const matchesFiles = recentFiles.filter(f => f.title.toLowerCase().includes(term));
    const matchesCmds = commands.filter(c => c.title.toLowerCase().includes(term));
    filteredResults = [...matchesFiles, ...matchesCmds];
  } else {
    filteredResults = [...recentFiles, ...commands];
  }

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleGlobalKey = (e) => {
      // Cmd+K or Ctrl+K to toggle
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Since toggle is usually handled by parent, if closed we let parent open it, if open we close it.
        if (isOpen) onClose(); 
      }
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          const item = filteredResults[selectedIndex];
          if (item.action) {
            item.action();
            onClose();
            setQuery("");
          } else {
            // It's a file
            onClose();
            setQuery("");
          }
        }
      }
    };
    
    window.addEventListener("keydown", handleGlobalKey);
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";

    return () => {
      window.removeEventListener("keydown", handleGlobalKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, filteredResults, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="cmd-palette-overlay" onClick={onClose}>
      <div className="cmd-palette" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-header">
          <Search size={20} className="cmd-search-icon" />
          <input 
            ref={inputRef}
            className="cmd-input"
            placeholder="Type a command or search... (Try '/')" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="cmd-badge">ESC</div>
        </div>

        <div className="cmd-body">
          {filteredResults.length === 0 ? (
            <div className="cmd-no-results">No results found for "{query}"</div>
          ) : (
            <div className="cmd-list">
              {filteredResults.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`cmd-item ${selectedIndex === index ? "selected" : ""}`}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    if (item.action) item.action();
                    onClose();
                  }}
                >
                  <div className="cmd-item-left">
                    <div className="cmd-item-icon">{item.icon}</div>
                    <span className="cmd-item-title">{item.title}</span>
                  </div>
                  {item.action && (
                    <span className="cmd-item-hint">Command</span>
                  )}
                  {selectedIndex === index && (
                    <ArrowRight size={16} className="cmd-item-arrow" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cmd-footer">
          <div className="cmd-shortcuts">
            <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
            <span><kbd>↵</kbd> to select</span>
            <span><kbd>/</kbd> for commands</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchModal;
