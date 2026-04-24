import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Download, 
  Sparkles, 
  ZoomIn, 
  ZoomOut,
  FileText,
  PenTool,
  Highlighter,
  RotateCcw,
  MousePointer2,
  AlertCircle,
  Save,
  ChevronRight,
  Plus,
  Trash2,
  MessageSquare,
  Wand2,
  MoreVertical,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRight,
  Printer,
  Type,
  Square,
  Eraser,
  Bookmark,
  Layers,
  StickyNote,
  X,
  Maximize,
  Share2
} from "lucide-react";
import "../styles/reader.css";
import "../styles/reader-mobile.css";
import "../styles/reader-tablet.css";

function Reader({ zenMode, setZenMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(100);
  const [activeTool, setActiveTool] = useState("select");
  const [file, setFile] = useState(null);
  const [error, setError] = useState(false);
  
  const [pages, setPages] = useState([""]);
  const [currentPage, setCurrentPage] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  
  // SYNC WITH GLOBAL ZEN MODE
  useEffect(() => {
    if (zenMode !== undefined) {
      // Local state isFocusMode is effectively zenMode
    }
  }, [zenMode]);

  const isFocusMode = zenMode;
  const setIsFocusMode = setZenMode;
  
  // BREAKPOINT STATES
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  // FEATURE STATES
  const [isSaving, setIsSaving] = useState(false);
  const [summary, setSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);

  // DRAWING STATES
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [drawHistory, setDrawHistory] = useState({});
  const [penColor, setPenColor] = useState("#3b82f6");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("starNote_files");
      let files = [];
      if (saved) {
        files = JSON.parse(saved);
      } else {
        files = [
          { name: "Calculus_Chapter_4.pdf", size: "2.4 MB", date: "Today", icon: "📐", cat: "university", content: "Calculus Chapter 4 Overview:\n1. The Derivative as a Function.\n2. Differentiation Rules.\n3. The Chain Rule." },
          { name: "Physics_Notes.docx", size: "1.1 MB", date: "Yesterday", icon: "⚛️", cat: "university", content: "Newton's Laws of Motion:\nFirst Law: Inertia.\nSecond Law: F = ma.\nThird Law: Action & Reaction." }
        ];
        localStorage.setItem("starNote_files", JSON.stringify(files));
      }
      const found = files[parseInt(id)];
      if (found) {
        setFile(found);
        if (found.pages) setPages(found.pages);
        else setPages([found.content || ""]);
        setDrawHistory(found.drawHistory || {});
        setNotes(found.notes || []);
      } else setError(true);
    } catch (err) { setError(true); }
  }, [id]);

  // FEATURE HANDLERS
  const addNote = () => {
    const newNote = { id: Date.now(), text: "New sticky note...", page: currentPage, date: new Date().toLocaleTimeString() };
    const updated = [...notes, newNote];
    setNotes(updated);
    saveFileChanges({ notes: updated });
  };

  const updateNote = (noteId, newText) => {
    const updated = notes.map(n => n.id === noteId ? { ...n, text: newText } : n);
    setNotes(updated);
    saveFileChanges({ notes: updated });
  };

  const deleteNote = (noteId) => {
    const updated = notes.filter(n => n.id !== noteId);
    setNotes(updated);
    saveFileChanges({ notes: updated });
  };
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const historyStack = drawHistory[currentPage] || [];
      if (historyStack.length > 0) {
        const img = new Image();
        img.src = historyStack[historyStack.length - 1];
        img.onload = () => ctx.drawImage(img, 0, 0);
      }
    }
  }, [currentPage, drawHistory]);

  const saveFileChanges = (updates) => {
    const saved = localStorage.getItem("starNote_files");
    if (saved) {
      const files = JSON.parse(saved);
      files[parseInt(id)] = { ...files[parseInt(id)], ...updates };
      localStorage.setItem("starNote_files", JSON.stringify(files));
      setFile(files[parseInt(id)]);
    }
  };

  const handleSummarize = async () => {
    if (isSummarizing) return;
    setIsSummarizing(true);
    try {
      setSummary("This document covers the core principles of the subject, focusing on key formulas, historical context, and practical applications in modern science.");
    } catch (err) {
      console.error(err);
    }
    setIsSummarizing(false);
  };

  const toggleTool = (tool) => {
    setActiveTool(prev => prev === tool ? "select" : tool);
  };

  const startDrawing = (e) => {
    if (activeTool === "select") return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    
    setStartX(x);
    setStartY(y);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = activeTool === "highlighter" ? `${penColor}44` : penColor;
    ctx.lineWidth = activeTool === "highlighter" ? strokeWidth * 4 : strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (activeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 20;
    } else {
      ctx.globalCompositeOperation = "source-over";
    }
  };

  const draw = (e) => {
    if (!isDrawing || activeTool === "select" || activeTool === "text") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    
    const isShape = ["shape", "circle", "line"].includes(activeTool);
    if (isShape) {
      const historyStack = drawHistory[currentPage] || [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (historyStack.length > 0) {
        const img = new Image();
        img.src = historyStack[historyStack.length - 1];
        ctx.drawImage(img, 0, 0);
      }
      ctx.beginPath();
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = penColor;

      if (activeTool === "shape") ctx.strokeRect(startX, startY, x - startX, y - startY);
      else if (activeTool === "circle") {
        const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
      else if (activeTool === "line") { ctx.moveTo(startX, startY); ctx.lineTo(x, y); ctx.stroke(); }
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setDrawHistory(prev => {
      const pageHistory = prev[currentPage] || [];
      const newHistory = { ...prev, [currentPage]: [...pageHistory, dataUrl] };
      saveFileChanges({ drawHistory: newHistory });
      return newHistory;
    });
  };

  const undo = () => {
    setDrawHistory(prev => {
      const pageHistory = prev[currentPage] || [];
      if (pageHistory.length === 0) return prev;
      const newPageHistory = pageHistory.slice(0, -1);
      const newHistory = { ...prev, [currentPage]: newPageHistory };
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (newPageHistory.length > 0) {
          const img = new Image();
          img.src = newPageHistory[newPageHistory.length - 1];
          img.onload = () => ctx.drawImage(img, 0, 0);
        }
      }
      saveFileChanges({ drawHistory: newHistory });
      return newHistory;
    });
  };

  const clearCanvas = () => {
    setDrawHistory(prev => {
      const newHistory = { ...prev, [currentPage]: [] };
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      saveFileChanges({ drawHistory: newHistory });
      return newHistory;
    });
  };

  if (error) return <div className="reader-error"><AlertCircle size={48} /><h2>Error Loading</h2><button onClick={() => navigate("/notes")}>Back</button></div>;
  if (!file) return (
    <div className="reader-modern-desktop">
      <header className="reader-header-modern" style={{ padding: '0 24px' }}>
        <div className="header-left">
          <div className="skeleton-icon" style={{ width: 40, height: 40, margin: 0 }}></div>
          <div className="skeleton-text short" style={{ width: 150, height: 16, margin: 0, borderRadius: 8 }}></div>
        </div>
      </header>
      <div className="reader-layout-modern">
        <aside className="left-toolbar-modern" style={{ paddingTop: 20 }}>
           {[1,2,3].map(i => <div key={i} className="skeleton-icon" style={{ width: 40, height: 40, margin: '10px auto' }}></div>)}
        </aside>
        <main className="main-workspace-modern" style={{ padding: '40px 80px' }}>
           <div className="skeleton-text" style={{ width: '80%', height: 40, marginBottom: 30, borderRadius: 12 }}></div>
           <div className="skeleton-text" style={{ width: '100%', height: 20, marginBottom: 16, borderRadius: 8 }}></div>
           <div className="skeleton-text" style={{ width: '90%', height: 20, marginBottom: 16, borderRadius: 8 }}></div>
           <div className="skeleton-text" style={{ width: '95%', height: 20, marginBottom: 16, borderRadius: 8 }}></div>
           <div className="skeleton-text" style={{ width: '60%', height: 20, marginBottom: 40, borderRadius: 8 }}></div>
        </main>
      </div>
    </div>
  );

  // --- DESKTOP VIEW ---
  if (isDesktop) {
    return (
      <div className={`reader-modern-desktop ${isFocusMode ? 'zen-mode-active' : ''}`}>
        <header className="reader-header-modern">
          <div className="header-left">
            <button className="btn-icon-modern" onClick={() => navigate("/notes")}><ChevronLeft size={20} /></button>
            <span className="file-name-modern">{file.name}</span>
          </div>
          <div className="header-right">
            <button className="btn-ai-modern primary" onClick={() => setShowSidebar(true)}>
              <Sparkles size={16} /> <span>AI Summarizer</span>
            </button>
            <button className="btn-ai-modern blue" onClick={() => navigate("/ai")}>
              <MessageSquare size={16} /> <span>AI Tutor</span>
            </button>
          </div>
        </header>

        <div className="reader-layout-modern">
          <aside className="left-toolbar-modern">
            <div className="tool-group">
              <button className={`tool-item ${activeTool === 'pages' ? 'active' : ''}`}><Layers size={20} /><span>Pages</span></button>
              <button className="tool-item"><Bookmark size={20} /><span>Bookmarks</span></button>
              <button className="tool-item"><StickyNote size={20} /><span>Notes</span></button>
            </div>
            <div className="tool-divider-modern"></div>
            <div className="tool-group">
              <button className={`tool-item ${activeTool === 'highlighter' ? 'active' : ''}`} onClick={() => setActiveTool('highlighter')}><Highlighter size={20} /><span>Highlight</span></button>
              <button className={`tool-item ${activeTool === 'pen' ? 'active' : ''}`} onClick={() => setActiveTool('pen')}><PenTool size={20} /><span>Draw</span></button>
              <button className={`tool-item ${activeTool === 'text' ? 'active' : ''}`} onClick={() => setActiveTool('text')}><Type size={20} /><span>Text</span></button>
              <button className={`tool-item ${activeTool === 'shape' ? 'active' : ''}`} onClick={() => setActiveTool('shape')}><Square size={20} /><span>Shapes</span></button>
              <button className={`tool-item ${activeTool === 'eraser' ? 'active' : ''}`} onClick={() => setActiveTool('eraser')}><Eraser size={20} /><span>Eraser</span></button>
              <div className="tool-divider-modern" style={{ margin: '8px 0', height: '1px' }}></div>
              <button className="tool-item" onClick={undo}><RotateCcw size={20} /><span>Undo</span></button>
              {activeTool === 'eraser' && <button className="tool-item danger-text" onClick={clearCanvas}><Trash2 size={20} /><span>Clear</span></button>}
            </div>

            
            {/* Tool Options Sub-Panel */}
            {['pen', 'highlighter', 'shape', 'circle', 'line'].includes(activeTool) && (
              <div className="tool-options-panel">
                <div className="tool-options-header">
                  <span>Settings</span>
                  <button className="close-options-btn" onClick={() => setActiveTool('select')}><X size={14} /></button>
                </div>
                <div className="color-swatches">
                  {['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
                    <button key={c} className={`swatch ${penColor === c ? 'active' : ''}`} style={{ backgroundColor: c }} onClick={() => setPenColor(c)} />
                  ))}
                </div>
                {['shape', 'circle', 'line'].includes(activeTool) ? (
                  <div className="shape-variants">
                    <button className={`variant-btn ${activeTool === 'shape' ? 'active' : ''}`} onClick={() => setActiveTool('shape')}>⬛</button>
                    <button className={`variant-btn ${activeTool === 'circle' ? 'active' : ''}`} onClick={() => setActiveTool('circle')}>⚫</button>
                    <button className={`variant-btn ${activeTool === 'line' ? 'active' : ''}`} onClick={() => setActiveTool('line')}>➖</button>
                  </div>
                ) : (
                  <div className="stroke-widths">
                    {[2, 4, 8].map(w => (
                      <button key={w} className={`stroke-btn ${strokeWidth === w ? 'active' : ''}`} onClick={() => setStrokeWidth(w)}>
                        <div style={{ width: '18px', height: w, backgroundColor: 'var(--d-text)', borderRadius: w }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="toolbar-spacer-modern"></div>
            <button className="tool-item focus-toggle" onClick={() => setIsFocusMode(!isFocusMode)}>
              {isFocusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              <span>Focus Mode</span>
            </button>
          </aside>

          <main className="main-workspace-modern">
            <div className="workspace-controls-modern">
              <div className="page-nav-modern">
                <button onClick={() => setCurrentPage(Math.max(0, currentPage-1))} disabled={currentPage===0}><ChevronLeft size={18} /></button>
                <div className="page-indicator-modern">
                  <input type="text" value={currentPage+1} readOnly /> / {pages.length}
                </div>
                <button onClick={() => setCurrentPage(Math.min(pages.length-1, currentPage+1))} disabled={currentPage===pages.length-1}><ChevronRight size={18} /></button>
              </div>
              <div className="zoom-pill-modern">
                <button onClick={() => setZoom(Math.max(50, zoom-10))}><ZoomOut size={16} /></button>
                <span>{zoom}%</span>
                <button onClick={() => setZoom(Math.min(200, zoom+10))}><ZoomIn size={16} /></button>
              </div>
              <div className="action-group-modern">
                <button className="btn-action-modern" onClick={() => saveFileChanges({})}><Save size={18} /><span>Save</span></button>
                <button className="btn-action-modern" onClick={() => alert("Note shared! Public link: https://starnote.ai/shared/" + id)}><Share2 size={18} /><span>Share</span></button>
              </div>
            </div>
            <div className="document-viewport-modern">
              <div className="document-wrapper-modern" style={{ width: `${zoom}%`, position: 'relative' }}>
                <canvas 
                  ref={canvasRef}
                  style={{ 
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                    zIndex: 10, pointerEvents: ['pen', 'highlighter', 'eraser', 'text', 'shape', 'circle', 'line'].includes(activeTool) ? 'auto' : 'none' 
                  }}
                  width={1000} height={1414}
                  onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                />
                {file.blobUrl ? (
                  <iframe src={file.blobUrl} title={file.name} className="modern-iframe" style={{ position: 'relative', zIndex: 1 }} />
                ) : (
                  <div className="paper-a4-modern">
                    <div className="paper-body-modern">
                      {(pages[currentPage] || "").split('\n').map((l, i) => <p key={i}>{l}</p>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* FLOATING ZEN MODE EXIT BUTTON */}
            {isFocusMode && (
              <button className="btn-exit-zen slide-up" onClick={() => setIsFocusMode(false)}>
                <Minimize2 size={16} /> Exit Zen Mode
              </button>
            )}
          </main>

          <aside className={`right-sidebar-modern ${showSidebar && !isFocusMode ? 'open' : ''}`}>
            <div className="sidebar-top-modern">
              <h3>AI Assistant</h3>
              <button className="close-sidebar-modern" onClick={() => setShowSidebar(false)}><X size={18} /></button>
            </div>
            <div className="sidebar-scroll-modern">
              <div className="ai-card-modern">
                <div className="card-header-modern"><Sparkles size={18} className="text-blue" /><span>AI Summarizer</span></div>
                {summary ? (
                  <div className="summary-text-modern" style={{ fontSize: '13px', lineHeight: '1.5', marginTop: '8px' }}>
                    <p>{summary}</p>
                    <button className="card-btn-modern" onClick={handleSummarize} disabled={isSummarizing} style={{ marginTop: '12px' }}>
                      {isSummarizing ? "Regenerating..." : "Regenerate Summary"}
                    </button>
                  </div>
                ) : (
                  <>
                    <p>Get a quick summary of this document.</p>
                    <button className="card-btn-modern" onClick={handleSummarize} disabled={isSummarizing}>
                      {isSummarizing ? "Summarizing..." : "Summarize Document"}
                    </button>
                  </>
                )}
              </div>
              <div className="ai-card-modern">
                <div className="card-header-modern"><Layers size={18} className="text-blue" /><span>Flashcard Gen</span></div>
                <p>Turn this document into flashcards.</p>
                <button className="card-btn-modern" onClick={() => navigate("/flashcards", { state: { sourceFile: file.name } })}>
                  Generate Deck
                </button>
              </div>

              <div className="ai-card-modern">
                <div className="card-header-modern"><MessageSquare size={18} className="text-blue" /><span>AI Tutor</span></div>
                <p>Ask questions and get explained concepts.</p>
                <div className="ai-actions-row">
                  <button className="card-btn-modern" onClick={() => navigate("/ai")}>Chat</button>
                  <button className="card-btn-icon-modern" title="Voice Ask"><Plus size={18} /></button>
                </div>
              </div>

              <div className="notes-section-modern">
                <div className="notes-header-modern">
                  <span>STICKY NOTES</span>
                  <button className="add-note-btn" onClick={addNote}><Plus size={16} /> Add Note</button>
                </div>
                <div className="notes-list-modern">
                  {notes.length === 0 ? (
                    <div className="notes-empty-modern">
                      <StickyNote size={24} />
                      <p>No notes for this document yet.</p>
                    </div>
                  ) : (
                    notes.map(note => (
                      <div key={note.id} className="note-item-modern">
                        <div className="note-item-header">
                          <span className="note-page-tag">Page {note.page + 1}</span>
                          <button className="note-delete-btn" onClick={() => deleteNote(note.id)}><Trash2 size={14} /></button>
                        </div>
                        <textarea 
                          value={note.text || ""} 
                          onChange={(e) => updateNote(note.id, e.target.value)}
                          placeholder="Type something..."
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // --- TABLET & MOBILE VIEW ---
  return (
    <div className={`reader-modern-mobile ${isFocusMode ? 'focus-mode' : ''}`}>
      <header className="mobile-reader-header">
        <div className="m-header-left">
          <button className="m-btn-back" onClick={() => navigate("/notes")}><ChevronLeft size={24} /></button>
          <div className="m-file-info">
            <span className="m-file-name">{file.name}</span>
            <span className="m-page-indicator">{currentPage + 1} / {pages.length}</span>
          </div>
        </div>
        <div className="m-header-right">
          <button className={`m-ai-btn ${showSidebar ? 'active' : ''}`} onClick={() => setShowSidebar(!showSidebar)}><Sparkles size={20} /></button>
          <button className="m-ai-btn" onClick={() => navigate("/ai")}><MessageSquare size={20} /></button>
          <button className="m-btn-more"><MoreVertical size={24} /></button>
        </div>
      </header>

      {!isFocusMode && (
        <div className="m-secondary-toolbar">
          <div className="m-page-nav">
            <button onClick={() => setCurrentPage(Math.max(0, currentPage-1))} disabled={currentPage===0}><ChevronLeft size={20} /></button>
            <span className="m-zoom-val">{currentPage + 1} / {pages.length}</span>
            <button onClick={() => setCurrentPage(Math.min(pages.length-1, currentPage+1))} disabled={currentPage===pages.length-1}><ChevronRight size={20} /></button>
          </div>
          <div className="m-zoom-controls">
            <button onClick={() => setZoom(Math.max(50, zoom-10))}><ZoomOut size={18} /></button>
            <span className="m-zoom-val">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(200, zoom+10))}><ZoomIn size={18} /></button>
          </div>
        </div>
      )}

      <main className={isTablet ? "m-mobile-viewport tablet-view" : "m-mobile-viewport"}>
        <div className="m-document-wrapper" style={{ width: `${zoom}%`, position: 'relative' }}>
          <canvas 
            ref={canvasRef}
            style={{ 
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
              zIndex: 10, pointerEvents: ['pen', 'highlighter', 'eraser', 'text', 'shape', 'circle', 'line'].includes(activeTool) ? 'auto' : 'none' 
            }}
            width={1000} height={1414}
            onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
            onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
          />
          {file.blobUrl ? (
            <div className="m-iframe-container">
              <iframe src={file.blobUrl} title={file.name} />
            </div>
          ) : (
            <div className="m-paper-a4">
              <div className="m-paper-body">
                {(pages[currentPage] || "").split('\n').map((l, i) => <p key={i}>{l}</p>)}
              </div>
            </div>
          )}
        </div>
      </main>

      <div className={`m-bottom-sheet ${showSidebar ? 'open' : ''}`}>
        <div className="sheet-handle" onClick={() => setShowSidebar(!showSidebar)}></div>
        <div className="sheet-header">
          <h3>AI Assistant & Notes</h3>
          <button className="m-close-sheet" onClick={() => setShowSidebar(false)}><X size={24} /></button>
        </div>
        <div className="sheet-content">
          <div className="sheet-card">
            <div className="sheet-header-row">
              <h3>AI Summary</h3>
              <button className="m-primary-btn mini" onClick={handleSummarize}>{isSummarizing ? "..." : "Generate"}</button>
            </div>
            <p className="summary-p">{summary || "Generate a summary to see it here."}</p>
          </div>

          <div className="sheet-card">
            <div className="sheet-header-row">
              <h3>Sticky Notes</h3>
              <button className="m-text-btn" onClick={addNote}><Plus size={18} /> Add</button>
            </div>
            <div className="m-notes-list">
              {notes.length === 0 ? (
                <p className="m-empty-msg">No notes added yet.</p>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="m-note-item">
                    <div className="m-note-top">
                      <span>Page {note.page + 1}</span>
                      <button onClick={() => deleteNote(note.id)}><Trash2 size={16} /></button>
                    </div>
                    <textarea 
                      value={note.text || ""} 
                      onChange={(e) => updateNote(note.id, e.target.value)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className={`m-bottom-toolbar floating-pill ${isTablet ? 'tablet-pill' : ''}`}>
        <div className="m-tools-row">
          <button className={`m-tool-btn ${activeTool === 'highlighter' ? 'active' : ''}`} onClick={() => toggleTool('highlighter')}><Highlighter size={18} /><span>High</span></button>
          <button className={`m-tool-btn ${activeTool === 'pen' ? 'active' : ''}`} onClick={() => toggleTool('pen')}><PenTool size={18} /><span>Pen</span></button>
          <button className={`m-tool-btn ${activeTool === 'text' ? 'active' : ''}`} onClick={() => toggleTool('text')}><Type size={18} /><span>Text</span></button>
          <button className={`m-tool-btn ${['shape', 'circle', 'line'].includes(activeTool) ? 'active' : ''}`} onClick={() => toggleTool('shape')}><Square size={18} /><span>Shapes</span></button>
          <button className={`m-tool-btn ${activeTool === 'eraser' ? 'active' : ''}`} onClick={() => toggleTool('eraser')}><Eraser size={18} /><span>Eraser</span></button>
          <button className="m-tool-btn" onClick={undo}><RotateCcw size={18} /><span>Undo</span></button>
        </div>
      </nav>

      {['pen', 'highlighter', 'shape', 'circle', 'line'].includes(activeTool) && (
        <div className="m-tool-options-panel">
          <div className="color-swatches">
            {['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
              <button key={c} className={`swatch ${penColor === c ? 'active' : ''}`} style={{ backgroundColor: c }} onClick={() => setPenColor(c)} />
            ))}
          </div>
          {['shape', 'circle', 'line'].includes(activeTool) ? (
            <div className="shape-variants">
              <button className={`variant-btn ${activeTool === 'shape' ? 'active' : ''}`} onClick={() => toggleTool('shape')}>⬛</button>
              <button className={`variant-btn ${activeTool === 'circle' ? 'active' : ''}`} onClick={() => toggleTool('circle')}>⚫</button>
              <button className={`variant-btn ${activeTool === 'line' ? 'active' : ''}`} onClick={() => toggleTool('line')}>➖</button>
            </div>
          ) : (
            <div className="stroke-widths">
              {[2, 4, 8].map(w => (
                <button key={w} className={`stroke-btn ${strokeWidth === w ? 'active' : ''}`} onClick={() => setStrokeWidth(w)}>
                  <div style={{ width: '18px', height: w, backgroundColor: 'var(--m-text)', borderRadius: w }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Reader;
