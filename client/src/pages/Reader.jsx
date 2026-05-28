import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Sparkles, 
  ZoomIn, 
  ZoomOut,
  PenTool,
  Highlighter,
  RotateCcw,
  Sliders,
  PanelLeft,
  MousePointer2,
  AlertCircle,
  ChevronRight,
  Trash2,
  MessageSquare,
  Maximize2,
  Minimize2,
  Type,
  Square,
  Circle,
  Image as ImageIcon,
  ArrowUpRight,
  Eraser,
  StickyNote,
  X,
  Share2,
  BrainCircuit,
  HelpCircle,
  Link2,
  Minus,
  Printer,
  Layers,
  Plus,
  Play,
  Pause,
  Headphones,
  Volume2,
  Sun,
  Moon,
  BookOpen,
  Cloud
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "sonner";
import { notesService, flashcardsService, tasksService } from "../services/index";
import { exportNoteToPDF } from "../utils/pdfExport";
import VoiceTutor from "../components/VoiceTutor";
import "../styles/reader.css";
import "../styles/reader-mobile.css";
import "../styles/reader-tablet.css";
import SlashEditor from "../components/SlashEditor";
import NotebookPagePanel from "../components/NotebookPagePanel";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

function Reader({ zenMode, setZenMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(100);
  const [activeTool, setActiveTool] = useState("select");
  const [file, setFile] = useState(null);
  const [error, setError] = useState(false);
  const contentRef = useRef(null);
  
  const [pages, setPages] = useState([""]);
  const [currentPage, setCurrentPage] = useState(0); // Tracks visible page index in viewport
  const [showSidebar, setShowSidebar] = useState(false);
  const [showPagePanel, setShowPagePanel] = useState(false);
  const [showLeftRail, setShowLeftRail] = useState(true);
  
  // Reading presets
  const [readingTheme, setReadingTheme] = useState("light"); // light, sepia, dark
  const [fontFamily, setFontFamily] = useState("serif"); // serif, sans
  const [fontSize, setFontSize] = useState(16); // px
  const [paperStyle, setPaperStyle] = useState("blank"); // blank, ruled, grid, dotted

  // Breakpoints
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth < 768;

  // Features
  const [isSaving, setIsSaving] = useState(false);
  const [aiWorkspaceMode, setAiWorkspaceMode] = useState("chat"); // chat, summary
  const [summary, setSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  // Drawing states (Supports vertical multi-canvas layouts)
  const canvasRefs = useRef({});
  const fileInputRef = useRef(null);
  const isDrawingRef = useRef(false);
  const activeDrawingPageRef = useRef(null);
  const strokePointsRef = useRef([]);
  const lastStrokePointRef = useRef(null);
  const startPointRef = useRef({ x: 0, y: 0 });
  const [drawHistory, setDrawHistory] = useState({});
  const [penColor, setPenColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  
  // GoodNotes features: Pen presets, snap shapes
  const [penStyle, setPenStyle] = useState("ballpoint"); // ballpoint, fountain, brush, autosnap
  const [canvasSnapshot, setCanvasSnapshot] = useState(null);
  
  // Annotation states
  const [notes, setNotes] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [canvasImages, setCanvasImages] = useState([]);
  const [conceptSourceNoteId, setConceptSourceNoteId] = useState(null);
  const [activeStickyColor, setActiveStickyColor] = useState("#fef08a");
  const [textInput, setTextInput] = useState({ show: false, page: 0, x: 0, y: 0, value: "" });

  // Custom Pointer Capture drag values
  const [activeDragNote, setActiveDragNote] = useState(null);
  const [activeDragImage, setActiveDragImage] = useState(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [noteStartPos, setNoteStartPos] = useState({ x: 0, y: 0 });
  const [imgStartPos, setImgStartPos] = useState({ x: 0, y: 0 });
  
  // Context states for AI Sidebar
  const [plannerTasks, setPlannerTasks] = useState([]);
  const [totalFlashcards, setTotalFlashcards] = useState(0);
  const [aiMessages, setAiMessages] = useState([
    { role: "assistant", text: "Welcome to your Deep Reading space. Highlight any text to explain/summarize, or ask me questions about this document." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [currentResponseChunk, setCurrentResponseChunk] = useState("");

  const [selection, setSelection] = useState({ text: "", x: 0, y: 0, show: false });
  const [stickyContextMenu, setStickyContextMenu] = useState(null);
  const [showVoiceTutor, setShowVoiceTutor] = useState(false);

  const notesRef = useRef([]);
  const canvasImagesRef = useRef([]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    canvasImagesRef.current = canvasImages;
  }, [canvasImages]);

  // Ambient Focus Mode (Zen Reading)
  const [zenTimer, setZenTimer] = useState(25 * 60);
  const [zenTimerActive, setZenTimerActive] = useState(false);
  const [ambientAudioActive, setAmbientAudioActive] = useState(false);
  
  useEffect(() => {
    let interval = null;
    if (zenMode && zenTimerActive) {
      interval = setInterval(() => {
        setZenTimer((t) => {
          if (t <= 1) {
            setZenTimerActive(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [zenMode, zenTimerActive]);

  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);

  useEffect(() => {
    if (ambientAudioActive && zenMode) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 350; 

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.value = 900;
        bandpass.Q.value = 1.2;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.12; 

        const gainBP = ctx.createGain();
        gainBP.gain.value = 0.03;

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoise.connect(bandpass);
        bandpass.connect(gainBP);
        gainBP.connect(ctx.destination);

        whiteNoise.start();
        audioSourceRef.current = whiteNoise;
      } catch (err) {
        console.error("Failed to play synthesized rain sound", err);
      }
    } else {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch (err) { console.warn("Failed to stop audio source", err); }
        audioSourceRef.current = null;
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (err) { console.warn("Failed to close audio context", err); }
        audioContextRef.current = null;
      }
    }

    return () => {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch (err) { console.warn("Failed to stop audio source", err); }
        audioSourceRef.current = null;
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (err) { console.warn("Failed to close audio context", err); }
        audioContextRef.current = null;
      }
    };
  }, [ambientAudioActive, zenMode]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Resize listener
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const drawTools = ['pen', 'highlighter', 'eraser', 'shape', 'circle', 'line', 'arrow'];

  const resetDrawingState = useCallback(() => {
    isDrawingRef.current = false;
    activeDrawingPageRef.current = null;
    lastStrokePointRef.current = null;
    strokePointsRef.current = [];
    setCanvasSnapshot(null);
  }, []);

  const selectTool = useCallback((tool) => {
    resetDrawingState();
    setStickyContextMenu(null);
    setSelection(prev => ({ ...prev, show: false }));
    if (tool !== 'concept') {
      setConceptSourceNoteId(null);
    }
    setActiveTool(tool);
  }, [resetDrawingState]);

  // Fetch planners
  useEffect(() => {
    tasksService.getAll()
      .then(res => setPlannerTasks(res.data?.tasks || []))
      .catch(() => {});
    flashcardsService.getAll()
      .then(res => setTotalFlashcards(res.data?.flashcards?.length || 0))
      .catch(() => {});
  }, []);

  // Highlight selection listener
  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      const text = sel.toString().trim();
      
      if (text.length > 0 && activeTool === "select") {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setSelection({
          text,
          x: rect.left + (rect.width / 2),
          y: rect.top - 12 + window.scrollY,
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

  // Load Note contents
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
          setConnectors(found.connectors || []);
          setCanvasImages(found.canvasImages || []);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        const saved = localStorage.getItem("starNote_files");
        if (saved) {
          const files = JSON.parse(saved);
          const found = files.find(f => f._id === id || f.id === id);
          if (found) {
            setFile(found);
            setPages(found.pages || [found.content || ""]);
            setDrawHistory(found.drawHistory || {});
            setNotes(found.notes || []);
            setConnectors(found.connectors || []);
            setCanvasImages(found.canvasImages || []);
            return;
          }
        }
        setError(true);
      });
  }, [id]);

  const objectUrl = useMemo(() => {
    if (!file?.blobUrl) return null;

    if (file.blobUrl.startsWith("data:")) {
      return file.blobUrl;
    }

    if (file.blobUrl.startsWith("/uploads/")) {
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const backendUrl = isLocalhost
        ? `http://${window.location.hostname}:5000`
        : "https://starnote-backend.onrender.com";
      return `${backendUrl}${file.blobUrl}`;
    }

    return file.blobUrl;
  }, [file]);

  // Redraw Canvas content for all canvases when drawHistory is updated or mounted
  useEffect(() => {
    pages.forEach((_, idx) => {
      const canvas = canvasRefs.current[idx];
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const historyStack = drawHistory[idx] || [];
        if (historyStack.length > 0) {
          const img = new Image();
          img.src = historyStack[historyStack.length - 1];
          img.onload = () => ctx.drawImage(img, 0, 0);
        }
      }
    });
  }, [pages, drawHistory]);

  const saveFileChanges = useCallback(async (updates) => {
    setIsSaving(true);
    try {
      const res = await notesService.update(id, updates);
      setFile(res.data.note);
    } catch {
      setFile(prev => ({ ...prev, ...updates }));
    }
    setIsSaving(false);
  }, [id, setFile, setIsSaving]);

  // Sticky Note Pointer Down
  const handleStickyPointerDown = (note, e) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    setActiveDragNote(note.id);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setNoteStartPos({ x: note.x, y: note.y });
  };

  // Sticky Note Pointer Move
  const handleStickyPointerMove = (noteId, e) => {
    if (activeDragNote !== noteId) return;
    e.stopPropagation();
    
    // Find parent page wrapper to get bounding dimensions
    const pageWrapper = e.currentTarget.closest(".document-wrapper-modern");
    if (!pageWrapper) return;
    
    const rect = pageWrapper.getBoundingClientRect();
    const deltaX = e.clientX - dragStartPos.x;
    const deltaY = e.clientY - dragStartPos.y;
    
    const deltaPercentX = (deltaX / rect.width) * 100;
    const deltaPercentY = (deltaY / rect.height) * 100;
    
    let newX = noteStartPos.x + deltaPercentX;
    let newY = noteStartPos.y + deltaPercentY;
    
    newX = Math.max(0, Math.min(100 - 15, newX));
    newY = Math.max(0, Math.min(100 - 10, newY));
    
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, x: newX, y: newY } : n));
  };

  // Sticky Note Pointer Up
  const handleStickyPointerUp = (noteId, e) => {
    if (activeDragNote !== noteId) return;
    e.stopPropagation();
    e.target.releasePointerCapture(e.pointerId);
    setActiveDragNote(null);
    saveFileChanges({ notes: notesRef.current });
  };

  // Image Dragging Handlers
  const handleImagePointerDown = (img, e) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    setActiveDragImage(img.id);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setImgStartPos({ x: img.x, y: img.y });
  };

  const handleImagePointerMove = (imgId, e) => {
    if (activeDragImage !== imgId) return;
    e.stopPropagation();

    const pageWrapper = e.currentTarget.closest(".document-wrapper-modern");
    if (!pageWrapper) return;

    const rect = pageWrapper.getBoundingClientRect();
    const deltaX = e.clientX - dragStartPos.x;
    const deltaY = e.clientY - dragStartPos.y;

    const deltaPercentX = (deltaX / rect.width) * 100;
    const deltaPercentY = (deltaY / rect.height) * 100;

    let newX = imgStartPos.x + deltaPercentX;
    let newY = imgStartPos.y + deltaPercentY;

    newX = Math.max(0, Math.min(80, newX));
    newY = Math.max(0, Math.min(85, newY));

    setCanvasImages(prev => prev.map(img => img.id === imgId ? { ...img, x: newX, y: newY } : img));
  };

  const handleImagePointerUp = (imgId, e) => {
    if (activeDragImage !== imgId) return;
    e.stopPropagation();
    e.target.releasePointerCapture(e.pointerId);
    setActiveDragImage(null);
    saveFileChanges({ canvasImages: canvasImagesRef.current });
  };

  const handleImageUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newImg = {
        id: Date.now(),
        url: reader.result,
        page: currentPage,
        x: 35,
        y: 30,
        width: 180,
        height: 140
      };
      const updated = [...canvasImages, newImg];
      setCanvasImages(updated);
      saveFileChanges({ canvasImages: updated });
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const handleDeleteCanvasImage = (imgId) => {
    const updated = canvasImages.filter(img => img.id !== imgId);
    setCanvasImages(updated);
    saveFileChanges({ canvasImages: updated });
  };

  // Concept Mapping Connections & Context Menu
  const handleStickyNoteClick = useCallback((note, e) => {
    if (activeTool === "select") {
      if (e && e.currentTarget) {
        const rect = e.currentTarget.getBoundingClientRect();
        setStickyContextMenu({
          noteId: note.id,
          x: rect.left + (rect.width / 2),
          y: rect.top - 40,
          text: note.text,
          page: note.page,
          color: note.color,
          noteX: note.x,
          noteY: note.y
        });
      }
      return;
    }

    if (activeTool !== "concept") return;

    if (!conceptSourceNoteId) {
      setConceptSourceNoteId(note.id);
    } else {
      if (conceptSourceNoteId !== note.id) {
        const newConnector = {
          id: Date.now(),
          fromId: conceptSourceNoteId,
          toId: note.id,
          color: penColor,
          page: currentPage
        };
        const updatedConnectors = [...connectors, newConnector];
        setConnectors(updatedConnectors);
        saveFileChanges({ connectors: updatedConnectors });
      }
      setConceptSourceNoteId(null);
    }
  }, [activeTool, conceptSourceNoteId, penColor, currentPage, connectors, saveFileChanges]);

  const handleClearConnectors = () => {
    setConnectors([]);
    saveFileChanges({ connectors: [] });
  };

  // Page Navigation scrolling
  const jumpToPage = (index) => {
    const el = document.getElementById(`reader-page-container-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(index);
    }
  };

  // Scroll viewport observer (updates currentPage header dynamically)
  const handleViewportScroll = (e) => {
    const viewport = e.target;
    const pageElements = viewport.querySelectorAll(".document-wrapper-modern");
    let currentVisible = 0;
    let minDistance = Infinity;
    
    pageElements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      const distance = Math.abs(rect.top - 80); // 80px top header offset
      if (distance < minDistance) {
        minDistance = distance;
        currentVisible = index;
      }
    });
    
    
    setCurrentPage(currentVisible);
  };

  // ── Advanced Page Operations (GoodNotes/Notion style) ────────────────────

  // Add a page at position ("before" | "after") a given index, with a template
  const handleAddPage = (afterIdx, position = "after", templateId = "blank") => {
    if (file?.blobUrl) return;
    
    // Default to the last page if not provided by simple buttons
    const targetIdx = typeof afterIdx === 'number' && !isNaN(afterIdx) ? afterIdx : pages.length - 1;
    const insertAt = position === "after" ? targetIdx + 1 : targetIdx;
    const newPage = { __template: templateId, __title: `Page ${pages.length + 1}` };
    const newPages = [...pages];
    newPages.splice(insertAt, 0, newPage);
    setPages(newPages);

    // Shift drawHistory, notes, connectors at/after insertAt
    const newDH = {};
    Object.keys(drawHistory).forEach(k => {
      const i = parseInt(k);
      newDH[i < insertAt ? i : i + 1] = drawHistory[k];
    });
    setDrawHistory(newDH);

    const shiftedNotes = notes.map(n => n.page >= insertAt ? { ...n, page: n.page + 1 } : n);
    const shiftedConns = connectors.map(c => c.page >= insertAt ? { ...c, page: c.page + 1 } : c);
    setNotes(shiftedNotes);
    setConnectors(shiftedConns);

    saveFileChanges({ pages: newPages, drawHistory: newDH, notes: shiftedNotes, connectors: shiftedConns });
    setTimeout(() => jumpToPage(insertAt), 120);
  };

  // Duplicate a page (copies text content and drawings)
  const handleDuplicatePage = (pageIdx) => {
    if (file?.blobUrl) return;
    const srcPage = pages[pageIdx];
    const insertAt = pageIdx + 1;
    const newPage = typeof srcPage === 'object'
      ? { ...srcPage, __title: `${srcPage.__title || 'Page'} (copy)` }
      : srcPage;
    const newPages = [...pages];
    newPages.splice(insertAt, 0, newPage);
    setPages(newPages);

    const newDH = {};
    Object.keys(drawHistory).forEach(k => {
      const i = parseInt(k);
      if (i < insertAt) newDH[i] = drawHistory[k];
      else newDH[i + 1] = drawHistory[k];
    });
    if (drawHistory[pageIdx]) newDH[insertAt] = drawHistory[pageIdx];
    setDrawHistory(newDH);

    const shiftedNotes = notes.map(n => n.page >= insertAt ? { ...n, page: n.page + 1 } : n);
    const clonedNotes = notes.filter(n => n.page === pageIdx).map(n => ({ ...n, id: Date.now() + Math.random(), page: insertAt }));
    const allNotes = [...shiftedNotes, ...clonedNotes];
    setNotes(allNotes);

    const shiftedConns = connectors.map(c => c.page >= insertAt ? { ...c, page: c.page + 1 } : c);
    setConnectors(shiftedConns);

    saveFileChanges({ pages: newPages, drawHistory: newDH, notes: allNotes, connectors: shiftedConns });
    setTimeout(() => jumpToPage(insertAt), 120);
  };

  // Move page from one index to another (drag-to-reorder)
  const handleMovePage = (fromIdx, toIdx) => {
    if (fromIdx === toIdx || file?.blobUrl) return;
    const newPages = [...pages];
    const [moved] = newPages.splice(fromIdx, 1);
    newPages.splice(toIdx, 0, moved);
    setPages(newPages);

    // Re-map draw history
    const reorder = (arr) => {
      const copy = { ...arr };
      const moved = copy[fromIdx];
      const newMap = {};
      Object.keys(copy).forEach(k => {
        let i = parseInt(k);
        if (i === fromIdx) return;
        if (fromIdx < toIdx) { if (i > fromIdx && i <= toIdx) i--; }
        else { if (i >= toIdx && i < fromIdx) i++; }
        newMap[i] = copy[k];
      });
      if (moved) newMap[toIdx] = moved;
      return newMap;
    };
    const newDH = reorder(drawHistory);
    setDrawHistory(newDH);

    const reIdx = (page) => {
      if (page === fromIdx) return toIdx;
      if (fromIdx < toIdx && page > fromIdx && page <= toIdx) return page - 1;
      if (fromIdx > toIdx && page >= toIdx && page < fromIdx) return page + 1;
      return page;
    };
    const reNotes = notes.map(n => ({ ...n, page: reIdx(n.page) }));
    const reConns = connectors.map(c => ({ ...c, page: reIdx(c.page) }));
    setNotes(reNotes);
    setConnectors(reConns);

    saveFileChanges({ pages: newPages, drawHistory: newDH, notes: reNotes, connectors: reConns });
    setCurrentPage(toIdx);
  };

  // Change template of an existing page
  const handleSetPageTemplate = (pageIdx, templateId) => {
    if (file?.blobUrl) return;
    const newPages = pages.map((p, i) => {
      if (i !== pageIdx) return p;
      return typeof p === 'object' ? { ...p, __template: templateId } : { __template: templateId, __title: `Page ${i + 1}` };
    });
    setPages(newPages);
    saveFileChanges({ pages: newPages });
  };

  // Delete specific page (index-shifted)
  const handleDeletePage = (pageIdx) => {
    if (file?.blobUrl || pages.length <= 1) return;
    const newPages = pages.filter((_, i) => i !== pageIdx);
    setPages(newPages);
    const newDH = {};
    Object.keys(drawHistory).forEach(k => {
      const i = parseInt(k);
      if (i < pageIdx) newDH[i] = drawHistory[k];
      else if (i > pageIdx) newDH[i - 1] = drawHistory[k];
    });
    setDrawHistory(newDH);
    const newNotes = notes.filter(n => n.page !== pageIdx).map(n => n.page > pageIdx ? { ...n, page: n.page - 1 } : n);
    const newConns = connectors.filter(c => c.page !== pageIdx).map(c => c.page > pageIdx ? { ...c, page: c.page - 1 } : c);
    setNotes(newNotes); setConnectors(newConns);
    saveFileChanges({ pages: newPages, drawHistory: newDH, notes: newNotes, connectors: newConns });
    setCurrentPage(Math.max(0, pageIdx - 1));
  };

  // Sticky Note Operations
  const handleAddStickyClick = useCallback((pageIdx, e) => {
    if (activeTool !== "sticky" && activeTool !== "text") return;

    // Find bounding box coordinates of the specific clicked page
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeTool === "sticky") {
      const newNote = {
        id: Date.now(),
        text: "",
        page: pageIdx,
        x,
        y,
        color: activeStickyColor,
        date: new Date().toLocaleTimeString()
      };

      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
      saveFileChanges({ notes: updatedNotes });
      selectTool("select"); 
    } else if (activeTool === "text") {
      setTextInput({
        show: true,
        page: pageIdx,
        x,
        y,
        value: ""
      });
    }
  }, [activeTool, activeStickyColor, notes, saveFileChanges, selectTool]);

  const handleUpdateStickyText = (noteId, text) => {
    const updatedNotes = notes.map(n => n.id === noteId ? { ...n, text } : n);
    setNotes(updatedNotes);
  };

  const handleDeleteSticky = (noteId) => {
    const updatedNotes = notes.filter(n => n.id !== noteId);
    const updatedConnectors = connectors.filter(c => c.fromId !== noteId && c.toId !== noteId);
    setNotes(updatedNotes);
    setConnectors(updatedConnectors);
    saveFileChanges({ notes: updatedNotes, connectors: updatedConnectors });
  };

  const handleContextMenuAction = (action, color = null) => {
    if (!stickyContextMenu) return;
    const { noteId, text, page, noteX, noteY, color: currColor } = stickyContextMenu;

    if (action === "copy") {
      navigator.clipboard.writeText(text);
    } else if (action === "cut") {
      navigator.clipboard.writeText(text);
      handleDeleteSticky(noteId);
    } else if (action === "duplicate") {
      const newNote = {
        id: Date.now(),
        text,
        page,
        x: noteX + 2,
        y: noteY + 2,
        color: currColor,
        date: new Date().toLocaleTimeString()
      };
      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
      saveFileChanges({ notes: updatedNotes });
    } else if (action === "delete") {
      handleDeleteSticky(noteId);
    } else if (action === "color" && color) {
      const updatedNotes = notes.map(n => n.id === noteId ? { ...n, color } : n);
      setNotes(updatedNotes);
      saveFileChanges({ notes: updatedNotes });
      setActiveStickyColor(color);
    }
    
    setStickyContextMenu(null);
  };

  // Text Tool Canvas committer
  const commitCanvasText = () => {
    if (!textInput.value.trim() || textInput.page === undefined) {
      setTextInput({ show: false, page: 0, x: 0, y: 0, value: "" });
      return;
    }

    const pageIdx = textInput.page;
    const canvas = canvasRefs.current[pageIdx];
    if (!canvas) {
      isDrawingRef.current = false;
      activeDrawingPageRef.current = null;
      return;
    }
    const ctx = canvas.getContext("2d");

    const x = (textInput.x / 100) * canvas.width;
    const y = (textInput.y / 100) * canvas.height;

    ctx.font = "bold 20px Inter, system-ui, sans-serif";
    ctx.fillStyle = penColor;
    ctx.fillText(textInput.value, x, y);

    const dataUrl = canvas.toDataURL();
    setDrawHistory(prev => {
      const pageHistory = prev[pageIdx] || [];
      const newHistory = { ...prev, [pageIdx]: [...pageHistory, dataUrl] };
      saveFileChanges({ drawHistory: newHistory });
      return newHistory;
    });

    setTextInput({ show: false, page: 0, x: 0, y: 0, value: "" });
  };

  // AI completions
  const handleAiQuery = async (queryText, forceSystemContext = "") => {
    if (isAiResponding || !queryText.trim()) return;
    
    setIsAiResponding(true);
    setCurrentResponseChunk("");
    
    const newUserMessage = { role: "user", text: queryText };
    setAiMessages(prev => [...prev, newUserMessage]);
    setChatInput("");

    try {
      const selectionContext = selection.text ? `User selected text: "${selection.text}"` : "";
      const docContext = file?.content || pages[currentPage] || "";
      const pageInfo = `Reading page ${currentPage + 1} of ${pages.length}.`;
      const tasksInfo = plannerTasks.length ? `Planner tasks today: ${plannerTasks.slice(0, 3).map(t => t.title).join(", ")}` : "";
      
      const systemPrompt = `You are a calm, highly capable AI tutor assisting a student in a focused study session.
Context info:
- Active Document: "${file?.name || 'StarNote study note'}"
- Location: ${pageInfo}
- Document Text (current page context): "${docContext.substring(0, 2000)}"
${selectionContext ? `- Highlighted Text: "${selectionContext}"` : ""}
${tasksInfo ? `- Current Study Agenda: "${tasksInfo}"` : ""}
${forceSystemContext ? `- Special Instruction: ${forceSystemContext}` : ""}

Be precise, highly informative, use clean formatting with bold headings and bullet points. Stream your output.`;

      const messagesForGemini = [
        { role: "user", parts: [{ text: `${systemPrompt}\n\nUser Question: ${queryText}` }] }
      ];

      const result = await aiModel.generateContentStream({
        contents: messagesForGemini,
      });

      let fullText = "";
      for await (const chunk of result.stream) {
        const text = chunk.text();
        fullText += text;
        setCurrentResponseChunk(fullText);
      }

      setAiMessages(prev => [...prev, { role: "assistant", text: fullText }]);
      setCurrentResponseChunk("");
    } catch {
      setAiMessages(prev => [...prev, { role: "assistant", text: "I encountered an error preparing the contextual response. Please try again." }]);
    }
    setIsAiResponding(false);
  };

  const handleFloatingToolbarAction = (action) => {
    const text = selection.text;
    setSelection(s => ({ ...s, show: false }));
    window.getSelection().removeAllRanges();

    if (action === "explain") {
      setAiWorkspaceMode("chat");
      setShowSidebar(true);
      handleAiQuery(`Explain this concept in details: "${text}"`, "Explain this clearly with structural breakdown.");
    } else if (action === "summarize") {
      setAiWorkspaceMode("chat");
      setShowSidebar(true);
      handleAiQuery(`Summarize this text: "${text}"`, "Create a concise summary in bullet points.");
    } else if (action === "quiz") {
      setAiWorkspaceMode("chat");
      setShowSidebar(true);
      handleAiQuery(`Create a quick practice question about: "${text}"`, "Ask a quiz question, then offer the solution under a hidden spoiler format.");
    } else if (action === "notes") {
      const newSticky = {
        id: Date.now(),
        text: `Highlight:\n"${text}"`,
        page: currentPage,
        x: 40,
        y: 40,
        color: "#bfdbfe", 
        date: new Date().toLocaleTimeString()
      };
      const updated = [...notes, newSticky];
      setNotes(updated);
      saveFileChanges({ notes: updated });
    }
  };

  // Drawing Engine helpers
  const getCoordinates = (pageIdx, e) => {
    const canvas = canvasRefs.current[pageIdx];
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const applyDrawingStyle = (ctx, event = {}) => {
    if (activeTool === "highlighter") {
      ctx.strokeStyle = `${penColor}33`;
      ctx.lineWidth = strokeWidth * 4;
      ctx.globalCompositeOperation = "source-over";
    } else if (activeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = strokeWidth * 6;
    } else {
      ctx.strokeStyle = penColor;
      ctx.globalCompositeOperation = "source-over";
      const pressure = event.pressure !== undefined && event.pressure > 0 ? event.pressure : 0.5;
      if (penStyle === "fountain") {
        ctx.lineWidth = strokeWidth * (0.6 + pressure * 0.8);
      } else if (penStyle === "brush") {
        ctx.lineWidth = strokeWidth * (0.3 + pressure * 1.5);
      } else {
        ctx.lineWidth = strokeWidth;
      }
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const drawContinuousSegment = (ctx, point, event) => {
    const previous = lastStrokePointRef.current;
    if (!previous) {
      lastStrokePointRef.current = point;
      return;
    }

    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    const distance = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(distance / 2));

    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const nextPoint = {
        x: previous.x + dx * t,
        y: previous.y + dy * t,
      };

      applyDrawingStyle(ctx, event);
      ctx.beginPath();
      ctx.moveTo(lastStrokePointRef.current.x, lastStrokePointRef.current.y);
      ctx.lineTo(nextPoint.x, nextPoint.y);
      ctx.stroke();
      lastStrokePointRef.current = nextPoint;
    }
  };

  const startDrawing = (pageIdx, e) => {
    if (!drawTools.includes(activeTool)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    isDrawingRef.current = true;
    activeDrawingPageRef.current = pageIdx;
    
    const canvas = canvasRefs.current[pageIdx];
    if (!canvas) return;
    
    const { x, y } = getCoordinates(pageIdx, e);
    startPointRef.current = { x, y };
    strokePointsRef.current = [{ x, y }];
    lastStrokePointRef.current = { x, y };
    setCanvasSnapshot(canvas.toDataURL());

    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    applyDrawingStyle(ctx, e);
  };

  const draw = (e) => {
    if (!isDrawingRef.current || activeDrawingPageRef.current === null) return;
    e.preventDefault();
    const pageIdx = activeDrawingPageRef.current;
    const canvas = canvasRefs.current[pageIdx];
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCoordinates(pageIdx, e);

    const isShape = ["shape", "circle", "line", "arrow"].includes(activeTool);
    if (isShape) {
      const historyStack = drawHistory[pageIdx] || [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (historyStack.length > 0) {
        const img = new Image();
        img.src = historyStack[historyStack.length - 1];
        ctx.drawImage(img, 0, 0);
      }
      ctx.beginPath();
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = penColor;
      const { x: shapeStartX, y: shapeStartY } = startPointRef.current;

      if (activeTool === "shape") {
        ctx.strokeRect(shapeStartX, shapeStartY, x - shapeStartX, y - shapeStartY);
      } else if (activeTool === "circle") {
        const radius = Math.sqrt(Math.pow(x - shapeStartX, 2) + Math.pow(y - shapeStartY, 2));
        ctx.arc(shapeStartX, shapeStartY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (activeTool === "line") {
        ctx.moveTo(shapeStartX, shapeStartY);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (activeTool === "arrow") {
        drawArrow(ctx, shapeStartX, shapeStartY, x, y);
      }
    } else {
      const events = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [e];
      events.forEach((event) => {
        const point = getCoordinates(pageIdx, event);
        strokePointsRef.current.push(point);
        drawContinuousSegment(ctx, point, event);
      });
    }
  };

  const drawArrow = (ctx, fromX, fromY, toX, toY) => {
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - 15 * Math.cos(angle - Math.PI / 6), toY - 15 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - 15 * Math.cos(angle + Math.PI / 6), toY - 15 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = penColor;
    ctx.fill();
  };

  // Snaps freehand stroke shape outlines into geometrical shapes
  const detectAndDrawShape = (ctx, points) => {
    if (points.length < 6) return;
    const start = points[0];
    const end = points[points.length - 1];
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    
    const width = maxX - minX;
    const height = maxY - minY;
    const cx = minX + width / 2;
    const cy = minY + height / 2;
    
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const endDist = Math.sqrt(dx * dx + dy * dy);
    
    let sumRadius = 0;
    points.forEach(p => {
      const rx = p.x - cx;
      const ry = p.y - cy;
      sumRadius += Math.sqrt(rx * rx + ry * ry);
    });
    const avgRadius = sumRadius / points.length;
    
    let varRadius = 0;
    points.forEach(p => {
      const rx = p.x - cx;
      const ry = p.y - cy;
      const r = Math.sqrt(rx * rx + ry * ry);
      varRadius += Math.pow(r - avgRadius, 2);
    });
    const stdDevRadius = Math.sqrt(varRadius / points.length);
    const circularity = stdDevRadius / avgRadius; 
    
    ctx.beginPath();
    ctx.strokeStyle = penColor;
    ctx.lineWidth = strokeWidth;

    if (endDist < 60) {
      if (circularity < 0.18) {
        ctx.arc(cx, cy, avgRadius, 0, 2 * Math.PI);
        ctx.stroke();
      } else {
        ctx.strokeRect(minX, minY, width, height);
      }
    } else {
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawingRef.current || activeDrawingPageRef.current === null) return;
    e?.preventDefault?.();
    if (e?.currentTarget?.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const pageIdx = activeDrawingPageRef.current;
    isDrawingRef.current = false;
    const canvas = canvasRefs.current[pageIdx];
    if (!canvas) {
      activeDrawingPageRef.current = null;
      lastStrokePointRef.current = null;
      return;
    }
    const ctx = canvas.getContext("2d");

    if (activeTool === "pen" && penStyle === "autosnap") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (canvasSnapshot) {
        const img = new Image();
        img.src = canvasSnapshot;
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          detectAndDrawShape(ctx, strokePointsRef.current);
          commitCanvasState(pageIdx);
          activeDrawingPageRef.current = null;
          lastStrokePointRef.current = null;
        };
      } else {
        activeDrawingPageRef.current = null;
        lastStrokePointRef.current = null;
      }
    } else {
      commitCanvasState(pageIdx);
      activeDrawingPageRef.current = null;
      lastStrokePointRef.current = null;
    }
  };

  const commitCanvasState = (pageIdx) => {
    const canvas = canvasRefs.current[pageIdx];
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setDrawHistory(prev => {
      const pageHistory = prev[pageIdx] || [];
      const newHistory = { ...prev, [pageIdx]: [...pageHistory, dataUrl] };
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
      const canvas = canvasRefs.current[currentPage];
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
      const canvas = canvasRefs.current[currentPage];
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      saveFileChanges({ drawHistory: newHistory });
      return newHistory;
    });
  };

  const handlePrint = async () => {
    try {
      toast.info("Generating PDF… please wait.");
      await exportNoteToPDF(contentRef, file?.name || "My Note");
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Export failed. Please try again.");
    }
  };

  const toggleMobileTheme = () => {
    setReadingTheme(prev => {
      if (prev === "light") return "sepia";
      if (prev === "sepia") return "dark";
      return "light";
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

  return (
    <div className={`deep-reader-workspace ${zenMode ? 'zen-focus-active' : ''} theme-${readingTheme}`}>
      
      {/* Floating Highlight Toolbar */}
      <AnimatePresence>
        {selection.show && (
          <motion.div 
            className="premium-highlight-toolbar"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{ left: selection.x, top: selection.y }}
          >
            <button onClick={() => handleFloatingToolbarAction("explain")}>
              <BrainCircuit size={14} /> <span>Explain</span>
            </button>
            <button onClick={() => handleFloatingToolbarAction("summarize")}>
              <Sparkles size={14} /> <span>Summarize</span>
            </button>
            <button onClick={() => handleFloatingToolbarAction("quiz")}>
              <HelpCircle size={14} /> <span>Quiz</span>
            </button>
            <button onClick={() => handleFloatingToolbarAction("notes")}>
              <StickyNote size={14} /> <span>Save</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Concept Mapping Floating Status Assist */}
      {activeTool === 'concept' && (
        <div className="concept-mapping-helper-bar">
          <span>
            {conceptSourceNoteId 
              ? "🔗 Select target sticky note to create connector link" 
              : "🔗 Click source sticky note to start mapping connection"}
          </span>
          {conceptSourceNoteId && (
            <button onClick={() => setConceptSourceNoteId(null)}>Cancel</button>
          )}
          {connectors.length > 0 && (
            <button className="clear-concept-btn" onClick={handleClearConnectors}>Clear Map</button>
          )}
        </div>
      )}

      {/* 1. Header (Premium, Minimal) */}
      {!zenMode && (
        <header className="reader-header-modern">
          <div className="header-left">
            <button className="back-btn" onClick={() => navigate("/notes")}><ChevronLeft size={20} /></button>
            
            <button 
              className={`thumbnail-toggle-btn ${showPagePanel ? 'active' : ''}`}
              onClick={() => setShowPagePanel(!showPagePanel)}
              title="Manage notebook pages"
            >
              <Layers size={18} />
            </button>

            {!isMobile && (
              <button 
                className={`thumbnail-toggle-btn tool-rail-toggle-btn ${showLeftRail ? 'active' : ''}`}
                onClick={() => setShowLeftRail(!showLeftRail)}
                title={showLeftRail ? "Hide toolbar" : "Show toolbar"}
              >
                <Sliders size={18} />
              </button>
            )}

            <span className="file-name">{file?.name}</span>
            <div className="autosave-indicator" style={{ display: 'flex', alignItems: 'center', marginLeft: '12px', gap: '6px' }}>
              {isSaving ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--reader-accent)', fontSize: '11px', fontWeight: '600' }}>
                  <Cloud size={15} className="cloud-pulse" />
                  <span className="m-hide-mobile">Saving...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontSize: '11px', fontWeight: '600' }}>
                  <Cloud size={15} />
                  <span className="m-hide-mobile">Saved</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="header-actions">
            {/* Mobile Theme Cycle Toggle */}
            {isMobile && (
              <button 
                className="m-theme-toggle-btn" 
                onClick={toggleMobileTheme}
                title="Change display theme"
                style={{
                  background: 'var(--reader-accent-weak)',
                  border: '1px solid var(--reader-border)',
                  color: 'var(--reader-text)',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  marginRight: '8px'
                }}
              >
                {readingTheme === "light" && <Sun size={18} />}
                {readingTheme === "sepia" && <BookOpen size={18} />}
                {readingTheme === "dark" && <Moon size={18} />}
              </button>
            )}

            {/* Custom display settings */}
            <div className="display-pill-selector">
              <button className={readingTheme === "light" ? "active" : ""} onClick={() => setReadingTheme("light")}>Light</button>
              <button className={readingTheme === "sepia" ? "active" : ""} onClick={() => setReadingTheme("sepia")}>Sepia</button>
              <button className={readingTheme === "dark" ? "active" : ""} onClick={() => setReadingTheme("dark")}>Dark</button>
            </div>
            
            <div className="font-pill-selector">
              <button className={fontFamily === "serif" ? "active" : ""} onClick={() => setFontFamily("serif")}>Serif</button>
              <button className={fontFamily === "sans" ? "active" : ""} onClick={() => setFontFamily("sans")}>Sans</button>
            </div>

            <div className="size-selector">
              <button onClick={() => setFontSize(Math.max(12, fontSize - 2))}>A-</button>
              <span>{fontSize}px</span>
              <button onClick={() => setFontSize(Math.min(24, fontSize + 2))}>A+</button>
            </div>

            <button className="focus-mode-toggle" onClick={() => setZenMode(true)}>
              <Maximize2 size={16} /> <span>Focus</span>
            </button>

            <button
              className="focus-mode-toggle"
              onClick={() => navigate(`/mindmap/${id}`)}
              title="AI Mind Map"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', borderColor: 'rgba(99,102,241,0.2)' }}
            >
              <Play size={16} /> <span>Mind Map</span>
            </button>

            <button
              className="focus-mode-toggle"
              onClick={() => setShowVoiceTutor(true)}
              title="Voice Tutor"
              style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.2)' }}
            >
              <Volume2 size={16} /> <span>Listen</span>
            </button>
          </div>
        </header>
      )}

      {/* Voice Tutor Modal */}
      <AnimatePresence>
        {showVoiceTutor && (
          <VoiceTutor
            isOpen={showVoiceTutor}
            onClose={() => setShowVoiceTutor(false)}
            initialText={pages.join(" ")}
            initialTopic={file?.name || ""}
          />
        )}
      </AnimatePresence>

      {/* Main layout: left rail, page panel, reading workspace, right AI workspace */}
      <div className="reader-layout-modern">
        
        {/* 2. Left Floating Tool Rail */}
        {!zenMode && showLeftRail && (
          <aside className="left-tool-rail-premium">

            <div className="tool-category-title">Select</div>
            <button 
              className={`tool-icon ${activeTool === 'select' ? 'active' : ''}`} 
              onClick={() => selectTool('select')}
              title="Select / Drag sticky notes"
            >
              <MousePointer2 size={18} /> <span>Select</span>
            </button>

            <div className="tool-divider"></div>
            <div className="tool-category-title">Draw</div>

            <button 
              className={`tool-icon ${activeTool === 'pen' ? 'active' : ''}`} 
              onClick={() => selectTool('pen')}
              title="Pen & Brush presets"
            >
              <PenTool size={18} /> <span>Pen</span>
            </button>

            <button 
              className={`tool-icon ${activeTool === 'highlighter' ? 'active' : ''}`} 
              onClick={() => selectTool('highlighter')}
              title="Highlighter"
            >
              <Highlighter size={18} /> <span>Highlighter</span>
            </button>

            <button 
              className={`tool-icon ${activeTool === 'arrow' ? 'active' : ''}`} 
              onClick={() => selectTool('arrow')}
              title="Draw Arrows"
            >
              <ArrowUpRight size={18} /> <span>Arrow</span>
            </button>

            <button 
              className={`tool-icon ${activeTool === 'line' ? 'active' : ''}`} 
              onClick={() => selectTool('line')}
              title="Draw Lines"
            >
              <Minus size={18} /> <span>Line</span>
            </button>

            <div className="tool-divider"></div>
            <div className="tool-category-title">Shapes</div>

            <button 
              className={`tool-icon ${activeTool === 'shape' ? 'active' : ''}`} 
              onClick={() => selectTool('shape')}
              title="Rectangle Shape"
            >
              <Square size={18} /> <span>Rectangle</span>
            </button>

            <button 
              className={`tool-icon ${activeTool === 'circle' ? 'active' : ''}`} 
              onClick={() => selectTool('circle')}
              title="Circle Shape"
            >
              <Circle size={18} /> <span>Circle</span>
            </button>

            <div className="tool-divider"></div>
            <div className="tool-category-title">Notes</div>

            <button 
              className={`tool-icon ${activeTool === 'sticky' ? 'active' : ''}`} 
              onClick={() => selectTool('sticky')}
              title="Place Sticky Note"
            >
              <StickyNote size={18} /> <span>Sticky Note</span>
            </button>

            <button 
              className="tool-icon" 
              onClick={handleImageUploadClick}
              title="Add Image / Sticker"
            >
              <ImageIcon size={18} /> <span>Add Sticker</span>
            </button>

            <button 
              className={`tool-icon ${activeTool === 'text' ? 'active' : ''}`} 
              onClick={() => selectTool('text')}
              title="Add Canvas Text Label"
            >
              <Type size={18} /> <span>Text Label</span>
            </button>

            <button 
              className={`tool-icon ${activeTool === 'concept' ? 'active' : ''}`} 
              onClick={() => selectTool('concept')}
              title="Concept Map Connector Link"
            >
              <Link2 size={18} /> <span>Connector</span>
            </button>

            <div className="tool-divider"></div>
            <div className="tool-category-title">Edit</div>

            <button className="tool-icon" onClick={undo} title="Undo last draw">
              <RotateCcw size={18} /> <span>Undo Ink</span>
            </button>

            <button className={`tool-icon ${activeTool === 'eraser' ? 'active' : ''}`} onClick={() => selectTool('eraser')} title="Eraser">
              <Eraser size={18} /> <span>Eraser</span>
            </button>

            <button className="tool-icon" onClick={clearCanvas} title="Clear visible page drawing">
              <Trash2 size={18} /> <span>Clear Page</span>
            </button>

          </aside>
        )}

        {/* Expanded Tool Palette options (Rendered outside aside to prevent overflow clipping) */}
        {!zenMode && showLeftRail && !isMobile && activeTool !== 'select' && activeTool !== 'sticky' && activeTool !== 'concept' && (
          <div className="floating-stroke-options animate-slide-up">
            <div className="palette-section">
              <span>Color</span>
              <div className="color-dots">
                {["#000000", "#dc2626", "#2563eb", "#16a34a", "#ca8a04", "#7c3aed", "#ec4899", "#14b8a6"].map(c => (
                  <button 
                    key={c} 
                    className={`color-dot ${penColor === c ? 'active' : ''}`} 
                    style={{ backgroundColor: c }} 
                    onClick={() => setPenColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="palette-section">
              <span>Stroke Size</span>
              <div className="size-pills">
                {[1.5, 3, 6, 10].map(s => (
                  <button 
                    key={s} 
                    className={strokeWidth === s ? 'active' : ''} 
                    onClick={() => setStrokeWidth(s)}
                  >
                    {s}px
                  </button>
                ))}
              </div>
            </div>

            {activeTool === 'pen' && (
              <div className="palette-section">
                <span>Pen Type</span>
                <div className="pen-type-grid">
                  <button className={penStyle === "ballpoint" ? "active" : ""} onClick={() => setPenStyle("ballpoint")}>Ballpoint</button>
                  <button className={penStyle === "fountain" ? "active" : ""} onClick={() => setPenStyle("fountain")}>Fountain</button>
                  <button className={penStyle === "brush" ? "active" : ""} onClick={() => setPenStyle("brush")}>Brush Pen</button>
                  <button className={penStyle === "autosnap" ? "active" : ""} onClick={() => setPenStyle("autosnap")} title="Snaps drawings to shapes">Smart Shape</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Color selection for Sticky Notes (Rendered outside aside to prevent overflow clipping) */}
        {!zenMode && showLeftRail && !isMobile && activeTool === 'sticky' && (
          <div className="floating-stroke-options">
            <div className="palette-section">
              <span>Sticky Color</span>
              <div className="color-dots">
                {["#fef08a", "#bfdbfe", "#bbf7d0", "#fbcfe8", "#e9d5ff", "#e4e4e7"].map(c => (
                  <button 
                    key={c} 
                    className={`color-dot ${activeStickyColor === c ? 'active' : ''}`} 
                    style={{ backgroundColor: c }} 
                    onClick={() => setActiveStickyColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}


        {/* GoodNotes-style Page Organizer Panel */}
        {showPagePanel && !zenMode && (
          <NotebookPagePanel
            pages={pages}
            currentPage={currentPage}
            drawHistory={drawHistory}
            notes={notes}
            connectors={connectors}
            paperStyle={paperStyle}
            onClose={() => setShowPagePanel(false)}
            onJumpToPage={jumpToPage}
            onAddPage={(idx, position, templateId) => handleAddPage(idx, position, templateId)}
            onDuplicatePage={handleDuplicatePage}
            onMovePage={handleMovePage}
            onDeletePage={handleDeletePage}
            onSetTemplate={handleSetPageTemplate}
          />
        )}


        {/* 3. Immersive Center Reading Canvas (Dynamic Vertical Page Stack) */}
        <main className="immersive-center-reading-canvas">
          
          {/* Document and zoom controls */}
          {!zenMode && (
            <div className="canvas-header-controls">
              <div className="page-navigation-pill">
                <button onClick={() => jumpToPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}>
                  <ChevronLeft size={16} />
                </button>
                <span>Page {currentPage + 1} of {pages.length}</span>
                <button onClick={() => jumpToPage(Math.min(pages.length - 1, currentPage + 1))} disabled={currentPage === pages.length - 1}>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* GoodNotes Paper Selector (hidden for PDFs) */}
              {!file?.blobUrl && (
                <div className="paper-style-pill">
                  <button className={paperStyle === "blank" ? "active" : ""} onClick={() => setPaperStyle("blank")}>Blank</button>
                  <button className={paperStyle === "ruled" ? "active" : ""} onClick={() => setPaperStyle("ruled")}>Ruled</button>
                  <button className={paperStyle === "grid" ? "active" : ""} onClick={() => setPaperStyle("grid")}>Grid</button>
                  <button className={paperStyle === "dotted" ? "active" : ""} onClick={() => setPaperStyle("dotted")}>Dotted</button>
                </div>
              )}

              <div className="zoom-pill">
                <button onClick={() => setZoom(Math.max(50, zoom - 10))}><ZoomOut size={14} /></button>
                <span>{zoom}%</span>
                <button onClick={() => setZoom(Math.min(200, zoom + 10))}><ZoomIn size={14} /></button>
              </div>

              <div className="utility-buttons">
                {!file?.blobUrl && (
                  <button className="utility-btn btn-accent" onClick={handleAddPage}>
                    <Plus size={14} /> <span>Add Page</span>
                  </button>
                )}
                <button className="utility-btn" onClick={handlePrint}><Printer size={16} /> <span>Print/Export</span></button>
                <button className="utility-btn" onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Deep Link copied to clipboard!");
                }}><Share2 size={16} /> <span>Share</span></button>
              </div>
            </div>
          )}

          {/* Reading Canvas viewport - Stacks all notebook pages vertically */}
          <div 
            ref={contentRef}
            className="document-viewport-modern"
            onScroll={handleViewportScroll}
            onClick={() => setStickyContextMenu(null)}
          >
            {pages.map((pageTextContent, idx) => (
              <div 
                key={idx}
                id={`reader-page-container-${idx}`}
                className="document-wrapper-modern" 
                style={{ 
                  width: isMobile ? '100%' : `${800 * (zoom / 100)}px`,
                  minHeight: isMobile ? '110vw' : `${1100 * (zoom / 100)}px`,
                  position: 'relative',
                  marginBottom: '40px',
                  cursor: ['sticky', 'text'].includes(activeTool) ? 'cell' : (activeTool === 'concept' ? 'crosshair' : 'default')
                }}
                onClick={(e) => handleAddStickyClick(idx, e)}
              >
                {/* Concept Connector Links SVG Layer */}
                <svg 
                  className="connectors-svg" 
                  viewBox="0 0 100 100" 
                  preserveAspectRatio="none" 
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    pointerEvents: 'none', 
                    zIndex: 15 
                  }}
                >
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c3aed" />
                    </marker>
                  </defs>
                  {connectors
                    .filter(c => c.page === idx)
                    .map(c => {
                      const from = notes.find(n => n.id === c.fromId);
                      const to = notes.find(n => n.id === c.toId);
                      if (!from || !to) return null;
                      const x1 = from.x + 8;
                      const y1 = from.y + 7;
                      const x2 = to.x + 8;
                      const y2 = to.y + 7;
                      return (
                        <line 
                          key={c.id} 
                          x1={x1} 
                          y1={y1} 
                          x2={x2} 
                          y2={y2} 
                          stroke={c.color || "#7c3aed"} 
                          strokeWidth="0.4" 
                          markerEnd="url(#arrow)" 
                        />
                      );
                    })}
                </svg>

                {/* Whiteboard Overlay Canvas for current page */}
                <canvas 
                  ref={el => canvasRefs.current[idx] = el}
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    zIndex: 5,
                    pointerEvents: ['pen', 'highlighter', 'eraser', 'shape', 'circle', 'line', 'arrow'].includes(activeTool) ? 'auto' : 'none',
                    touchAction: 'none'
                  }}
                  width={900} 
                  height={1200}
                  onPointerDown={(e) => startDrawing(idx, e)}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerLeave={stopDrawing}
                  onPointerCancel={stopDrawing}
                />

                {/* Canvas Text Input Overlay (for direct text annotations) */}
                {textInput.show && textInput.page === idx && (
                  <div 
                    className="canvas-text-input-wrapper"
                    style={{
                      position: 'absolute',
                      left: `${textInput.x}%`,
                      top: `${textInput.y}%`,
                      zIndex: 25
                    }}
                  >
                    <input 
                      type="text"
                      autoFocus
                      placeholder="Type label..."
                      value={textInput.value}
                      onChange={(e) => setTextInput(prev => ({ ...prev, value: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          commitCanvasText();
                        } else if (e.key === 'Escape') {
                          setTextInput({ show: false, page: 0, x: 0, y: 0, value: "" });
                        }
                      }}
                      onBlur={commitCanvasText}
                      className="canvas-text-input-overlay"
                    />
                  </div>
                )}

                {/* Floating Post-it Sticky Notes on current page */}
                {notes
                  .filter(note => note.page === idx)
                  .map(note => (
                    <div 
                      key={note.id}
                      className={`floating-sticky-note ${conceptSourceNoteId === note.id ? 'active-concept-source' : ''}`}
                      style={{
                        left: `${note.x}%`,
                        top: `${note.y}%`,
                        backgroundColor: note.color,
                        touchAction: 'none'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStickyNoteClick(note, e);
                      }}
                    >
                      <div 
                        className="sticky-header"
                        onPointerDown={(e) => handleStickyPointerDown(note, e)}
                        onPointerMove={(e) => handleStickyPointerMove(note.id, e)}
                        onPointerUp={(e) => handleStickyPointerUp(note.id, e)}
                        style={{ cursor: activeTool === 'select' ? 'grab' : 'default' }}
                      >
                        <span className="sticky-time">{note.date}</span>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSticky(note.id);
                        }}><X size={12} /></button>
                      </div>
                      <textarea 
                        value={note.text} 
                        onChange={(e) => handleUpdateStickyText(note.id, e.target.value)}
                        onBlur={() => saveFileChanges({ notes: notesRef.current })}
                        placeholder="Take a note..."
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ))}

                {/* Floating Canvas Uploaded Images (Stickers/Photos) */}
                {canvasImages && canvasImages
                  .filter(img => img.page === idx)
                  .map(img => (
                    <div 
                      key={img.id}
                      className="floating-canvas-image-wrapper"
                      style={{
                        position: 'absolute',
                        left: `${img.x}%`,
                        top: `${img.y}%`,
                        width: `${img.width}px`,
                        height: `${img.height}px`,
                        touchAction: 'none',
                        zIndex: 20
                      }}
                      onPointerDown={(e) => handleImagePointerDown(img, e)}
                      onPointerMove={(e) => handleImagePointerMove(img.id, e)}
                      onPointerUp={(e) => handleImagePointerUp(img.id, e)}
                    >
                      <img 
                        src={img.url} 
                        alt="Sticker" 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'contain',
                          pointerEvents: 'none',
                          borderRadius: '8px',
                          border: activeTool === 'select' ? '2px dashed var(--reader-text)' : 'none'
                        }} 
                      />
                      {activeTool === 'select' && (
                        <button 
                          className="delete-img-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCanvasImage(img.id);
                          }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}

                {/* Document Source rendering (PDF / Rich Text editor) */}
                {file?.blobUrl ? (
                  file.fileType && file.fileType.startsWith("image/") ? (
                    <img src={file.blobUrl} alt={file.name} style={{ width: '100%', height: 'auto', display: 'block' }} />
                  ) : (
                    <iframe src={objectUrl || file.blobUrl} title={file.name} className="pdf-iframe-view" />
                  )
                ) : (
                  <div 
                    className={`paper-body-modern paper-${paperStyle}`}
                    style={{ fontFamily: fontFamily === 'serif' ? 'var(--font-serif)' : 'var(--font-sans)', fontSize: `${fontSize}px` }}
                  >
                    <SlashEditor 
                      initialContent={pageTextContent || ""}
                      onChange={(val) => {
                        const updated = [...pages];
                        updated[idx] = val;
                        setPages(updated);
                      }}
                      onBlur={() => saveFileChanges({ pages })}
                      onSummarize={() => {
                        setAiWorkspaceMode("chat");
                        handleAiQuery(`Summarize page ${idx + 1}`, `Provide a strict summary of page ${idx + 1} content.`);
                      }}
                      onFlashcard={async () => {
                        setAiWorkspaceMode("chat");
                        handleAiQuery(`Generate flashcards from page ${idx + 1}`, "Output exactly 3 flashcards in question & answer structure.");
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sticky Note Context Menu */}
          <AnimatePresence>
            {stickyContextMenu && (
              <motion.div 
                className="premium-context-menu"
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                style={{
                  position: 'absolute',
                  left: stickyContextMenu.x,
                  top: stickyContextMenu.y,
                  transform: 'translate(-50%, -100%)',
                  zIndex: 3000
                }}
              >
                <div className="context-menu-actions">
                  <button onClick={() => handleContextMenuAction('cut')}>Cut</button>
                  <button onClick={() => handleContextMenuAction('copy')}>Copy</button>
                  <button onClick={() => handleContextMenuAction('duplicate')}>Duplicate</button>
                  <button className="danger" onClick={() => handleContextMenuAction('delete')}>Delete</button>
                </div>
                <div className="context-menu-colors">
                  {['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff'].map(color => (
                    <button 
                      key={color} 
                      className={`color-swatch ${stickyContextMenu.color === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleContextMenuAction('color', color)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ambient Focus Mode Bar */}
          {zenMode && (
            <motion.div 
              className="ambient-focus-bar"
              initial={{ y: -50, opacity: 0, x: "-50%" }}
              animate={{ y: 0, opacity: 1, x: "-50%" }}
            >
              <div className="focus-timer">
                <span className="time-display">{formatTime(zenTimer)}</span>
                <button className="timer-btn" onClick={() => setZenTimerActive(!zenTimerActive)}>
                  {zenTimerActive ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button className="timer-btn" onClick={() => { setZenTimer(25 * 60); setZenTimerActive(false); }}>
                  <RotateCcw size={14} />
                </button>
              </div>

              <div className="focus-divider"></div>

              <div className="focus-audio">
                <button 
                  className={`audio-btn ${ambientAudioActive ? 'active' : ''}`} 
                  onClick={() => setAmbientAudioActive(!ambientAudioActive)}
                >
                  {ambientAudioActive ? <Volume2 size={16} /> : <Headphones size={16} />} 
                  <span>{ambientAudioActive ? 'Rain Focus' : 'Focus Audio'}</span>
                </button>
              </div>

              <div className="focus-divider"></div>

              <div className="focus-exit">
                <button className="exit-btn" onClick={() => setZenMode(false)}>
                  <Minimize2 size={16} /> <span>Exit</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Mobile Floating Bottom Dock (Beautiful, necessary features only) */}
          {isMobile && !zenMode && (
            <div className="m-bottom-toolbar-wrapper" role="toolbar" aria-label="Reader tool strip">
              <div className="m-bottom-toolbar floating-pill">
                <div className="m-tools-row">
                  <button
                    className={`m-tool-btn ${activeTool === 'select' ? 'active' : ''}`}
                    onClick={() => selectTool('select')}
                    tabIndex={0}
                    aria-label="Select tool"
                    aria-pressed={activeTool === 'select'}
                  >
                    <MousePointer2 size={18} /> <span>Select</span>
                  </button>
                  <button
                    className={`m-tool-btn ${activeTool === 'pen' ? 'active' : ''}`}
                    onClick={() => selectTool('pen')}
                    tabIndex={0}
                    aria-label="Pen tool"
                    aria-pressed={activeTool === 'pen'}
                  >
                    <PenTool size={18} /> <span>Pen</span>
                  </button>
                  <button
                    className={`m-tool-btn ${activeTool === 'highlighter' ? 'active' : ''}`}
                    onClick={() => selectTool('highlighter')}
                    tabIndex={0}
                    aria-label="Highlighter tool"
                    aria-pressed={activeTool === 'highlighter'}
                  >
                    <Highlighter size={18} /> <span>Highlight</span>
                  </button>
                  <button
                    className={`m-tool-btn ${activeTool === 'text' ? 'active' : ''}`}
                    onClick={() => selectTool('text')}
                    tabIndex={0}
                    aria-label="Text tool"
                    aria-pressed={activeTool === 'text'}
                  >
                    <Type size={18} /> <span>Text</span>
                  </button>
                  <button
                    className={`m-tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
                    onClick={() => selectTool('eraser')}
                    tabIndex={0}
                    aria-label="Eraser tool"
                    aria-pressed={activeTool === 'eraser'}
                  >
                    <Eraser size={18} /> <span>Eraser</span>
                  </button>
                  <button
                    className={`m-tool-btn ${activeTool === 'sticky' ? 'active' : ''}`}
                    onClick={() => selectTool('sticky')}
                    tabIndex={0}
                    aria-label="Sticky note tool"
                    aria-pressed={activeTool === 'sticky'}
                  >
                    <StickyNote size={18} /> <span>Note</span>
                  </button>
                </div>
              </div>

              <button
                className={`m-ai-dock-btn ${showSidebar ? 'active' : ''}`}
                onClick={() => setShowSidebar((value) => !value)}
                tabIndex={0}
                aria-label="Open AI Tutor"
                aria-pressed={showSidebar}
                aria-expanded={showSidebar}
              >
                <MessageSquare size={18} />
              </button>
            </div>
          )}
          {/* Mobile Tool Options Panel */}
          {isMobile && !zenMode && ['pen', 'highlighter', 'sticky'].includes(activeTool) && (
            <div className="m-tool-options-panel">
              <div className="m-drag-handle" style={{ width: '40px', height: '4px', background: 'var(--reader-border)', borderRadius: '2px', margin: '0 auto 8px auto', opacity: 0.7 }}></div>
              <button className="m-close-options" onClick={() => selectTool('select')}>
                <X size={16} />
              </button>
              
              {activeTool === 'sticky' && (
                <div className="palette-section">
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--m-muted)' }}>Sticky Note Color</span>
                  <div className="color-dots" style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    {["#fef08a", "#bfdbfe", "#bbf7d0", "#fbcfe8", "#e9d5ff", "#e4e4e7"].map(c => (
                      <button 
                        key={c} 
                        className={`color-dot ${activeStickyColor === c ? 'active' : ''}`} 
                        style={{ 
                          backgroundColor: c, 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '50%', 
                          border: activeStickyColor === c ? '2px solid var(--reader-text)' : '1px solid rgba(0,0,0,0.1)',
                          cursor: 'pointer'
                        }} 
                        onClick={() => setActiveStickyColor(c)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {(activeTool === 'pen' || activeTool === 'highlighter') && (
                <>
                  <div className="palette-section">
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--m-muted)' }}>Color</span>
                    <div className="color-dots" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {["#000000", "#dc2626", "#2563eb", "#16a34a", "#ca8a04", "#7c3aed", "#ec4899", "#14b8a6"].map(c => (
                        <button 
                          key={c} 
                          className={`color-dot ${penColor === c ? 'active' : ''}`} 
                          style={{ 
                            backgroundColor: c, 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '50%', 
                            border: penColor === c ? '2px solid var(--reader-text)' : '1px solid rgba(0,0,0,0.1)',
                            cursor: 'pointer'
                          }} 
                          onClick={() => setPenColor(c)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="palette-section">
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--m-muted)' }}>Stroke Width</span>
                    <div className="size-pills" style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      {[1.5, 3, 6, 10].map(s => (
                        <button 
                          key={s} 
                          style={{
                            flex: 1,
                            padding: '6px',
                            background: strokeWidth === s ? 'var(--m-blue-weak)' : 'transparent',
                            color: strokeWidth === s ? 'var(--m-blue)' : 'var(--m-muted)',
                            border: strokeWidth === s ? '1px solid var(--m-blue)' : '1px solid var(--m-border)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          onClick={() => setStrokeWidth(s)}
                        >
                          {s}px
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTool === 'pen' && (
                <div className="palette-section">
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--m-muted)' }}>Pen Type</span>
                  <div className="pen-type-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '6px' }}>
                    {[
                      { id: "ballpoint", label: "Ballpoint" },
                      { id: "fountain", label: "Fountain" },
                      { id: "brush", label: "Brush Pen" },
                      { id: "autosnap", label: "Smart Shape" }
                    ].map(p => (
                      <button 
                        key={p.id}
                        style={{
                          padding: '8px',
                          background: penStyle === p.id ? 'var(--m-blue-weak)' : 'transparent',
                          color: penStyle === p.id ? 'var(--m-blue)' : 'var(--m-text)',
                          border: penStyle === p.id ? '1px solid var(--m-blue)' : '1px solid var(--m-border)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        onClick={() => setPenStyle(p.id)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* 4. Right Contextual AI Workspace */}
        {showSidebar && !zenMode && (
          <aside className="right-ai-workspace-premium">
            <div className="ai-workspace-header">
              <div className="workspace-tabs">
                <button 
                  className={aiWorkspaceMode === "chat" ? "active" : ""} 
                  onClick={() => setAiWorkspaceMode("chat")}
                >
                  AI Tutor
                </button>
                <button 
                  className={aiWorkspaceMode === "summary" ? "active" : ""} 
                  onClick={() => {
                    setAiWorkspaceMode("summary");
                    if (!summary) handleFloatingToolbarAction("summarize");
                  }}
                >
                  Doc Summary
                </button>
              </div>
              <button className="close-workspace-btn" onClick={() => setShowSidebar(false)}><X size={18} /></button>
            </div>

            {/* Context Signals indicators */}
            <div className="contextual-signals-panel">
              <div className="section-title">Context Signals Detected</div>
              <div className="signals-row">
                <span className="signal-pill">📄 {file?.name?.substring(0, 15)}...</span>
                <span className="signal-pill">📍 Page {currentPage + 1}</span>
                {selection.text && <span className="signal-pill active-selection">🔍 Selection active</span>}
                {plannerTasks.length > 0 && <span className="signal-pill">📅 Planner: {plannerTasks.length} open</span>}
                <span className="signal-pill">🎴 Flashcards: {totalFlashcards}</span>
              </div>
            </div>

            <div className="ai-content-body">
              {aiWorkspaceMode === "chat" ? (
                <div className="ai-chat-container">
                  <div className="chat-messages-scroll">
                    {aiMessages.map((m, idx) => (
                      <div key={idx} className={`chat-bubble ${m.role}`}>
                        <div className="bubble-header">{m.role === "assistant" ? "StarNote AI" : "You"}</div>
                        <div className="bubble-text">{m.text}</div>
                      </div>
                    ))}
                    {isAiResponding && (
                      <div className="chat-bubble assistant responding">
                        <div className="bubble-header">StarNote AI (typing...)</div>
                        <div className="bubble-text">{currentResponseChunk || "Thinking..."}</div>
                      </div>
                    )}
                  </div>
                  
                  <form 
                    className="ai-chat-input-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAiQuery(chatInput);
                    }}
                  >
                    <input 
                      type="text" 
                      placeholder={selection.text ? "Ask about highlighted text..." : "Ask AI Tutor anything..."} 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={isAiResponding}
                    />
                    <button type="submit" disabled={isAiResponding || !chatInput.trim()}>
                      <Sparkles size={16} />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="ai-summary-container">
                  <div className="summary-scrollable">
                    <h3>Document Overview</h3>
                    {isSummarizing ? (
                      <p className="loading-state">Synthesizing document elements...</p>
                    ) : (
                      <p className="summary-content-text">
                        {summary || "No overview generated yet. Click below to summarize."}
                      </p>
                    )}
                    <button 
                      className="generate-overview-btn" 
                      onClick={async () => {
                        setIsSummarizing(true);
                        try {
                          const prompt = `Summarize this text in 3 paragraphs focusing on key insights: ${(file?.content || pages.join("\n")).substring(0, 5000)}`;
                          const res = await aiModel.generateContent(prompt);
                          setSummary(res.response.text());
                        } catch {
                          setSummary("Failed to generate summary completion.");
                        }
                        setIsSummarizing(false);
                      }}
                      disabled={isSummarizing}
                    >
                      {isSummarizing ? "Processing..." : "Generate Full Summary"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Sidebar trigger when closed (desktop only) */}
        {!showSidebar && !zenMode && !isMobile && (
          <button className="expand-sidebar-floating-btn" onClick={() => setShowSidebar(true)} aria-label="Open AI Tutor sidebar">
            <MessageSquare size={20} />
          </button>
        )}

        {/* Left Tool Rail trigger when closed */}
        {!showLeftRail && !zenMode && !isMobile && (
          <button 
            className="expand-left-rail-floating-btn" 
            onClick={() => setShowLeftRail(true)}
            title="Show toolbar"
          >
            <PanelLeft size={20} />
          </button>
        )}
      </div>

      {/* Hidden file selector for canvas images / stickers */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageFileChange} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />
    </div>
  );
}

export default Reader;
