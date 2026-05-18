import { useState, useEffect, useRef, useCallback } from "react";
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
  Share2,
  BrainCircuit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { notesService, flashcardsService } from "../services/index";
import "../styles/reader.css";
import "../styles/reader-mobile.css";
import "../styles/reader-tablet.css";
import SlashEditor from "../components/SlashEditor";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
  const [objectUrl, setObjectUrl] = useState(null);
  
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
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);

  // DRAWING STATES
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [drawHistory, setDrawHistory] = useState({});
  const [penColor, setPenColor] = useState("#3b82f6");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [notes, setNotes] = useState([]);
  // Tool options panel visibility decoupled from active tool
  const [showToolOptions, setShowToolOptions] = useState(false);
  // Debounce timer ref for sticky notes
  const noteDebounceRef = useRef({});

  // CONTEXTUAL TOOLBAR STATE
  const [selection, setSelection] = useState({ text: "", x: 0, y: 0, show: false });

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Text Selection Listener
  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      const text = sel.toString().trim();
      
      // Don't show if active tool is not select
      if (text.length > 0 && activeTool === "select") {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setSelection({
          text,
          x: rect.left + (rect.width / 2),
          y: rect.top - 8,
          show: true
        });
      } else {
        if (selection.show) {
          setSelection(s => ({ ...s, show: false }));
        }
      }
    };

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("touchend", handleSelection);
    
    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
    };
  }, [activeTool, selection.show]);

  useEffect(() => {
    notesService.getById(id)
      .then(res => {
        const found = res.data.note;
        if (found) {
          setFile(found);
          if (found.pages && found.pages.length > 0) setPages(found.pages);
          else setPages([found.content || ""]);
          setDrawHistory(found.drawHistory || {});
          setNotes(found.notes || []);
        } else {
          setError(true);
        }
      })
      .catch(err => {
        // Fallback for mock IDs like "0" if in mock mode
        const saved = localStorage.getItem("starNote_files");
        if (saved) {
          const files = JSON.parse(saved);
          const found = files[parseInt(id)] || files.find(f => f._id === id || f.id === id);
          if (found) {
            setFile(found);
            setPages(found.pages || [found.content || ""]);
            setDrawHistory(found.drawHistory || {});
            setNotes(found.notes || []);
            return;
          }
        }
        setError(true);
      });
  }, [id]);

  // Convert Base64 blobUrl to Object URL or use static backend URL
  useEffect(() => {
    if (file && file.blobUrl) {
      if (file.blobUrl.startsWith("data:")) {
        try {
          // Fetch API can parse data URIs into Blobs
          fetch(file.blobUrl)
            .then(res => res.blob())
            .then(blob => {
              const url = URL.createObjectURL(blob);
              setObjectUrl(url);
            });
        } catch (e) {
          console.error("Failed to convert base64 to blob:", e);
        }
      } else if (file.blobUrl.startsWith("/uploads/")) {
        // Build the backend URL dynamically
        const backendUrl = import.meta.env.VITE_API_URL 
          ? import.meta.env.VITE_API_URL.replace("/api", "") 
          : "http://localhost:5000";
        setObjectUrl(`${backendUrl}${file.blobUrl}`);
      } else {
        setObjectUrl(file.blobUrl);
      }
    }
    return () => {
      if (objectUrl && objectUrl.startsWith("blob:")) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  // FEATURE HANDLERS
  const addNote = () => {
    const newNote = { id: Date.now(), text: "", page: currentPage, date: new Date().toLocaleTimeString() };
    const updated = [...notes, newNote];
    setNotes(updated);
    saveFileChanges({ notes: updated });
  };

  // Debounced note update — only fires save 600ms after user stops typing
  const updateNote = useCallback((noteId, newText) => {
    // Optimistic UI update immediately
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, text: newText } : n));

    // Clear existing debounce for this note
    if (noteDebounceRef.current[noteId]) {
      clearTimeout(noteDebounceRef.current[noteId]);
    }
    // Schedule save after 600ms of inactivity
    noteDebounceRef.current[noteId] = setTimeout(() => {
      setNotes(current => {
        saveFileChanges({ notes: current });
        return current;
      });
    }, 600);
  }, []);

  // Flush note saves immediately on blur
  const flushNoteOnBlur = useCallback((noteId) => {
    if (noteDebounceRef.current[noteId]) {
      clearTimeout(noteDebounceRef.current[noteId]);
      delete noteDebounceRef.current[noteId];
    }
    setNotes(current => {
      saveFileChanges({ notes: current });
      return current;
    });
  }, []);

  const deleteNote = (noteId) => {
    if (noteDebounceRef.current[noteId]) {
      clearTimeout(noteDebounceRef.current[noteId]);
      delete noteDebounceRef.current[noteId];
    }
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

  const saveFileChanges = async (updates) => {
    try {
      const res = await notesService.update(id, updates);
      setFile(res.data.note);
    } catch (e) {
      console.error("Failed to save changes:", e);
      // Fallback optimistic update for local
      setFile(prev => ({ ...prev, ...updates }));
    }
  };

  const handleSummarize = async () => {
    if (isSummarizing) return;
    setIsSummarizing(true);
    try {
      const prompt = `Summarize this text in 3-4 sentences. Focus on the core principles: ${(file?.content || pages.join("\n")).substring(0, 4000)}`;
      const result = await aiModel.generateContent(prompt);
      setSummary(result.response.text());
    } catch (err) {
      console.error(err);
      setSummary("Failed to generate summary. Please try again.");
    }
    setIsSummarizing(false);
  };

  const handleGenerateFlashcards = async () => {
    if (isGeneratingCards) return;
    setIsGeneratingCards(true);
    try {
      const content = (file?.content || pages.join("\n")).substring(0, 5000);
      const prompt = `Generate exactly 5 flashcards from this text. Return ONLY a valid JSON array of objects with keys "front" and "back". Do not use markdown fences. Text: ${content}`;
      const result = await aiModel.generateContent(prompt);
      const text = result.response.text().trim();
      
      const match = text.match(/\[.*\]/s);
      if (match) {
        const cards = JSON.parse(match[0]);
        await flashcardsService.bulkCreate(cards, file?.name || "Auto-Generated Deck");
        alert("✨ Flashcards generated and saved! Go to the Flashcards page to study them.");
      } else {
        alert("Failed to parse AI output.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate flashcards.");
    }
    setIsGeneratingCards(false);
  };

  const handleContextAction = async (action) => {
    const text = selection.text;
    setSelection(s => ({ ...s, show: false }));
    window.getSelection().removeAllRanges();

    if (action === "summarize" || action === "explain") {
      setShowSidebar(true);
      setIsSummarizing(true);
      try {
        const isExplain = action === "explain";
        const prompt = isExplain 
          ? `Explain this concept simply like I am a beginner. Use bullet points if necessary:\n\n"${text}"`
          : `Summarize this specific text concisely in 2-3 sentences:\n\n"${text}"`;
        
        const result = await aiModel.generateContent(prompt);
        setSummary(result.response.text());
      } catch (err) {
        setSummary("Failed to generate response. Please try again.");
      }
      setIsSummarizing(false);
    } else if (action === "flashcard") {
      setIsGeneratingCards(true);
      try {
        const prompt = `Create exactly 1 flashcard from this text. Return ONLY a valid JSON array with 1 object containing keys "front" and "back". Text: "${text}"`;
        const result = await aiModel.generateContent(prompt);
        const match = result.response.text().match(/\[.*\]/s);
        if (match) {
          const cards = JSON.parse(match[0]);
          await flashcardsService.bulkCreate(cards, file?.name || "Contextual Cards");
          alert("✨ Flashcard generated and saved!");
        }
      } catch (err) {
        alert("Failed to generate flashcard.");
      }
      setIsGeneratingCards(false);
    }
  };

  const toggleTool = (tool) => {
    setActiveTool(prev => {
      if (prev === tool) {
        setShowToolOptions(false);
        return "select";
      }
      // Show options panel if it's a drawing tool
      if (['pen', 'highlighter', 'shape', 'circle', 'line'].includes(tool)) {
        setShowToolOptions(true);
      } else {
        setShowToolOptions(false);
      }
      return tool;
    });
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
    } else if (activeTool === "highlighter") {
      ctx.globalCompositeOperation = "multiply";
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

  if (error) return (
    <div className="reader-error">
      <AlertCircle size={48} />
      <h2>Could not load document</h2>
      <p>This note may have been deleted or moved.</p>
      <button onClick={() => navigate("/notes")}>← Back to Notes</button>
    </div>
  );
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

  const ContextualToolbar = () => (
    <AnimatePresence>
      {selection.show && (
        <motion.div 
          className="contextual-toolbar glass-card"
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          style={{ 
            left: selection.x, 
            top: selection.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <button onClick={() => handleContextAction("summarize")}>
            <Sparkles size={14} /> <span>Summarize</span>
          </button>
          <button onClick={() => handleContextAction("explain")}>
            <BrainCircuit size={14} /> <span>Explain</span>
          </button>
          <div className="toolbar-divider" />
          <button onClick={() => handleContextAction("flashcard")}>
            <Layers size={14} /> <span>Flashcard</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // --- DESKTOP VIEW ---
  if (isDesktop) {
    return (
      <div className={`reader-modern-desktop ${isFocusMode ? 'zen-mode-active' : ''}`}>
        <ContextualToolbar />
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
              <button className="tool-item" onClick={() => setShowSidebar(true)}><StickyNote size={20} /><span>Notes</span></button>
            </div>
            <div className="tool-divider-modern"></div>
            <div className="tool-group">
              <button className={`tool-item ${activeTool === 'highlighter' ? 'active' : ''}`} onClick={() => toggleTool('highlighter')}><Highlighter size={20} /><span>Highlight</span></button>
              <button className={`tool-item ${activeTool === 'pen' ? 'active' : ''}`} onClick={() => toggleTool('pen')}><PenTool size={20} /><span>Draw</span></button>
              <button className={`tool-item ${activeTool === 'text' ? 'active' : ''}`} onClick={() => toggleTool('text')}><Type size={20} /><span>Text</span></button>
              <button className={`tool-item ${['shape','circle','line'].includes(activeTool) ? 'active' : ''}`} onClick={() => toggleTool('shape')}><Square size={20} /><span>Shapes</span></button>
              <button className={`tool-item ${activeTool === 'eraser' ? 'active' : ''}`} onClick={() => toggleTool('eraser')}><Eraser size={20} /><span>Eraser</span></button>
              <div className="tool-divider-modern" style={{ margin: '8px 0', height: '1px' }}></div>
              <button className="tool-item" onClick={undo}><RotateCcw size={20} /><span>Undo</span></button>
              {activeTool === 'eraser' && <button className="tool-item danger-text" onClick={clearCanvas}><Trash2 size={20} /><span>Clear</span></button>}
            </div>

            
            {/* Tool Options Sub-Panel — visibility decoupled from active tool so drawing continues after closing */}
            {showToolOptions && ['pen', 'highlighter', 'shape', 'circle', 'line'].includes(activeTool) && (
              <div className="tool-options-panel">
                <div className="tool-options-header">
                  <span>Tool Settings</span>
                  {/* Close panel WITHOUT deactivating the tool */}
                  <button className="close-options-btn" onClick={() => setShowToolOptions(false)}><X size={14} /></button>
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
                    zIndex: 10,
                    pointerEvents: ['pen', 'highlighter', 'eraser', 'text', 'shape', 'circle', 'line'].includes(activeTool) ? 'auto' : 'none',
                    touchAction: ['pen', 'highlighter', 'eraser', 'shape', 'circle', 'line'].includes(activeTool) ? 'none' : 'auto',
                    cursor: activeTool === 'pen' || activeTool === 'highlighter' ? 'crosshair' : activeTool === 'eraser' ? 'cell' : 'default',
                  }}
                  width={1000} height={1414}
                  onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                />
                {file.blobUrl ? (
                  file.fileType && file.fileType.startsWith("image/") ? (
                    <img src={file.blobUrl} alt={file.name} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }} />
                  ) : (
                    <iframe src={objectUrl || file.blobUrl} title={file.name} className="modern-iframe" style={{ position: 'relative', zIndex: 1, backgroundColor: 'white' }} />
                  )
                ) : (
                  <div className="paper-a4-modern">
                    <div className="paper-body-modern">
                      <SlashEditor 
                        initialContent={pages[currentPage] || ""}
                        onChange={(val) => {
                          const updated = [...pages];
                          updated[currentPage] = val;
                          setPages(updated);
                        }}
                        onBlur={() => saveFileChanges({ pages })}
                        onSummarize={handleSummarize}
                        onFlashcard={handleGenerateFlashcards}
                      />
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
                <p>Use AI to automatically turn this document into study flashcards.</p>
                <button className="card-btn-modern" onClick={handleGenerateFlashcards} disabled={isGeneratingCards}>
                  {isGeneratingCards ? "Extracting Cards..." : "Generate Deck"}
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
                          onBlur={() => flushNoteOnBlur(note.id)}
                          placeholder="Type something..."
                          autoFocus={note.text === ""}
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
      <ContextualToolbar />
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
              zIndex: 10,
              pointerEvents: ['pen', 'highlighter', 'eraser', 'text', 'shape', 'circle', 'line'].includes(activeTool) ? 'auto' : 'none',
              // Prevent page scroll while drawing on touch devices
              touchAction: ['pen', 'highlighter', 'eraser', 'shape', 'circle', 'line'].includes(activeTool) ? 'none' : 'auto',
              cursor: activeTool === 'pen' || activeTool === 'highlighter' ? 'crosshair' : activeTool === 'eraser' ? 'cell' : 'default',
            }}
            width={1000} height={1414}
            onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={(e) => { e.preventDefault(); draw(e); }}
            onTouchEnd={stopDrawing}
          />
          {file.blobUrl ? (
            <div className="m-iframe-container">
              {file.fileType && file.fileType.startsWith("image/") ? (
                <img src={file.blobUrl} alt={file.name} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }} />
              ) : (
                <iframe src={objectUrl || file.blobUrl} title={file.name} style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'white' }} />
              )}
            </div>
          ) : (
            <div className="m-paper-a4">
              <div className="m-paper-body">
                <SlashEditor 
                  initialContent={pages[currentPage] || ""}
                  onChange={(val) => {
                    const updated = [...pages];
                    updated[currentPage] = val;
                    setPages(updated);
                  }}
                  onBlur={() => saveFileChanges({ pages })}
                  onSummarize={handleSummarize}
                  onFlashcard={handleGenerateFlashcards}
                />
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
                      onBlur={() => flushNoteOnBlur(note.id)}
                      placeholder="Type a note..."
                      autoFocus={note.text === ""}
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

      {showToolOptions && ['pen', 'highlighter', 'shape', 'circle', 'line'].includes(activeTool) && (
        <div className="m-tool-options-panel">
          <button className="m-close-options" onClick={() => setShowToolOptions(false)}>
            <X size={16} />
          </button>
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
