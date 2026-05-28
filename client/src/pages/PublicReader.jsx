import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  AlertCircle,
  Sun,
  Moon,
  BookOpen
} from "lucide-react";
import { notesService } from "../services/index";
import "../styles/reader.css";
import "../styles/reader-mobile.css";
import "../styles/reader-tablet.css";

function PublicReader() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [error, setError] = useState(false);
  const [readingTheme, setReadingTheme] = useState("light");
  const [fontFamily, setFontFamily] = useState("serif");
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    notesService.getShared(shareId)
      .then(res => setFile(res.data.note))
      .catch(err => setError(true));
  }, [shareId]);

  if (error) return (
    <div className="reader-error">
      <AlertCircle size={48} />
      <h2>Note Not Found</h2>
      <p>This public link is invalid or the owner made it private.</p>
      <button onClick={() => navigate("/")}>← Go to Homepage</button>
    </div>
  );

  if (!file) return (
    <div className="reader-loading">
      <div className="loader"></div>
      <p>Loading Public Note...</p>
    </div>
  );

  return (
    <div className={`deep-reader-workspace theme-${readingTheme}`}>
      <header className="reader-header-modern">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/")}><ChevronLeft size={20} /></button>
          <span className="file-name">{file.name}</span>
          <span style={{ fontSize: "12px", color: "var(--reader-text)", marginLeft: "12px", opacity: 0.6 }}>
            Shared by {file.user?.name || "Anonymous"}
          </span>
        </div>
        
        <div className="header-actions">
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
        </div>
      </header>

      <div className="reader-main-container">
        <div className="reader-scroll-area">
          <div className="document-container">
            {file.blobUrl ? (
              file.fileType && file.fileType.startsWith("image/") ? (
                <img src={file.blobUrl} alt={file.name} style={{ width: '100%', height: 'auto', display: 'block' }} />
              ) : (
                <iframe src={file.blobUrl} title={file.name} className="pdf-iframe-view" />
              )
            ) : (
              file.pages.map((pageHtml, index) => (
                <div 
                  key={index} 
                  className="document-wrapper-modern"
                  style={{ 
                    fontFamily: fontFamily === 'serif' ? 'var(--font-serif)' : 'var(--font-sans)',
                    fontSize: `${fontSize}px`
                  }}
                >
                  <div 
                    className="document-content page-content" 
                    dangerouslySetInnerHTML={{ __html: pageHtml || file.content }} 
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicReader;
