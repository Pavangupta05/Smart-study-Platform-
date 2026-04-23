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
  Maximize
} from "lucide-react";
import "../styles/reader.css";
import "../styles/reader-mobile.css";

function Reader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(100);
  const [activeTool, setActiveTool] = useState("select");
  const [file, setFile] = useState(null);
  const [error, setError] = useState(false);
  
  const [pages, setPages] = useState([""]);
  const [currentPage, setCurrentPage] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("starNote_files");
      if (saved) {
        const files = JSON.parse(saved);
        const found = files[parseInt(id)];
        if (found) {
          setFile(found);
          if (found.pages) setPages(found.pages);
          else setPages([found.content || ""]);
        } else setError(true);
      } else setError(true);
    } catch (err) { setError(true); }
  }, [id]);

  if (error) return <div className="reader-error"><AlertCircle size={48} /><h2>Error Loading</h2><button onClick={() => navigate("/notes")}>Back</button></div>;
  if (!file) return <div className="reader-loading"><div className="loader-ring"></div></div>;

  // --- DESKTOP VIEW ---
  if (!isMobile) {
    return (
      <div className={`reader-modern-desktop ${isFocusMode ? 'focus-mode' : ''}`}>
        <header className="reader-header-modern">
          <div className="header-left">
            <button className="btn-icon-modern" onClick={() => navigate(-1)}><ChevronLeft size={20} /></button>
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
            </div>
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
                <button className="btn-action-modern"><Download size={18} /><span>Download</span></button>
                <button className="btn-action-modern"><Printer size={18} /><span>Print</span></button>
                <button className="btn-action-modern"><MoreVertical size={18} /><span>More</span></button>
              </div>
            </div>
            <div className="document-viewport-modern">
              <div className="document-wrapper-modern" style={{ width: `${zoom}%` }}>
                {file.blobUrl ? (
                  <iframe src={file.blobUrl} title={file.name} className="modern-iframe" />
                ) : (
                  <div className="paper-a4-modern">
                    <div className="paper-body-modern">
                      {pages[currentPage].split('\n').map((l, i) => <p key={i}>{l}</p>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>

          <aside className={`right-sidebar-modern ${showSidebar ? 'open' : ''}`}>
            <div className="sidebar-top-modern">
              <h3>AI Assistant</h3>
              <button className="close-sidebar-modern" onClick={() => setShowSidebar(false)}><X size={18} /></button>
            </div>
            <div className="sidebar-scroll-modern">
              <div className="ai-card-modern">
                <div className="card-header-modern"><Sparkles size={18} className="text-blue" /><span>AI Summarizer</span></div>
                <p>Get a quick summary of this document.</p>
                <button className="card-btn-modern">Summarize Document</button>
              </div>
              <div className="ai-card-modern">
                <div className="card-header-modern"><MessageSquare size={18} className="text-blue" /><span>AI Tutor</span></div>
                <p>Ask questions and get explained concepts.</p>
                <button className="card-btn-modern" onClick={() => navigate("/ai")}>Go to AI Tutor</button>
              </div>
              <div className="notes-section-modern">
                <div className="notes-header-modern">
                  <span>Notes</span>
                  <button className="add-note-btn"><Plus size={14} /> Add Note</button>
                </div>
                <div className="notes-empty-modern">
                  <StickyNote size={32} />
                  <p>No notes yet</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // --- MOBILE VIEW ---
  return (
    <div className={`reader-modern-mobile ${isFocusMode ? 'focus-mode' : ''}`}>
      <header className="mobile-reader-header">
        <div className="m-header-left">
          <button className="m-btn-back" onClick={() => navigate(-1)}><ChevronLeft size={24} /></button>
          <div className="m-file-info">
            <span className="m-file-name">{file.name}</span>
            <span className="m-page-indicator">{currentPage + 1} / {pages.length}</span>
          </div>
        </div>
        <div className="m-header-right">
          <div className="m-ai-actions">
            <button className="m-ai-btn tutor" onClick={() => navigate("/ai")}>
              <div className="m-ai-icon purple"><MessageSquare size={18} /></div>
              <span>AI Tutor</span>
            </button>
            <button className="m-ai-btn summarizer" onClick={() => setShowSidebar(true)}>
              <div className="m-ai-icon green"><Sparkles size={18} /></div>
              <span>AI Summarizer</span>
            </button>
          </div>
          <button className="m-btn-more"><MoreVertical size={20} /></button>
        </div>
      </header>

      <div className="m-secondary-toolbar">
        <div className="m-page-nav">
          <button onClick={() => setCurrentPage(Math.max(0, currentPage-1))} disabled={currentPage===0}><ChevronLeft size={20} /></button>
          <div className="m-page-input"><input type="text" value={currentPage+1} readOnly /><span>/ {pages.length}</span></div>
          <button onClick={() => setCurrentPage(Math.min(pages.length-1, currentPage+1))} disabled={currentPage===pages.length-1}><ChevronRight size={20} /></button>
        </div>
        <div className="m-zoom-controls">
          <button onClick={() => setZoom(Math.max(50, zoom-10))}><Minimize2 size={18} /></button>
          <span className="m-zoom-val">{zoom}%</span>
          <button onClick={() => setZoom(Math.min(200, zoom+10))}><Maximize2 size={18} /></button>
        </div>
        <button className="m-btn-fullscreen"><Maximize size={20} /></button>
      </div>

      <main className="m-document-viewport">
        <div className="m-document-wrapper" style={{ width: `${zoom}%` }}>
          {file.blobUrl ? (
            <div className="m-iframe-container"><iframe src={file.blobUrl} title={file.name} /></div>
          ) : (
            <div className="m-paper-a4">
              <div className="m-paper-body">{pages[currentPage].split('\n').map((l, i) => <p key={i}>{l}</p>)}</div>
            </div>
          )}
        </div>
      </main>

      <div className={`m-bottom-sheet ${showSidebar ? 'open' : ''}`}>
        <div className="sheet-handle" onClick={() => setShowSidebar(!showSidebar)}></div>
        <div className="sheet-content">
          <div className="sheet-card" onClick={() => navigate("/ai")}>
            <div className="sheet-card-icon green"><Sparkles size={20} /></div>
            <div className="sheet-card-info"><h4>AI Summarizer</h4><p>Get a quick summary of this document.</p></div>
            <ChevronRight size={18} className="text-muted" />
          </div>
          <div className="sheet-card" onClick={() => navigate("/ai")}>
            <div className="sheet-card-icon purple"><MessageSquare size={20} /></div>
            <div className="sheet-card-info"><h4>AI Tutor</h4><p>Ask questions and get explained concepts.</p></div>
            <ChevronRight size={18} className="text-muted" />
          </div>
        </div>
      </div>

      <nav className="m-bottom-toolbar">
        <button className={`m-tool-btn ${activeTool === 'highlighter' ? 'active' : ''}`} onClick={() => setActiveTool('highlighter')}><Highlighter size={20} /><span>Highlight</span></button>
        <button className={`m-tool-btn ${activeTool === 'pen' ? 'active' : ''}`} onClick={() => setActiveTool('pen')}><PenTool size={20} /><span>Draw</span></button>
        <button className={`m-tool-btn ${activeTool === 'text' ? 'active' : ''}`} onClick={() => setActiveTool('text')}><Type size={20} /><span>Text</span></button>
        <button className={`m-tool-btn ${activeTool === 'shape' ? 'active' : ''}`} onClick={() => setActiveTool('shape')}><Square size={20} /><span>Shapes</span></button>
        <button className={`m-tool-btn ${activeTool === 'eraser' ? 'active' : ''}`} onClick={() => setActiveTool('eraser')}><Eraser size={20} /><span>Eraser</span></button>
        <button className="m-tool-btn"><MoreVertical size={20} /><span>More</span></button>
      </nav>
    </div>
  );
}

export default Reader;
