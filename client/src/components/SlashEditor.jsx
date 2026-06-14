import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Sparkles, Layers, Link2, Highlighter,
  Scissors, Copy, ClipboardPaste, Minus, AlignLeft, AlignCenter, AlignRight,
  Indent, Outdent
} from "lucide-react";
import "./SlashEditor.css";

// ── Formatting command helper ──────────────────────────────────────────────
const exec = (cmd, value = null) => {
  document.execCommand(cmd, false, value);
};

// ── Floating Toolbar ───────────────────────────────────────────────────────
function FloatingToolbar({ visible, position, editorRef }) {
  const [activeFormats, setActiveFormats] = useState({});

  useEffect(() => {
    const update = () => {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
      });
    };
    document.addEventListener("selectionchange", update);
    return () => document.removeEventListener("selectionchange", update);
  }, []);

  if (!visible) return null;

  const handleAction = (e, fn) => {
    e.preventDefault();
    e.stopPropagation();
    editorRef.current?.focus();
    fn();
  };

  const handleCut = (e) => {
    e.preventDefault();
    const sel = window.getSelection();
    if (sel?.toString()) {
      navigator.clipboard.writeText(sel.toString()).catch(() => {});
      exec("delete");
    }
  };

  const handleCopy = (e) => {
    e.preventDefault();
    const sel = window.getSelection();
    if (sel?.toString()) {
      navigator.clipboard.writeText(sel.toString()).catch(() => {});
    }
  };

  const handleLink = (e) => {
    e.preventDefault();
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url.startsWith("http") ? url : "https://" + url);
  };

  const handleHighlight = (e) => {
    e.preventDefault();
    editorRef.current?.focus();
    exec("hiliteColor", "#fef08a");
  };

  const groups = [
    [
      { icon: <Bold size={13} />, title: "Bold (Ctrl+B)", active: activeFormats.bold, fn: () => exec("bold") },
      { icon: <Italic size={13} />, title: "Italic (Ctrl+I)", active: activeFormats.italic, fn: () => exec("italic") },
      { icon: <Underline size={13} />, title: "Underline (Ctrl+U)", active: activeFormats.underline, fn: () => exec("underline") },
      { icon: <Strikethrough size={13} />, title: "Strikethrough", active: activeFormats.strikeThrough, fn: () => exec("strikeThrough") },
      { icon: <Highlighter size={13} />, title: "Highlight", fn: handleHighlight, special: true },
    ],
    [
      { icon: <Heading1 size={13} />, title: "Heading 1", fn: () => exec("formatBlock", "<h1>") },
      { icon: <Heading2 size={13} />, title: "Heading 2", fn: () => exec("formatBlock", "<h2>") },
      { icon: <Heading3 size={13} />, title: "Heading 3", fn: () => exec("formatBlock", "<h3>") },
    ],
    [
      { icon: <List size={13} />, title: "Bullet list", fn: () => exec("insertUnorderedList") },
      { icon: <ListOrdered size={13} />, title: "Numbered list", fn: () => exec("insertOrderedList") },
      { icon: <CheckSquare size={13} />, title: "Checklist", fn: () => exec("insertHTML", '<input type="checkbox"> ') },
      { icon: <Link2 size={13} />, title: "Insert link", fn: handleLink, special: true },
    ],
    [
      { icon: <Scissors size={13} />, title: "Cut (Ctrl+X)", fn: handleCut, special: true },
      { icon: <Copy size={13} />, title: "Copy (Ctrl+C)", fn: handleCopy, special: true },
      { icon: <ClipboardPaste size={13} />, title: "Paste (Ctrl+V)", fn: async (e) => {
        e.preventDefault();
        try {
          const text = await navigator.clipboard.readText();
          exec("insertText", text);
        } catch { exec("paste"); }
      }, special: true },
    ],
  ];

  return (
    <div
      className="rte-toolbar"
      style={{ top: position.top, left: position.left }}
      onMouseDown={e => e.preventDefault()}
    >
      {groups.map((group, gi) => (
        <div key={gi} className="rte-toolbar-group">
          {group.map((btn, bi) => (
            <button
              key={bi}
              title={btn.title}
              className={`rte-tb-btn ${btn.active ? "active" : ""}`}
              onMouseDown={btn.special ? btn.fn : (e) => handleAction(e, btn.fn)}
            >
              {btn.icon}
            </button>
          ))}
          {gi < groups.length - 1 && <span className="rte-sep" />}
        </div>
      ))}
    </div>
  );
}

