import { Search, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import "../styles/topbar.css";

function Topbar() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.body.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="topbar">
      <div className="search-box">
        <Search size={16} />
        <input placeholder="Search documents..." />
      </div>

      <div className="actions">
        <button
          onClick={() => {
            setDark(!dark);
            localStorage.setItem("theme", !dark ? "dark" : "light");
          }}
          className="theme-btn"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="avatar">P</div>
      </div>
    </div>
  );
}

export default Topbar;