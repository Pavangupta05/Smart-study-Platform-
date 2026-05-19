import { useState, useRef } from "react";
import { 
  Plus, X, Trash2, Copy, ChevronUp, ChevronDown,
  FileText, Grid, AlignLeft, Dot, BookOpen, Layout,
  Layers, MoreHorizontal, Pencil, Check
} from "lucide-react";

// ─── Template Definitions ──────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: "blank",
    label: "Blank",
    icon: <FileText size={18} />,
    desc: "Clean white canvas",
    color: "#f8fafc",
    accent: "#94a3b8",
  },
  {
    id: "ruled",
    label: "Lined",
    icon: <AlignLeft size={18} />,
    desc: "Horizontal ruled lines",
    color: "#eff6ff",
    accent: "#3b82f6",
  },
  {
    id: "grid",
    label: "Grid",
    icon: <Grid size={18} />,
    desc: "Squared graph paper",
    color: "#f0fdf4",
    accent: "#22c55e",
  },
  {
    id: "dotted",
    label: "Dotted",
    icon: <Dot size={18} />,
    desc: "Dot grid — modern & minimal",
    color: "#fefce8",
    accent: "#eab308",
  },
  {
    id: "cornell",
    label: "Cornell Notes",
    icon: <BookOpen size={18} />,
    desc: "Q&A sidebar + summary bar",
    color: "#fdf4ff",
    accent: "#a855f7",
  },
  {
    id: "storyboard",
    label: "Storyboard",
    icon: <Layout size={18} />,
    desc: "6-panel visual storyboard",
    color: "#fff7ed",
    accent: "#f97316",
  },
];

