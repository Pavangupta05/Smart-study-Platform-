import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { 
  UploadCloud, X, FileText, ChevronRight, Image as ImageIcon,
  Smile, Plus, MoreHorizontal, Trash2, ExternalLink, Edit3,
  FolderPlus, Grid, List as ListIcon, Search, Folder
} from "lucide-react";
import { notesService } from "../services/index";
import { useUser } from "../context/UserContext";
import { toast } from "sonner";
import "../styles/notes.css";

function Notes() {
  const { category } = useParams();
  const navigate = useNavigate();
  const { socket } = useUser();
  const fileInputRef = useRef(null);

  // --- UI States ---
  const [pageIcon, setPageIcon] = useState("📓");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("notes_view") || "grid"); // grid | list
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const coverInputRef = useRef(null);

  // --- UI Polish States ---
  const [renameModal, setRenameModal] = useState({ isOpen: false, index: null, currentName: "" });
  const [isLoading, setIsLoading] = useState(true);

  // --- Upload & File State ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // --- Paginated notes state ---
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const PAGE_LIMIT = 20;

  const fetchNotes = (reset = true) => {
    const params = { limit: PAGE_LIMIT };
    if (!reset && nextCursor) params.cursor = nextCursor;

    const setLoading = reset ? setIsLoading : setIsFetchingMore;
    setLoading(true);

    notesService.getAll(params).then(res => {
      const incoming = res.data.notes || [];
      setUploadedFiles(prev => reset ? incoming : [...prev, ...incoming]);
      setNextCursor(res.data.nextCursor || null);
      setHasMore(res.data.hasMore || false);
    }).catch(err => {
      console.error(err);
      if (reset) {
        const saved = localStorage.getItem("starNote_files");
        if (saved) setUploadedFiles(JSON.parse(saved));
      }
    }).finally(() => setLoading(false));
  };

  const loadMore = () => {
    if (!hasMore || isFetchingMore) return;
    fetchNotes(false);
  };

  useEffect(() => {
    setIsLoading(true);
    fetchNotes(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("sync_notes", () => fetchNotes(true));
    return () => socket.off("sync_notes");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const filteredFiles = category 
    ? uploadedFiles.filter(f => f.category === category || f.cat === category)
    : uploadedFiles;

  const emojis = ["📓", "✨", "🧠", "💡", "📚", "🎯", "🎓", "🌟", "🔥"];
  const handleAddIcon = () => {
    const currentIndex = emojis.indexOf(pageIcon);
    const nextIndex = (currentIndex + 1) % emojis.length;
    setPageIcon(emojis[nextIndex]);
  };

  // --- Handlers ---
  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImage(event.target.result);
        setHasCover(true);
        localStorage.setItem("starNote_cover", event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("name", selectedFile.name);
    formData.append("size", (selectedFile.size / (1024 * 1024)).toFixed(1) + " MB");
    formData.append("icon", selectedFile.type.includes("pdf") ? "📕" : "📄");
    formData.append("category", category || "general");
    formData.append("fileType", selectedFile.type);

    try {
      // Simulate progress since we don't have direct upload progress from axios yet
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 15;
        if (progress > 90) progress = 90;
        setUploadProgress(progress);
      }, 100);

      const res = await notesService.create(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploadedFiles(prev => [res.data.note, ...prev]);
        showToast("File uploaded successfully.");
        setSelectedFile(null);
        setIsUploading(false);
        setUploadProgress(0);
      }, 400);

    } catch (err) {
      console.error("Upload error:", err);
      setIsUploading(false);
      setUploadProgress(0);
      showToast("Upload failed. Please try again.");
    }
  };

  const showToast = (message) => {
    toast(message);
  };

  const deleteFile = async (e, globalIndex) => {
    e.stopPropagation();
    const fileToTrash = uploadedFiles[globalIndex];
    const id = fileToTrash._id || fileToTrash.id;
    
    try {
      if (id) await notesService.trash(id);
      const updated = uploadedFiles.filter((_, i) => i !== globalIndex);
      setUploadedFiles(updated);
      showToast(`"${fileToTrash.name}" moved to trash.`);
    } catch (err) {
      console.error(err);
    } finally {
      setActiveMenuId(null);
    }
  };

  const handleRename = (e, globalIndex) => {
    e.stopPropagation();
    setRenameModal({ isOpen: true, index: globalIndex, currentName: uploadedFiles[globalIndex].name });
    setActiveMenuId(null);
  };

  const confirmRename = async () => {
    if (renameModal.currentName.trim() !== "") {
      const file = uploadedFiles[renameModal.index];
      const id = file._id || file.id;
      
      try {
        if (id) {
          const res = await notesService.update(id, { name: renameModal.currentName });
          const updated = [...uploadedFiles];
          updated[renameModal.index] = res.data.note;
          setUploadedFiles(updated);
        }
        showToast("File renamed successfully.");
      } catch (err) {
        console.error(err);
      }
    }
    setRenameModal({ isOpen: false, index: null, currentName: "" });
  };

  const handleDuplicate = async (e, globalIndex) => {
    e.stopPropagation();
    const fileToDup = uploadedFiles[globalIndex];
    const newName = fileToDup.name + " (Copy)";
    
    try {
      // Fix 9: Strip MongoDB fields and send a clean JSON body (not FormData)
      const { _id, id, createdAt, updatedAt, __v, ...rest } = fileToDup;
      const dupData = { ...rest, name: newName };
      // If the original was a file upload (has fileUrl), create as notebook instead
      if (dupData.fileUrl) delete dupData.fileUrl;
      const res = await notesService.create(dupData);
      setUploadedFiles(prev => [res.data.note, ...prev]);
      showToast("File duplicated.");
    } catch (err) {
      console.error(err);
      showToast("Could not duplicate file.");
    } finally {
      setActiveMenuId(null);
    }
  };

  const createNewNotebook = async () => {
    try {
      const formData = new FormData();
      formData.append("name", "My New Notebook");
      formData.append("size", "0.1 MB");
      formData.append("icon", "📓");
      formData.append("category", "personal");
      formData.append("fileType", "notebook");
      formData.append("pages", JSON.stringify([" "]));
      
      const res = await notesService.create(formData);
      setUploadedFiles(prev => [res.data.note, ...prev]);
      const noteId = res.data.note._id || res.data.note.id;
      if (noteId) {
        navigate(`/reader/${noteId}`);
      } else {
        showToast("Error: Note ID missing from response.");
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || "Failed to create notebook");
    }
  };

  const createNewFolder = async () => {
    try {
      const formData = new FormData();
      formData.append("name", "New Folder");
      formData.append("size", "--");
      formData.append("icon", "📁");
      formData.append("category", category || "general");
      formData.append("fileType", "folder");

      const res = await notesService.create(formData);
      setUploadedFiles(prev => [res.data.note, ...prev]);
      showToast("Folder created successfully.");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || "Failed to create folder");
    }
  };

  const TABS = ["All", "Personal", "University", "Work"];

  const filteredAndSearched = filteredFiles.filter(f =>
    !searchQuery || f.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTabCount = (tab) => {
    if (tab === "All") return uploadedFiles.length;
    return uploadedFiles.filter(f => f.category === tab.toLowerCase() || f.cat === tab.toLowerCase()).length;
  };

  const toggleView = (mode) => {
    setViewMode(mode);
    localStorage.setItem("notes_view", mode);
  };

  const getExcerpt = (f) => {
    const raw = f.content || (Array.isArray(f.pages) ? f.pages[0] : "") || "";
    const text = raw.replace(/<[^>]+>/g, "").trim();
    return text.length > 80 ? text.slice(0, 80) + "…" : text;
  };

  return (
    <div className="notes-page" onClick={() => setActiveMenuId(null)}>

      {/* ─── Sticky top bar ───────────────────────────────────────────── */}
      <div className="notes-topbar">
        <div className="notes-topbar-left">
          <span className="notes-breadcrumb">
            <span>Private</span>
            <ChevronRight size={13} />
            <span className="notes-breadcrumb-active">{category ? category.charAt(0).toUpperCase() + category.slice(1) : "All Notes"}</span>
          </span>
        </div>
        <div className="notes-topbar-right">
          <div className="notes-search-box">
            <Search size={14} className="notes-search-icon" />
            <input
              type="text"
              placeholder="Search notes…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
            {searchQuery && <button onClick={() => setSearchQuery("")}><X size={12} /></button>}
          </div>
          <div className="notes-view-toggle">
            <button className={viewMode === "grid" ? "active" : ""} title="Grid" onClick={() => toggleView("grid")}><Grid size={15} /></button>
            <button className={viewMode === "list" ? "active" : ""} title="List" onClick={() => toggleView("list")}><ListIcon size={15} /></button>
          </div>
          <button className="notes-new-btn" onClick={createNewNotebook}>
            <Plus size={15} /> New Note
          </button>
          <button
            className={`notes-upload-btn ${showUpload ? "active" : ""}`}
            onClick={e => { e.stopPropagation(); setShowUpload(v => !v); }}
            title="Upload file"
          >
            <UploadCloud size={15} />
          </button>
        </div>
      </div>

      {/* ─── Upload zone (collapsible) ────────────────────────────────── */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            className="notes-upload-zone-wrapper"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={`notion-drop-zone ${isDragging ? "active" : ""}`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); setSelectedFile(e.dataTransfer.files[0]); }}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: "none" }} />
              {!selectedFile ? (
                <div className="upload-prompt">
                  <UploadCloud size={22} />
                  <div>
                    <span>Click or drag to upload to <b>{category || "Workspace"}</b></span>
                    <span className="upload-sub">PDF, images, documents</span>
                  </div>
                </div>
              ) : (
                <div className="file-ready" onClick={e => e.stopPropagation()}>
                  <FileText size={20} style={{ color: "var(--accent-blue)" }} />
                  <div className="file-ready-info">
                    <span className="name">{selectedFile.name}</span>
                    <span className="size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  {isUploading ? (
                    <div className="upload-progress-container">
                      <div className="progress-bar-mini"><div className="progress-fill" style={{ width: `${uploadProgress}%` }} /></div>
                      <span className="progress-pct">{uploadProgress}%</span>
                    </div>
                  ) : (
                    <div className="upload-actions">
                      <button className="btn-confirm-upload" onClick={handleUpload}>Upload</button>
                      <button className="btn-cancel-file" onClick={() => setSelectedFile(null)}><X size={14} /></button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Category tabs ────────────────────────────────────────────── */}
      <div className="notes-tabs-bar">
        {TABS.map(tab => {
          const tabPath = tab === "All" ? "/notes" : `/notes/${tab.toLowerCase()}`;
          const isActive = tab === "All" ? !category : category === tab.toLowerCase();
          const count = getTabCount(tab);
          return (
            <button
              key={tab}
              className={`ntab ${isActive ? "active" : ""}`}
              onClick={e => { e.stopPropagation(); navigate(tabPath); }}
            >
              {tab}
              {count > 0 && <span className="ntab-count">{count}</span>}
              {isActive && (
                <motion.div
                  layoutId="notes-tab-indicator"
                  className="ntab-indicator"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Notes grid / list ───────────────────────────────────────── */}
      <div className="notes-body">
        {isLoading ? (
          <div className={`notes-grid ${viewMode === "list" ? "notes-list" : ""}`}>
            {[1, 2, 3, 4, 6].map(i => (
              <div className="notion-card skeleton" key={`skel-${i}`}>
                <div className="skeleton-icon" />
                <div className="skeleton-text short" />
                <div className="skeleton-text long" />
              </div>
            ))}
          </div>
        ) : filteredAndSearched.length === 0 ? (
          <div className="notes-empty fade-in-up">
            <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
              <rect x="20" y="14" width="40" height="52" rx="4" stroke="var(--border-focus)" strokeWidth="1.5" fill="var(--surface-hover)" />
              <line x1="30" y1="28" x2="50" y2="28" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="30" y1="36" x2="46" y2="36" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="30" y1="44" x2="48" y2="44" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="56" cy="56" r="14" fill="var(--bg)" stroke="var(--border)" strokeWidth="1.5" />
              <line x1="56" y1="50" x2="56" y2="62" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
              <line x1="50" y1="56" x2="62" y2="56" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h3>{searchQuery ? "No results found" : "No notes yet"}</h3>
            <p>{searchQuery ? `Nothing matches "${searchQuery}"` : `Your ${category || "workspace"} is empty.`}</p>
            {!searchQuery && (
              <div className="notes-empty-actions">
                <button className="btn-primary" onClick={createNewNotebook}>
                  <Plus size={14} /> New Notebook
                </button>
                <button className="btn-outline" onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud size={14} /> Upload
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className={`notes-grid ${viewMode === "list" ? "notes-list" : ""}`}>
              {filteredAndSearched.map(f => {
                const globalIndex = uploadedFiles.indexOf(f);
                const id = f._id || f.id || globalIndex;
                const excerpt = getExcerpt(f);
                const dateStr = f.updatedAt ? new Date(f.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : f.date || "—";
                const catTag = f.category || f.cat;
                return (
                  <motion.div
                    key={id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className="notion-card"
                    onClick={() => navigate(`/reader/${id}`)}
                  >
                    {/* Card top: icon + menu */}
                    <div className="nc-header">
                      <span className="nc-icon">{f.icon || "📄"}</span>
                      <button
                        className="nc-menu-btn"
                        onClick={e => { e.stopPropagation(); setActiveMenuId(activeMenuId === globalIndex ? null : globalIndex); }}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                    </div>

                    {/* Card body */}
                    <div className="nc-body">
                      <h3 className="nc-title">{f.name || "Untitled"}</h3>
                      {excerpt && <p className="nc-excerpt">{excerpt}</p>}
                    </div>

                    {/* Card footer */}
                    <div className="nc-footer">
                      {catTag && <span className="nc-tag">{catTag}</span>}
                      <span className="nc-date">{dateStr}</span>
                    </div>

                    {/* Dropdown menu */}
                    <AnimatePresence>
                      {activeMenuId === globalIndex && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.97 }}
                          transition={{ duration: 0.12 }}
                          className="card-dropdown"
                          onClick={e => e.stopPropagation()}
                        >
                          <button className="dropdown-item" onClick={() => navigate(`/reader/${id}`)}><ExternalLink size={13} /> Open</button>
                          <button className="dropdown-item" onClick={e => handleRename(e, globalIndex)}><Edit3 size={13} /> Rename</button>
                          <button className="dropdown-item" onClick={e => handleDuplicate(e, globalIndex)}><FileText size={13} /> Duplicate</button>
                          <div className="dropdown-divider" />
                          <button className="dropdown-item delete" onClick={e => deleteFile(e, globalIndex)}><Trash2 size={13} /> Move to Trash</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {/* Quick-add cards */}
              <div className="notion-card add-card" onClick={createNewNotebook}><Plus size={18} /><span>New Notebook</span></div>
              <div className="notion-card add-card" onClick={createNewFolder}><FolderPlus size={18} /><span>New Folder</span></div>
              <div className="notion-card add-card" onClick={() => navigate("/templates")}><FileText size={18} /><span>Use Template</span></div>
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="notes-load-more">
                <button onClick={loadMore} disabled={isFetchingMore} className="notes-load-btn">
                  {isFetchingMore
                    ? <><span className="notes-spinner" /> Loading…</>
                    : "Load more notes"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Hidden inputs */}
      <input ref={coverInputRef} type="file" accept="image/*" style={{ display: "none" }} />

      {/* Rename modal */}
      <AnimatePresence>
        {renameModal.isOpen && (
          <div className="modal-backdrop" onClick={() => setRenameModal({ isOpen: false, index: null, currentName: "" })}>
            <motion.div
              className="custom-modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>Rename Note</h3>
              <input
                type="text"
                value={renameModal.currentName}
                onChange={e => setRenameModal(p => ({ ...p, currentName: e.target.value }))}
                autoFocus
                onKeyDown={e => { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") setRenameModal({ isOpen: false, index: null, currentName: "" }); }}
              />
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setRenameModal({ isOpen: false, index: null, currentName: "" })}>Cancel</button>
                <button className="btn-confirm" onClick={confirmRename}>Rename</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Notes;