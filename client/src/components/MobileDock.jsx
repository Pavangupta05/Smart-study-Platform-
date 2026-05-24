import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  StickyNote,
  Sparkles,
  Clock3,
  Plus,
  FileText,
  Brain,
  CalendarPlus,
  BookMarked,
} from "lucide-react";
import { notesService } from "../services/index";
import "../styles/mobile-dock.css";

const NAV_ITEMS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/planner", icon: Clock3, label: "Planner" },
  { to: "/notes", icon: StickyNote, label: "Notes" },
  { to: "/ai", icon: Sparkles, label: "AI" },
];

const FAB_ACTIONS = [
  { icon: FileText, label: "New Note", action: "note", color: "#6366f1" },
  { icon: Brain, label: "AI Tutor", action: "ai", color: "#ec4899" },
  { icon: CalendarPlus, label: "Add Event", action: "planner", color: "#f59e0b" },
  { icon: BookMarked, label: "Flashcard", action: "flashcard", color: "#10b981" },
];

const spring = { type: "spring", stiffness: 500, damping: 30 };

export default function MobileDock() {
  const [fabOpen, setFabOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname.startsWith("/reader/")) {
    return null;
  }

  const handleFabAction = async (action) => {
    setFabOpen(false);
    if (action === "note") {
      try {
        const res = await notesService.create({
          name: "Untitled Note",
          size: "0 KB",
          icon: "📄",
          category: "general",
          content: "# New Note\n\nStart typing here...",
        });
        navigate(`/reader/${res.data.note._id}`);
      } catch {
        navigate("/notes");
      }
    } else if (action === "ai") navigate("/ai");
    else if (action === "planner") navigate("/planner");
    else if (action === "flashcard") navigate("/flashcards");
  };

  return (
    <>
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            className="dock-fab-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setFabOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="mobile-dock-v2">
        <div className="dock-pill-wrapper">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `dock-pill-item${isActive ? " active" : ""}`
              }
              onClick={() => setFabOpen(false)}
            >
              {({ isActive }) => (
                <motion.div
                  className="dock-pill-inner"
                  layout
                  transition={spring}
                >
                  {isActive && (
                    <motion.div
                      className="dock-pill-bg"
                      layoutId="dock-active-pill"
                      transition={spring}
                    />
                  )}

                  <motion.div
                    className="dock-pill-icon animated-dock-icon"
                    animate={isActive ? { scale: 1.12 } : { scale: 1 }}
                    transition={spring}
                  >
                    <item.icon
                      size={20}
                      strokeWidth={isActive ? 2.5 : 1.8}
                      className={isActive ? "active-icon" : ""}
                    />
                  </motion.div>

                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        key={`label-${item.to}`}
                        className="dock-pill-label"
                        initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                        animate={{ opacity: 1, width: 48, marginLeft: 6 }}
                        exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                        transition={spring}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>

        <div className="dock-fab-container">
          <AnimatePresence>
            {fabOpen && (
              <motion.div
                className="dock-fab-actions"
                initial={{ opacity: 0, scale: 0.2, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.2, y: 15 }}
                transition={{ type: "spring", damping: 22, stiffness: 350 }}
                style={{ transformOrigin: "bottom right" }}
              >
                {FAB_ACTIONS.map((item) => (
                  <button
                    key={item.action}
                    className={`dock-fab-action-btn dock-fab-action-btn--${item.action}`}
                    style={{ "--action-color": item.color }}
                    onClick={() => handleFabAction(item.action)}
                  >
                    <span className="dock-fab-action-label">{item.label}</span>
                    <div className="dock-fab-action-icon">
                      <item.icon size={20} />
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            className={`dock-fab-btn${fabOpen ? " open" : ""}`}
            onClick={() => setFabOpen((v) => !v)}
            whileTap={{ scale: 0.86 }}
            animate={fabOpen ? { rotate: 45 } : { rotate: 0 }}
            transition={spring}
            aria-label="Quick actions"
          >
            <Plus size={26} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </>
  );
}
