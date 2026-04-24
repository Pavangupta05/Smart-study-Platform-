import { useState, useEffect } from "react";
import { Search, FileText, Clock, X, Command } from "lucide-react";
import "./SearchModal.css";

function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.trim()) {
      setIsSearching(true);
      const timer = setTimeout(() => setIsSearching(false), 400);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [query]);

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
    { title: "Project Draft", type: "Page", date: "5h ago" },
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
            <div className="group-label">{query ? "Search Results" : "Recent"}</div>
            {isSearching ? (
              [1, 2, 3].map((i) => (
                <div key={`skel-${i}`} className="search-item skeleton">
                  <div className="skeleton-icon-small" style={{ width: 16, height: 16, borderRadius: 4, marginRight: 12 }}></div>
                  <div className="skeleton-text" style={{ width: '60%', height: 12, borderRadius: 6 }}></div>
                </div>
              ))
            ) : query && recent.filter(r => r.title.toLowerCase().includes(query.toLowerCase())).length === 0 ? (
               <div className="no-results">No results for "{query}"</div>
            ) : (
              (query ? recent.filter(r => r.title.toLowerCase().includes(query.toLowerCase())) : recent).map((item, i) => (
                <div key={i} className="search-item" onClick={onClose}>
                  <div className="item-left">
                    {item.type === "Note" ? <FileText size={16} /> : <Command size={16} />}
                    <span className="item-title">{item.title}</span>
                  </div>
                  <span className="item-meta">{item.date}</span>
                </div>
              ))
            )}
          </div>

          {query && !isSearching && (
            <div className="results-group">
              <div className="group-label">Inside Files (Deep Search)</div>
              <div className="search-item" onClick={onClose}>
                <div className="item-left">
                  <Sparkles size={16} className="deep-search-icon" />
                  <span className="item-title">Find "{query}" in all notes...</span>
                </div>
                <span className="item-meta">AI Powered</span>
              </div>
            </div>
          )}

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