// ── Main Editor ────────────────────────────────────────────────────────────
export default function SlashEditor({ initialContent, onChange, onBlur, onSummarize, onFlashcard }) {
  const editorRef = useRef(null);
  const [toolbar, setToolbar] = useState({ visible: false, top: 0, left: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isComposing = useRef(false);
  const lastContent = useRef("");

  const menuItems = [
    { icon: <Heading1 size={16} />, label: "Heading 1", action: () => insertSlashBlock("<h1>") },
    { icon: <Heading2 size={16} />, label: "Heading 2", action: () => insertSlashBlock("<h2>") },
    { icon: <List size={16} />, label: "Bullet List", action: () => insertSlashBlock("ul") },
    { icon: <ListOrdered size={16} />, label: "Numbered List", action: () => insertSlashBlock("ol") },
    { icon: <Minus size={16} />, label: "Divider", action: () => exec("insertHTML", "<hr>") },
    { icon: <CheckSquare size={16} />, label: "To-do Checkbox", action: () => exec("insertHTML", '<div><input type="checkbox"> </div>') },
    { icon: <Sparkles size={16} />, label: "Summarize Page", action: onSummarize },
    { icon: <Layers size={16} />, label: "Generate Flashcards", action: onFlashcard },
  ];

  // ── Mount initial content ───────────────────────────────────────────────
  useEffect(() => {
    if (!editorRef.current) return;
    // Convert plain text to HTML for backward compat
    const html = (initialContent || "").startsWith("<")
      ? initialContent
      : (initialContent || "").replace(/\n/g, "<br>");
    if (editorRef.current.innerHTML !== html) {
      editorRef.current.innerHTML = html;
      lastContent.current = html;
    }
  }, [initialContent]);

  // ── Emit changes ────────────────────────────────────────────────────────
  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    if (html !== lastContent.current) {
      lastContent.current = html;
      onChange?.(html);
    }
  }, [onChange]);

  // ── Selection → show/hide toolbar ───────────────────────────────────────
  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text || !editorRef.current?.contains(sel?.anchorNode)) {
      setToolbar(t => ({ ...t, visible: false }));
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();

    const toolbarWidth = 420;
    let left = rect.left - editorRect.left + rect.width / 2 - toolbarWidth / 2;
    left = Math.max(0, Math.min(left, editorRect.width - toolbarWidth));

    setToolbar({
      visible: true,
      top: rect.top - editorRect.top - 48,
      left,
    });
  }, []);

  const handleMouseDown = useCallback((e) => {
    // Hide toolbar when clicking inside editor (not the toolbar)
    if (!e.target.closest(".rte-toolbar")) {
      setToolbar(t => ({ ...t, visible: false }));
    }
  }, []);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    // Slash menu navigation
    if (showMenu) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(p => Math.min(p + 1, menuItems.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(p => Math.max(p - 1, 0)); return; }
      if (e.key === "Enter") { e.preventDefault(); menuItems[selectedIndex]?.action(); setShowMenu(false); return; }
      if (e.key === "Escape") { setShowMenu(false); return; }
    }

    // Tab = indent
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) exec("outdent"); else exec("indent");
      return;
    }
  }, [showMenu, selectedIndex, menuItems]);

  // ── Input handler — detect "/" for slash menu ────────────────────────────
  const handleInput = useCallback((e) => {
    if (isComposing.current) return;
    emitChange();

    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    const text = node.textContent || "";
    const offset = range.startOffset;
    const charBefore = text[offset - 1];

    if (charBefore === "/" && (offset === 1 || text[offset - 2] === " " || text[offset - 2] === "\n")) {
      // Position menu near caret
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom - editorRect.top + 4, left: rect.left - editorRect.left });
      setShowMenu(true);
      setSelectedIndex(0);
    } else {
      setShowMenu(false);
    }
  }, [emitChange]);

  // ── Slash menu block insertion ────────────────────────────────────────────
  const insertSlashBlock = (tag) => {
    editorRef.current?.focus();
    // Delete the triggering slash first
    exec("delete");
    if (tag === "ul" || tag === "ol") {
      exec(tag === "ul" ? "insertUnorderedList" : "insertOrderedList");
    } else {
      exec("formatBlock", tag);
    }
    setShowMenu(false);
  };

  // ── Paste: strip HTML, keep plain text ───────────────────────────────────
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    exec("insertText", text);
    emitChange();
  }, [emitChange]);

  return (
    <div className="rte-wrapper" onMouseDown={handleMouseDown}>
      {/* Floating toolbar */}
      <FloatingToolbar
        visible={toolbar.visible}
        position={{ top: toolbar.top, left: toolbar.left }}
        editorRef={editorRef}
      />

      {/* Inline static format bar */}
      <div className="rte-static-bar">
        {[
          { icon: <Bold size={14} />, title: "Bold", fn: () => exec("bold") },
          { icon: <Italic size={14} />, title: "Italic", fn: () => exec("italic") },
          { icon: <Underline size={14} />, title: "Underline", fn: () => exec("underline") },
          { icon: <Strikethrough size={14} />, title: "Strikethrough", fn: () => exec("strikeThrough") },
          null, // separator
          { icon: <Heading1 size={14} />, title: "H1", fn: () => exec("formatBlock", "<h1>") },
          { icon: <Heading2 size={14} />, title: "H2", fn: () => exec("formatBlock", "<h2>") },
          null,
          { icon: <List size={14} />, title: "Bullet list", fn: () => exec("insertUnorderedList") },
          { icon: <ListOrdered size={14} />, title: "Numbered list", fn: () => exec("insertOrderedList") },
          null,
          { icon: <AlignLeft size={14} />, title: "Align left", fn: () => exec("justifyLeft") },
          { icon: <AlignCenter size={14} />, title: "Center", fn: () => exec("justifyCenter") },
          { icon: <AlignRight size={14} />, title: "Align right", fn: () => exec("justifyRight") },
          null,
          { icon: <Indent size={14} />, title: "Indent", fn: () => exec("indent") },
          { icon: <Outdent size={14} />, title: "Outdent", fn: () => exec("outdent") },
        ].map((btn, i) =>
          btn === null ? (
            <span key={i} className="rte-sep" />
          ) : (
            <button
              key={i}
              title={btn.title}
              className="rte-tb-btn"
              onMouseDown={(e) => { e.preventDefault(); editorRef.current?.focus(); btn.fn(); }}
            >
              {btn.icon}
            </button>
          )
        )}
      </div>

      {/* ContentEditable editor */}
      <div
        ref={editorRef}
        className="rte-editor"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Start typing, or press '/' for commands..."
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onMouseUp={handleMouseUp}
        onPaste={handlePaste}
        onBlur={() => { emitChange(); onBlur?.(); setToolbar(t => ({ ...t, visible: false })); setShowMenu(false); }}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => { isComposing.current = false; emitChange(); }}
        spellCheck
      />

      {/* Slash command menu */}
      {showMenu && (
        <div className="slash-menu" style={{ top: menuPosition.top, left: menuPosition.left }}>
          <div className="slash-menu-header">Insert block</div>
          {menuItems.map((item, idx) => (
            <div
              key={idx}
              className={`slash-menu-item ${selectedIndex === idx ? "selected" : ""}`}
              onMouseEnter={() => setSelectedIndex(idx)}
              onMouseDown={(e) => { e.preventDefault(); item.action(); setShowMenu(false); }}
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
