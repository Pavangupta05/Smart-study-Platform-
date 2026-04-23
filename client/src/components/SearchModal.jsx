import { useState, useEffect } from "react";
import { Search, FileText, Clock, X, Command } from "lucide-react";
import "./SearchModal.css";

function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const recent = [
    { title: "Calculus Chapter 4", type: "Note", date: "2h ago" },
    { title: "Thesis Draft", type: "Page", date: "5h ago" },
    { title: "Physics Notes", type: "Note", date: "Yesterday" },
  ];

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input 
            autoFocus 
            placeholder="Search or jump to..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="search-shortcut">ESC</div>
        </div>

        <div className="search-results">
          <div className="results-group">
            <div className="group-label">Recent</div>
            {recent.map((item, i) => (
              <div key={i} className="search-item" onClick={onClose}>
                <div className="item-left">
                  {item.type === "Note" ? <FileText size={16} /> : <Command size={16} />}
                  <span className="item-title">{item.title}</span>
                </div>
                <span className="item-meta">{item.date}</span>
              </div>
            ))}
          </div>

          <div className="search-footer">
            <div className="footer-tip">
              <span>Tip:</span> Use arrow keys to navigate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchModal;
