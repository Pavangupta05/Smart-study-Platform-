import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { 
  UploadCloud, 
  X, 
  FileText, 
  ChevronRight, 
  Image as ImageIcon,
  Smile,
  Plus,
  MessageSquare,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  Edit3
} from "lucide-react";
import "../styles/notes.css";

function Notes() {
  const { category } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- UI States ---
  const [pageIcon, setPageIcon] = useState("📓");
  const [coverImage, setCoverImage] = useState(() => localStorage.getItem("starNote_cover") || "");
  const [hasCover, setHasCover] = useState(() => !!localStorage.getItem("starNote_cover") || false);
  const [showComments, setShowComments] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  const coverInputRef = useRef(null);

  // --- UI Polish States ---
  const [toast, setToast] = useState(null);
  const [renameModal, setRenameModal] = useState({ isOpen: false, index: null, currentName: "" });
  const [isLoading, setIsLoading] = useState(true);

  // --- Upload & File State ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600); // Simulate network load
    return () => clearTimeout(timer);
  }, [category]);

  const [uploadedFiles, setUploadedFiles] = useState(() => {
    const saved = localStorage.getItem("starNote_files");
    return saved ? JSON.parse(saved) : [
      { 
        name: "Calculus_Chapter_4.pdf", 
        size: "2.4 MB", 
        date: "Today",
        icon: "📐",
        cat: "university",
        content: "Calculus Chapter 4 Overview:\n1. The Derivative as a Function.\n2. Differentiation Rules.\n3. The Chain Rule."
      },
      { 
        name: "Physics_Notes.docx", 
        size: "1.1 MB", 
        date: "Yesterday",
        icon: "⚛️",
        cat: "university",
        content: "Newton's Laws of Motion:\nFirst Law: Inertia.\nSecond Law: F = ma.\nThird Law: Action & Reaction."
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("starNote_files", JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  const filteredFiles = category 
    ? uploadedFiles.filter(f => f.cat === category)
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

  const handleUpload = () => {
    if (!selectedFile) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const newFile = {
        name: selectedFile.name,
        size: (selectedFile.size / (1024 * 1024)).toFixed(1) + " MB",
        date: "Just now",
        icon: selectedFile.type.includes("pdf") ? "📕" : "📄",
        cat: category || "general",
        type: selectedFile.type,
        blobUrl: e.target.result
      };
      setUploadedFiles(prev => [newFile, ...prev]);
      setSelectedFile(null);
      setIsUploading(false);
      setUploadProgress(0);
    };
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        reader.readAsDataURL(selectedFile);
      }
    }, 200);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const deleteFile = (e, globalIndex) => {
    e.stopPropagation();
    const fileToTrash = uploadedFiles[globalIndex];
    
    const currentTrash = JSON.parse(localStorage.getItem("starNote_trash") || "[]");
    localStorage.setItem("starNote_trash", JSON.stringify([fileToTrash, ...currentTrash]));
    
    const updated = uploadedFiles.filter((_, i) => i !== globalIndex);
    setUploadedFiles(updated);
    setActiveMenuId(null);
    showToast(`"${fileToTrash.name}" moved to trash.`);
  };

  const handleRename = (e, globalIndex) => {
    e.stopPropagation();
    setRenameModal({ isOpen: true, index: globalIndex, currentName: uploadedFiles[globalIndex].name });
    setActiveMenuId(null);
  };

  const confirmRename = () => {
    if (renameModal.currentName.trim() !== "") {
      const updated = [...uploadedFiles];
      updated[renameModal.index] = { ...updated[renameModal.index], name: renameModal.currentName };
      setUploadedFiles(updated);
      showToast("File renamed successfully.");
    }
    setRenameModal({ isOpen: false, index: null, currentName: "" });
  };

  const handleDuplicate = (e, globalIndex) => {
    e.stopPropagation();
    const fileToDup = uploadedFiles[globalIndex];
    const newFile = { ...fileToDup, name: fileToDup.name + " (Copy)", date: "Just now" };
    const updated = [newFile, ...uploadedFiles];
    setUploadedFiles(updated);
    setActiveMenuId(null);
    showToast("File duplicated.");
  };

  const createNewNotebook = () => {
    const saved = localStorage.getItem("starNote_files");
    const files = saved ? JSON.parse(saved) : [];
    const newNotebook = {
      name: "My New Notebook",
      size: "0.1 MB",
      date: "Just now",
      icon: "📓",
      cat: "personal",
      type: "notebook",
      pages: [" "], 
      notes: [],
      bookmarks: [],
      drawHistory: {}
    };
    const updated = [newNotebook, ...files];
    localStorage.setItem("starNote_files", JSON.stringify(updated));
    setUploadedFiles(updated); // Update state to trigger re-render
    navigate(`/reader/0`); // Navigate to the first item (the new one)
  };

  return (
    <div className="notes-page fade-in" onClick={() => setActiveMenuId(null)}>
      
      <div className="breadcrumb">
        <span>Private</span>
        <ChevronRight size={14} />
        <span className="capitalize">{category || "All Notes"}</span>
      </div>

      <div className="notes-header">
        {hasCover && (
          <div className="notes-cover" style={coverImage ? { backgroundImage: `url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
            {!coverImage && <div className="cover-placeholder"></div>}
            
            <div className="cover-actions-overlay">
              <button className="btn-add-cover" onClick={() => coverInputRef.current?.click()}>
                Change cover
              </button>
              <button className="btn-add-cover" onClick={() => {
                setHasCover(false);
                setCoverImage("");
                localStorage.removeItem("starNote_cover");
              }}>
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Hidden file input must be always rendered for the refs to work */}
        <input 
          type="file" 
          ref={coverInputRef} 
          style={{ display: "none" }} 
          accept="image/*"
          onChange={handleCoverUpload}
        />
        
        <div className="header-main" style={{ marginTop: hasCover ? "-40px" : "40px" }}>
          <div className="page-icon" onClick={handleAddIcon}>{pageIcon}</div>
          <h1 className="page-title">{category ? category.charAt(0).toUpperCase() + category.slice(1) : "Notes & Materials"}</h1>
          <div className="page-meta">
            <button className="btn-meta" onClick={handleAddIcon}><Smile size={16} /> Add icon</button>
            {!hasCover && <button className="btn-meta" onClick={() => coverInputRef.current?.click()}><ImageIcon size={16} /> Add cover</button>}
            <button className="btn-meta" onClick={() => setShowComments(!showComments)}><MessageSquare size={16} /> Add comment</button>
          </div>

          {showComments && (
            <div className="comment-input fade-in">
              <input 
                type="text" 
                placeholder="Type a description or comment... (Press Enter to save)" 
                autoFocus 
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setShowComments(false);
                    // Could save to local storage here if needed
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="notes-content">
        <div 
          className={`notion-drop-zone ${isDragging ? 'active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); setSelectedFile(e.dataTransfer.files[0]); }}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
          {!selectedFile ? (
            <div className="upload-prompt">
              <UploadCloud size={24} />
              <span>Click or drag files to upload to <b>{category || "Workspace"}</b></span>
            </div>
          ) : (
            <div className="file-ready slide-up" onClick={(e) => e.stopPropagation()}>
              <FileText size={20} className="icon-primary" />
              <div className="file-ready-info"><span className="name">{selectedFile.name}</span></div>
              {isUploading ? (
                <div className="upload-progress-container">
                  <div className="progress-bar-mini"><div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div></div>
                </div>
              ) : (
                <div className="upload-actions">
                  <button className="btn-confirm-upload" onClick={handleUpload}>Upload</button>
                  <button className="btn-cancel-file" onClick={() => setSelectedFile(null)}><X size={16} /></button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="notes-tabs fade-in">
          {["All", "Personal", "University", "Work"].map((tab) => {
             const tabPath = tab === "All" ? "/notes" : `/notes/${tab.toLowerCase()}`;
             const isActive = tab === "All" ? !category : category === tab.toLowerCase();
             return (
               <button 
                 key={tab} 
                 className={`tab-btn ${isActive ? "active" : ""}`}
                 onClick={(e) => { e.stopPropagation(); navigate(tabPath); }}
                 style={{ position: "relative" }}
               >
                 {tab}
                 {isActive && (
                   <motion.div 
                     layoutId="tab-underline" 
                     className="tab-underline"
                     style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 2, background: 'var(--primary)', borderRadius: '2px' }}
                   />
                 )}
               </button>
             );
          })}
        </div>

        {filteredFiles.length === 0 ? (
          <div className="empty-state fade-in">
            <div className="empty-illustration">📭</div>
            <h3>No notes found</h3>
            <p>Your <b>{category || "workspace"}</b> is empty. Upload a file or start fresh.</p>
            <button className="btn-primary" onClick={(e) => { e.stopPropagation(); createNewNotebook(); }}>
              <Plus size={16} /> Create Notebook
            </button>
          </div>
        ) : (
          <div className="notes-grid">
            {isLoading ? (
              // Skeleton Loaders
              [1, 2, 3, 4].map((i) => (
                <div className="notion-card skeleton" key={`skel-${i}`}>
                  <div className="skeleton-icon"></div>
                  <div className="skeleton-text short"></div>
                  <div className="skeleton-text long"></div>
                </div>
              ))
            ) : (
              <>
                {filteredFiles.map((f) => {
                  const globalIndex = uploadedFiles.indexOf(f);
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="notion-card" 
                      key={globalIndex} 
                      onClick={() => navigate(`/reader/${globalIndex}`)}
                    >
                      <div className="card-icon">{f.icon}</div>
                      <div className="card-info">
                        <h3>{f.name}</h3>
                        <p>Edited {f.date}</p>
                      </div>
                      
                      <div className="card-actions-wrapper">
                        <button 
                          className="card-more" 
                          onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === globalIndex ? null : globalIndex); }}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        
                        <AnimatePresence>
                          {activeMenuId === globalIndex && (
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="card-dropdown" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button className="dropdown-item" onClick={() => navigate(`/reader/${globalIndex}`)}>
                                <ExternalLink size={14} /> Open
                              </button>
                              <button className="dropdown-item" onClick={(e) => handleRename(e, globalIndex)}>
                                <Edit3 size={14} /> Rename
                              </button>
                              <button className="dropdown-item" onClick={(e) => handleDuplicate(e, globalIndex)}>
                                <FileText size={14} /> Duplicate
                              </button>
                              <div className="dropdown-divider"></div>
                              <button className="dropdown-item delete" onClick={(e) => deleteFile(e, globalIndex)}>
                                <Trash2 size={14} /> Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
                <div className="notion-card add-card" onClick={createNewNotebook}>
                  <Plus size={20} />
                  <span>New Notebook</span>
                </div>
                <div className="notion-card add-card" onClick={() => navigate("/templates")}>
                  <Plus size={20} />
                  <span>Use Template</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* --- CUSTOM MODALS & TOASTS --- */}
      <AnimatePresence>
        {renameModal.isOpen && (
          <div className="modal-backdrop" onClick={() => setRenameModal({ isOpen: false, index: null, currentName: "" })}>
            <motion.div 
              className="custom-modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Rename File</h3>
              <input 
                type="text" 
                value={renameModal.currentName} 
                onChange={(e) => setRenameModal(prev => ({ ...prev, currentName: e.target.value }))}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmRename();
                  if (e.key === "Escape") setRenameModal({ isOpen: false, index: null, currentName: "" });
                }}
              />
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setRenameModal({ isOpen: false, index: null, currentName: "" })}>Cancel</button>
                <button className="btn-confirm" onClick={confirmRename}>Rename</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div 
            className="toast-notification"
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
          >
            <div className="toast-icon">✨</div>
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const createNewNotebook = () => {
  const saved = localStorage.getItem("starNote_files");
  const files = saved ? JSON.parse(saved) : [];
  const newNotebook = {
    name: "New Notebook",
    size: "0 MB",
    date: "Just now",
    icon: "📓",
    cat: "personal",
    type: "notebook",
    pages: [" "], // Initialize with one blank page
    notes: [],
    bookmarks: [],
    drawHistory: {}
  };
  const updated = [newNotebook, ...files];
  localStorage.setItem("starNote_files", JSON.stringify(updated));
  window.location.href = `/reader/${0}`; // Navigate to the new notebook
};

export default Notes;