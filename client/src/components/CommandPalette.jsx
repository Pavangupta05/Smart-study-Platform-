import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  FileText,
  CheckSquare,
  Layers,
  Sparkles,
  Settings,
  Trash2,
  BookOpen,
  Plus,
  BrainCircuit,
  Lightbulb,
  PenLine,
  ArrowRight,
  Hash,
} from "lucide-react";
import "./CommandPalette.css";

// ── Command registry ──────────────────────────────────────────────────────────
// Groups make the palette feel like Raycast/Linear: intentional, organized.

function buildCommands(navigate) {
  return [
    // Navigation
    { id: "nav-dash",        group: "Navigate",  label: "Dashboard",            icon: <LayoutDashboard size={16} />,  shortcut: "G D",  action: () => navigate("/") },
    { id: "nav-notes",       group: "Navigate",  label: "Notes",                icon: <FileText size={16} />,         shortcut: "G N",  action: () => navigate("/notes") },
    { id: "nav-ai",          group: "Navigate",  label: "AI Workspace",         icon: <Sparkles size={16} />,         shortcut: "G A",  action: () => navigate("/ai") },
    { id: "nav-flashcards",  group: "Navigate",  label: "Flashcards",           icon: <Layers size={16} />,           shortcut: "G F",  action: () => navigate("/flashcards") },
    { id: "nav-planner",     group: "Navigate",  label: "Study Planner",        icon: <CheckSquare size={16} />,      shortcut: "G P",  action: () => navigate("/planner") },
    { id: "nav-reader",      group: "Navigate",  label: "Reader",               icon: <BookOpen size={16} />,         shortcut: "",     action: () => navigate("/notes") },
    { id: "nav-settings",    group: "Navigate",  label: "Settings",             icon: <Settings size={16} />,         shortcut: "G S",  action: () => navigate("/settings") },
    { id: "nav-trash",       group: "Navigate",  label: "Trash",                icon: <Trash2 size={16} />,           shortcut: "",     action: () => navigate("/trash") },

    // Create actions
    { id: "create-note",     group: "Create",    label: "New Note",             icon: <Plus size={16} />,             shortcut: "C N",  action: () => navigate("/notes") },
    { id: "create-deck",     group: "Create",    label: "New Flashcard Deck",   icon: <Plus size={16} />,             shortcut: "C F",  action: () => navigate("/flashcards") },
    { id: "create-task",     group: "Create",    label: "New Planner Task",     icon: <Plus size={16} />,             shortcut: "C T",  action: () => navigate("/planner") },

    // AI Actions
    { id: "ai-ask",          group: "AI",        label: "Ask AI anything",      icon: <BrainCircuit size={16} />,     shortcut: "",     action: () => navigate("/ai") },
    { id: "ai-summarize",    group: "AI",        label: "Summarize my notes",   icon: <Lightbulb size={16} />,        shortcut: "",     action: (q) => { navigate("/ai", { state: { initialMessage: `Summarize the key concepts I should know about: ${q || "my current notes"}` } }); } },
    { id: "ai-explain",      group: "AI",        label: "Explain a concept",    icon: <Lightbulb size={16} />,        shortcut: "",     action: (q) => { navigate("/ai", { state: { initialMessage: `Explain this concept clearly: ${q || ""}` } }); } },
    { id: "ai-quiz",         group: "AI",        label: "Generate a quiz",      icon: <PenLine size={16} />,          shortcut: "",     action: (q) => { navigate("/ai", { state: { initialMessage: `Generate a quiz on: ${q || "the topic I am studying"}` } }); } },
    { id: "ai-flashcards",   group: "AI",        label: "Generate flashcards",  icon: <Layers size={16} />,           shortcut: "",     action: (q) => { navigate("/flashcards"); } },
  ];
}

// Group commands and filter by query
function filterAndGroup(commands, query) {
  const q = query.toLowerCase().trim();
  const filtered = q
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.group.toLowerCase().includes(q)
      )
    : commands;

  const groups = {};
  filtered.forEach((cmd) => {
    if (!groups[cmd.group]) groups[cmd.group] = [];
    groups[cmd.group].push(cmd);
  });
  return groups;
}

// Flatten grouped for keyboard nav
function flatten(groups) {
  return Object.values(groups).flat();
}

// ── Component ─────────────────────────────────────────────────────────────────
function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const commands = buildCommands(navigate);

  // Ctrl/Cmd + K toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 40);
  }, [isOpen]);

  const groupedCommands = filterAndGroup(commands, query);
  const flatList = flatten(groupedCommands);

  // Reset selection when query changes
  useEffect(() => setSelectedIndex(0), [query]);

  const execute = useCallback(
    (cmd) => {
      cmd.action(query);
      setIsOpen(false);
      setQuery("");
    },
    [query]
  );

  const handleKeyNav = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatList[selectedIndex]) execute(flatList[selectedIndex]);
    }
  };

  // Build flat index map for keyboard selection across groups
  let globalIdx = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="cmd-backdrop" onClick={() => setIsOpen(false)}>
          <motion.div
            className="cmd-palette"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.97, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -16 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
          >
            {/* Search bar */}
            <div className="cmd-header">
              <Search size={16} className="cmd-search-icon" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search, navigate, or ask AI..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyNav}
                className="cmd-input"
                spellCheck={false}
                autoComplete="off"
              />
              <kbd className="cmd-badge">ESC</kbd>
            </div>

            {/* Results */}
            <div className="cmd-body">
              {flatList.length === 0 ? (
                <div className="cmd-empty">
                  <Hash size={32} strokeWidth={1.5} />
                  <p>No results for "<strong>{query}</strong>"</p>
                  <span>Try "notes", "AI", "quiz", or "summarize"</span>
                </div>
              ) : (
                Object.entries(groupedCommands).map(([groupName, groupCmds]) => (
                  <div className="cmd-group" key={groupName}>
                    <div className="cmd-group-label">{groupName}</div>
                    {groupCmds.map((cmd) => {
                      const currentIdx = globalIdx++;
                      const isSelected = currentIdx === selectedIndex;
                      return (
                        <div
                          key={cmd.id}
                          className={`cmd-item ${isSelected ? "selected" : ""}`}
                          onClick={() => execute(cmd)}
                          onMouseEnter={() => setSelectedIndex(currentIdx)}
                        >
                          <div className="cmd-item-left">
                            <span className="cmd-item-icon">{cmd.icon}</span>
                            <span className="cmd-item-label">{cmd.label}</span>
                          </div>
                          <div className="cmd-item-right">
                            {cmd.shortcut && (
                              <span className="cmd-shortcut">{cmd.shortcut}</span>
                            )}
                            {isSelected && <ArrowRight size={14} className="cmd-enter-icon" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="cmd-footer">
              <div className="cmd-hint"><kbd>↑↓</kbd> navigate</div>
              <div className="cmd-hint"><kbd>↵</kbd> select</div>
              <div className="cmd-hint"><kbd>Esc</kbd> close</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
