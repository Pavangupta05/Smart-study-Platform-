import { useState, useRef, useEffect } from "react";
import { Heading1, CheckSquare, Sparkles, Layers } from "lucide-react";
import "./SlashEditor.css";

export default function SlashEditor({ initialContent, onChange, onBlur, onSummarize, onFlashcard }) {
  const [content, setContent] = useState(initialContent || "");
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef(null);

  const menuItems = [
    { icon: <Heading1 size={16} />, label: "Heading 1", action: () => insertText("# ") },
    { icon: <CheckSquare size={16} />, label: "To-do list", action: () => insertText("- [ ] ") },
    { icon: <Sparkles size={16} />, label: "Summarize Page", action: onSummarize },
    { icon: <Layers size={16} />, label: "Generate Flashcards", action: onFlashcard },
  ];

  useEffect(() => {
    setContent(initialContent || "");
  }, [initialContent]);

  const insertText = (prefix) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    
    // Find the position of the slash that triggered the menu
    const textBeforeCursor = content.substring(0, start);
    const slashIndex = textBeforeCursor.lastIndexOf("/");
    
    if (slashIndex !== -1) {
      const newText = content.substring(0, slashIndex) + prefix + content.substring(start);
      setContent(newText);
      onChange(newText);
      
      // Reset cursor position
      setTimeout(() => {
        el.selectionStart = el.selectionEnd = slashIndex + prefix.length;
        el.focus();
      }, 0);
    }
    setShowMenu(false);
  };

  const getCaretCoordinates = () => {
    if (!textareaRef.current) return { top: 0, left: 0 };
    const el = textareaRef.current;
    const start = el.selectionStart;
    
    // Estimate line and column index of the caret
    const textBeforeCursor = el.value.substring(0, start);
    const lines = textBeforeCursor.split("\n");
    const lineCount = lines.length;
    
    // Line height is ~24px, offset top accordingly and adjust for scroll position
    const top = Math.min(el.clientHeight - 130, Math.max(20, lineCount * 24 - el.scrollTop + 10));
    
    // Horizontal character width is ~7.5px, offset left accordingly
    const lastLineLength = lines[lines.length - 1].length;
    const left = Math.min(el.clientWidth - 160, Math.max(20, lastLineLength * 7.5 + 15));
    
    return { top, left };
  };

  const handleKeyDown = (e) => {
    if (showMenu) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev < menuItems.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        menuItems[selectedIndex].action();
      } else if (e.key === "Escape") {
        setShowMenu(false);
      }
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);
    onChange(val);

    const start = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, start);
    
    // Check if the user just typed a slash at the start of a line or after space
    const match = textBeforeCursor.match(/(^|\s)\/$/);
    
    if (match) {
      const { top, left } = getCaretCoordinates();
      setMenuPosition({ top, left });
      setShowMenu(true);
      setSelectedIndex(0);
    } else {
      setShowMenu(false);
    }
  };

  return (
    <div className="slash-editor-wrapper">
      <textarea
        ref={textareaRef}
        className="slash-textarea"
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        placeholder="Start typing or press '/' for commands..."
      />
      {showMenu && (
        <div className="slash-menu" style={{ top: menuPosition.top, left: menuPosition.left }}>
          <div className="slash-menu-header">Basic blocks</div>
          {menuItems.map((item, idx) => (
            <div 
              key={idx} 
              className={`slash-menu-item ${selectedIndex === idx ? "selected" : ""}`}
              onMouseEnter={() => setSelectedIndex(idx)}
              onClick={() => item.action()}
            >
              <div className="slash-menu-icon">{item.icon}</div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
