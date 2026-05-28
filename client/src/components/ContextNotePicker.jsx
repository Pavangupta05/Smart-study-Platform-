import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileStack, X, Check, FileText, Search, ChevronDown } from "lucide-react";
import { notesService } from "../services/index";
import "./ContextNotePicker.css";

export default function ContextNotePicker({ selectedIds, onChange }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && notes.length === 0) {
      setLoading(true);
      notesService.getAll()
        .then(res => setNotes((res.data.notes || []).filter(n => !n.isTrashed)))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open]);

  const filtered = notes.filter(n => n.name.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    onChange(next);
  };

  const selectedNotes = notes.filter(n => selectedIds.includes(n._id));

  return (
    <div className="cnp-root">
      {/* Pills showing selected notes */}
      {selectedNotes.length > 0 && (
        <div className="cnp-pills">
          {selectedNotes.map(n => (
            <span key={n._id} className="cnp-pill">
              {n.icon || "📄"} {n.name}
              <button onClick={() => toggle(n._id)} className="cnp-pill-remove">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger button */}
      <button className={`cnp-trigger ${open ? "active" : ""} ${selectedIds.length > 0 ? "has-context" : ""}`} onClick={() => setOpen(o => !o)}>
        <FileStack size={14} />
        <span>{selectedIds.length > 0 ? `${selectedIds.length} Note${selectedIds.length > 1 ? "s" : ""} in Context` : "Add Context Notes"}</span>
        <ChevronDown size={12} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            <div className="cnp-backdrop" onClick={() => setOpen(false)} />
            <motion.div
              className="cnp-dropdown"
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <div className="cnp-dropdown-header">
                <span>Select notes as AI context</span>
                {selectedIds.length > 0 && (
                  <button className="cnp-clear" onClick={() => onChange([])}>Clear all</button>
                )}
              </div>
              <div className="cnp-search-row">
                <Search size={13} />
                <input
                  autoFocus
                  placeholder="Search notes..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="cnp-search"
                />
              </div>
              <div className="cnp-list">
                {loading ? (
                  <div className="cnp-loading">Loading notes...</div>
                ) : filtered.length === 0 ? (
                  <div className="cnp-empty">No notes found</div>
                ) : filtered.map(note => {
                  const isSelected = selectedIds.includes(note._id);
                  return (
                    <button
                      key={note._id}
                      className={`cnp-item ${isSelected ? "selected" : ""}`}
                      onClick={() => toggle(note._id)}
                    >
                      <span className="cnp-item-icon">{note.icon || "📄"}</span>
                      <span className="cnp-item-name">{note.name}</span>
                      {isSelected && <Check size={13} className="cnp-check" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
