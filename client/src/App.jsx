import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import AI from "./pages/AI";
import Planner from "./pages/Planner";
import Settings from "./pages/Settings";
import Templates from "./pages/Templates";
import Trash from "./pages/Trash";
import Reader from "./pages/Reader";
import SearchModal from "./components/SearchModal";

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("starNote_theme") || "light");

  useEffect(() => {
    // Apply theme to body
    document.body.className = theme;
    localStorage.setItem("starNote_theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <div className={`app ${theme}`}>
      <Sidebar onOpenSearch={() => setIsSearchOpen(true)} />

      <div className="main">
        <Topbar />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/notes/:category" element={<Notes />} />
          <Route path="/ai" element={<AI />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/trash" element={<Trash />} />
          <Route path="/reader/:id" element={<Reader />} />
        </Routes>
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}

export default App;