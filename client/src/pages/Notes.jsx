import { useState, useRef, useEffect } from "react";
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
  ExternalLink
} from "lucide-react";
import "../styles/notes.css";

function Notes() {
  const { category } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- UI States ---
  const [pageIcon, setPageIcon] = useState("📓");
  const [hasCover, setHasCover] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // --- Upload & File State ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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

  // --- Handlers ---
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

  const deleteFile = (e, globalIndex) => {
    e.stopPropagation();
    const fileToTrash = uploadedFiles[globalIndex];
    
    // Save to Trash
    const currentTrash = JSON.parse(localStorage.getItem("starNote_trash") || "[]");
    localStorage.setItem("starNote_trash", JSON.stringify([fileToTrash, ...currentTrash]));
    
    // Remove from main list
    const updated = uploadedFiles.filter((_, i) => i !== globalIndex);
    setUploadedFiles(updated);
    setActiveMenuId(null);
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
          <div className="notes-cover">
            <div className="cover-placeholder"></div>
            <button className="btn-add-cover" onClick={() => setHasCover(false)}>Remove cover</button>
          </div>
        )}
        
        <div className="header-main" style={{ marginTop: hasCover ? "-40px" : "40px" }}>
          <div className="page-icon" onClick={() => setPageIcon("✨")}>{pageIcon}</div>
          <h1 className="page-title">{category ? category.charAt(0).toUpperCase() + category.slice(1) : "Notes & Materials"}</h1>
          <div className="page-meta">
            <button className="btn-meta" onClick={() => setPageIcon("🧠")}><Smile size={16} /> Add icon</button>
            {!hasCover && <button className="btn-meta" onClick={() => setHasCover(true)}><ImageIcon size={16} /> Add cover</button>}
            <button className="btn-meta" onClick={() => setShowComments(!showComments)}><MessageSquare size={16} /> Add comment</button>
          </div>
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

        <div className="notes-grid">
          {filteredFiles.map((f) => {
            const globalIndex = uploadedFiles.indexOf(f);
            return (
              <div className="notion-card" key={globalIndex} onClick={() => navigate(`/reader/${globalIndex}`)}>
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
                  
                  {activeMenuId === globalIndex && (
                    <div className="card-dropdown slide-up" onClick={(e) => e.stopPropagation()}>
                      <button className="dropdown-item" onClick={() => navigate(`/reader/${globalIndex}`)}>
                        <ExternalLink size={14} /> Open
                      </button>
                      <button className="dropdown-item delete" onClick={(e) => deleteFile(e, globalIndex)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
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
        </div>
      </div>
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