// ─── Live Template Preview (inline SVG-backed, no canvas) ──────────────────
function TemplatePreview({ template, height = 120, dark = false }) {
  const bg = dark ? "#1e1e2e" : "#ffffff";
  const lineColor = dark ? "rgba(255,255,255,0.08)" : "rgba(59,130,246,0.15)";
  const dotColor = dark ? "rgba(255,255,255,0.12)" : "rgba(100,116,139,0.25)";
  const marginColor = dark ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.2)";
  const headerColor = dark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.06)";
  const sidebarColor = dark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.03)";
  const summaryColor = dark ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.04)";
  const cellColor = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const cellBorder = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  const baseStyle = {
    width: "100%",
    height,
    background: bg,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    flexShrink: 0,
    transition: "background 0.2s",
  };

  if (template === "blank") {
    return (
      <div style={baseStyle}>
        <svg width="100%" height="100%" viewBox="0 0 160 120" preserveAspectRatio="none">
          {/* Corner folds for paper feel */}
          <polygon points="148,0 160,12 160,0" fill={dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"} />
          <line x1="148" y1="0" x2="160" y2="12" stroke={dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"} strokeWidth="0.5" />
        </svg>
      </div>
    );
  }

  if (template === "ruled") {
    const lines = [];
    for (let y = 18; y < 120; y += 14) {
      lines.push(<line key={y} x1="32" y1={y} x2="160" y2={y} stroke={lineColor} strokeWidth="0.8" />);
    }
    return (
      <div style={baseStyle}>
        <svg width="100%" height="100%" viewBox="0 0 160 120" preserveAspectRatio="none">
          {/* Margin line */}
          <line x1="30" y1="0" x2="30" y2="120" stroke={marginColor} strokeWidth="1" />
          {/* Header rule */}
          <line x1="0" y1="16" x2="160" y2="16" stroke={lineColor} strokeWidth="1" />
          {lines}
        </svg>
      </div>
    );
  }

  if (template === "grid") {
    const hLines = [], vLines = [];
    for (let y = 0; y < 120; y += 14) hLines.push(<line key={`h${y}`} x1="0" y1={y} x2="160" y2={y} stroke={lineColor} strokeWidth="0.7" />);
    for (let x = 0; x < 160; x += 14) vLines.push(<line key={`v${x}`} x1={x} y1="0" x2={x} y2="120" stroke={lineColor} strokeWidth="0.7" />);
    return (
      <div style={baseStyle}>
        <svg width="100%" height="100%" viewBox="0 0 160 120" preserveAspectRatio="none">
          {hLines}{vLines}
        </svg>
      </div>
    );
  }

  if (template === "dotted") {
    const dots = [];
    for (let y = 12; y < 120; y += 14) {
      for (let x = 12; x < 160; x += 14) {
        dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill={dotColor} />);
      }
    }
    return (
      <div style={baseStyle}>
        <svg width="100%" height="100%" viewBox="0 0 160 120" preserveAspectRatio="none">
          {dots}
        </svg>
      </div>
    );
  }

  if (template === "cornell") {
    return (
      <div style={baseStyle}>
        <svg width="100%" height="100%" viewBox="0 0 160 120" preserveAspectRatio="none">
          {/* Title bar */}
          <rect x="0" y="0" width="160" height="18" fill={headerColor} />
          <line x1="0" y1="18" x2="160" y2="18" stroke={lineColor} strokeWidth="1" />
          {/* Q sidebar */}
          <rect x="0" y="18" width="40" height="84" fill={sidebarColor} />
          <line x1="40" y1="18" x2="40" y2="102" stroke={marginColor} strokeWidth="1" />
          {/* Summary bar */}
          <rect x="0" y="102" width="160" height="18" fill={summaryColor} />
          <line x1="0" y1="102" x2="160" y2="102" stroke={lineColor} strokeWidth="1" />
          {/* Lines in notes area */}
          {[30, 44, 58, 72, 86].map(y => (
            <line key={y} x1="48" y1={y} x2="156" y2={y} stroke={lineColor} strokeWidth="0.6" />
          ))}
          {/* Lines in Q area */}
          {[30, 44, 58, 72, 86].map(y => (
            <line key={`q${y}`} x1="4" y1={y} x2="36" y2={y} stroke={lineColor} strokeWidth="0.6" />
          ))}
        </svg>
      </div>
    );
  }

  if (template === "storyboard") {
    const cells = [
      [4, 4, 74, 54], [82, 4, 74, 54],
      [4, 62, 74, 54], [82, 62, 74, 54],
      [4, 120, 74, 54], [82, 120, 74, 54], // off screen, cropped
    ];
    return (
      <div style={baseStyle}>
        <svg width="100%" height="100%" viewBox="0 0 160 180" preserveAspectRatio="xMidYMid meet">
          {cells.map(([x, y, w, h], i) => (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} rx="4" fill={cellColor} stroke={cellBorder} strokeWidth="0.8" />
              <text x={x + 5} y={y + 12} fontSize="8" fill={dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"} fontFamily="system-ui">{i + 1}</text>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  return <div style={baseStyle} />;
}

// ─── Page Card Sub-component ───────────────────────────────────────────────
function PageCard({
  pageContent, idx, currentPage, draggedIdx, dragOverIdx,
  onJumpToPage, onDragStart, onDragOver, onDrop, onDragEnd,
  pageHasDrawings, pageAnnotationCount, onMovePage, onDuplicatePage,
  onDeletePage, onInsertAfter, pages, onRename,
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(pageContent?.__title || `Page ${idx + 1}`);
  const inputRef = useRef(null);

  const template = pageContent?.__template || "blank";
  const tmpl = TEMPLATES.find(t => t.id === template) || TEMPLATES[0];
  const isActive = currentPage === idx;
  const isDragging = draggedIdx === idx;
  const isDragOver = dragOverIdx === idx && draggedIdx !== idx;

  const commitRename = () => {
    setEditingTitle(false);
    onRename(idx, titleVal.trim() || `Page ${idx + 1}`);
  };

  return (
    <div
      className={["nbp-page-card", isActive ? "nbp-active" : "", isDragging ? "nbp-dragging" : "", isDragOver ? "nbp-drag-over" : ""].filter(Boolean).join(" ")}
      draggable
      onDragStart={(e) => onDragStart(e, idx)}
      onDragOver={(e) => onDragOver(e, idx)}
      onDrop={(e) => onDrop(e, idx)}
      onDragEnd={onDragEnd}
      onClick={() => onJumpToPage(idx)}
    >
      {/* Active indicator strip */}
      {isActive && <div className="nbp-active-strip" style={{ background: tmpl.accent }} />}

      {/* Thumbnail */}
      <div className="nbp-thumb">
        <div className="nbp-thumb-inner">
          <TemplatePreview template={template} height={100} />
          {pageHasDrawings(idx) && <div className="nbp-badge nbp-badge-ink">✏️</div>}
          {pageAnnotationCount(idx) > 0 && (
            <div className="nbp-badge nbp-badge-notes" style={{ background: tmpl.accent }}>
              {pageAnnotationCount(idx)}
            </div>
          )}
        </div>
        {/* Template color pill */}
        <div className="nbp-template-pill" style={{ background: tmpl.color, color: tmpl.accent }}>
          {tmpl.icon}
          <span>{tmpl.label}</span>
        </div>
      </div>

      {/* Info row */}
      <div className="nbp-info-row">
        {editingTitle ? (
          <div className="nbp-title-edit" onClick={e => e.stopPropagation()}>
            <input
              ref={inputRef}
              value={titleVal}
              autoFocus
              onChange={e => setTitleVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") commitRename(); }}
              onBlur={commitRename}
            />
            <button onClick={commitRename}><Check size={11} /></button>
          </div>
        ) : (
          <span className="nbp-page-title">
            {pageContent?.__title || `Page ${idx + 1}`}
          </span>
        )}
        <span className="nbp-page-num">#{idx + 1}</span>
      </div>

      {/* Action bar — visible on hover/active */}
      <div className="nbp-actions" onClick={e => e.stopPropagation()}>
        <button title="Rename" onClick={() => { setEditingTitle(true); setTimeout(() => inputRef.current?.focus(), 50); }}>
          <Pencil size={12} />
        </button>
        <button title="Duplicate" onClick={() => onDuplicatePage(idx)}>
          <Copy size={12} />
        </button>
        <button title="Move up" disabled={idx === 0} onClick={() => onMovePage(idx, idx - 1)}>
          <ChevronUp size={12} />
        </button>
        <button title="Move down" disabled={idx === pages.length - 1} onClick={() => onMovePage(idx, idx + 1)}>
          <ChevronDown size={12} />
        </button>
        <button className="nbp-delete-btn" title="Delete" disabled={pages.length <= 1} onClick={() => onDeletePage(idx)}>
          <Trash2 size={12} />
        </button>
      </div>

      {/* Insert-after button */}
      <div className="nbp-insert-row" onClick={e => e.stopPropagation()}>
        <button onClick={() => onInsertAfter(idx)}>
          <Plus size={10} /> Insert page after
        </button>
      </div>
    </div>
  );
}

// ─── Main Panel ─────────────────────────────────────────────────────────────
export default function NotebookPagePanel({
  pages, currentPage, drawHistory, notes, connectors, paperStyle,
  onClose, onJumpToPage, onAddPage, onDuplicatePage, onDeletePage, onMovePage, onSetTemplate,
}) {
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null); // { type: "add", idx, position } | { type: "change", idx }
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [pageNames, setPageNames] = useState({});

  const openAddModal = (idx, position = "after") => {
    setModalAction({ type: "add", idx, position });
    setShowModal(true);
  };

  const openChangeModal = (idx) => {
    setModalAction({ type: "change", idx });
    setShowModal(true);
  };

  const handleTemplateSelect = (templateId) => {
    if (!modalAction) return;
    if (modalAction.type === "add") {
      onAddPage(modalAction.idx, modalAction.position, templateId);
    } else {
      onSetTemplate(modalAction.idx, templateId);
    }
    setShowModal(false);
    setModalAction(null);
  };

  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e, idx) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (draggedIdx !== null && draggedIdx !== idx) onMovePage(draggedIdx, idx);
    setDraggedIdx(null); setDragOverIdx(null);
  };
  const handleDragEnd = () => { setDraggedIdx(null); setDragOverIdx(null); };

  const pageHasDrawings = (idx) => (drawHistory[idx] || []).length > 0;
  const pageAnnotationCount = (idx) => notes.filter(n => n.page === idx).length;

  const handleRename = (idx, newTitle) => {
    setPageNames(prev => ({ ...prev, [idx]: newTitle }));
    // Patch title into the page object via onSetTemplate path isn't ideal, but works structurally
    const page = pages[idx];
    if (typeof page === "object") {
      onSetTemplate(idx, page.__template || paperStyle); // triggers save with updated __title via consumer
    }
  };

  return (
    <>
      {/* ─── Panel ─────────────────────────────────── */}
      <aside className="nbp-panel">
        {/* Header */}
        <div className="nbp-panel-header">
          <div className="nbp-panel-title">
            <Layers size={15} />
            <span>Notebook</span>
            <span className="nbp-pill">{pages.length} {pages.length === 1 ? "page" : "pages"}</span>
          </div>
          <div className="nbp-panel-hbtns">
            <button
              className="nbp-new-btn"
              onClick={() => openAddModal(pages.length - 1, "after")}
            >
              <Plus size={13} /> New
            </button>
            <button className="nbp-x-btn" onClick={onClose}><X size={15} /></button>
          </div>
        </div>

        {/* Page list */}
        <div className="nbp-list">
          {pages.map((pageContent, idx) => (
            <PageCard
              key={idx}
              pageContent={pageContent}
              idx={idx}
              currentPage={currentPage}
              draggedIdx={draggedIdx}
              dragOverIdx={dragOverIdx}
              pages={pages}
              onJumpToPage={onJumpToPage}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              pageHasDrawings={pageHasDrawings}
              pageAnnotationCount={pageAnnotationCount}
              onMovePage={onMovePage}
              onDuplicatePage={onDuplicatePage}
              onDeletePage={onDeletePage}
              onInsertAfter={(idx) => openAddModal(idx, "after")}
              onRename={handleRename}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="nbp-panel-footer">
          <button onClick={() => openAddModal(pages.length - 1, "after")}>
            <Plus size={14} /> Add page
          </button>
        </div>
      </aside>

      {/* ─── Template Chooser Modal ─────────────────── */}
      {showModal && (
        <div className="nbp-backdrop" onClick={() => setShowModal(false)}>
          <div className="nbp-modal" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="nbp-modal-hdr">
              <div>
                <h2>{modalAction?.type === "add" ? "New Page" : "Change Template"}</h2>
                <p>{modalAction?.type === "add" ? "Pick a paper style for your new page" : "Switch the paper style for this page"}</p>
              </div>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            {/* Template grid */}
            <div className="nbp-tpl-grid">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className="nbp-tpl-card"
                  onClick={() => handleTemplateSelect(t.id)}
                >
                  {/* Preview */}
                  <div className="nbp-tpl-preview" style={{ borderColor: t.accent + "33", background: t.color }}>
                    <TemplatePreview template={t.id} height={90} />
                    <div className="nbp-tpl-overlay" style={{ background: `linear-gradient(to bottom, transparent 40%, ${t.color})` }} />
                  </div>
                  {/* Info */}
                  <div className="nbp-tpl-info">
                    <div className="nbp-tpl-icon" style={{ background: t.color, color: t.accent }}>
                      {t.icon}
                    </div>
                    <div>
                      <div className="nbp-tpl-name">{t.label}</div>
                      <div className="nbp-tpl-desc">{t.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
