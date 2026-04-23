import { useState, useEffect } from "react";
import { Trash2, RotateCcw, X, FileText, AlertCircle } from "lucide-react";
import "../styles/trash.css";

function Trash() {
  const [trashItems, setTrashItems] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("starNote_trash");
    if (saved) setTrashItems(JSON.parse(saved));
  }, []);

  const restoreFile = (index) => {
    const item = trashItems[index];
    
    // Add back to Notes
    const currentFiles = JSON.parse(localStorage.getItem("starNote_files") || "[]");
    localStorage.setItem("starNote_files", JSON.stringify([item, ...currentFiles]));
    
    // Remove from Trash
    const updatedTrash = trashItems.filter((_, i) => i !== index);
    setTrashItems(updatedTrash);
    localStorage.setItem("starNote_trash", JSON.stringify(updatedTrash));
    
    // Trigger a refresh event for other components if needed
    window.dispatchEvent(new Event('storage'));
  };

  const deletePermanently = (index) => {
    const updatedTrash = trashItems.filter((_, i) => i !== index);
    setTrashItems(updatedTrash);
    localStorage.setItem("starNote_trash", JSON.stringify(updatedTrash));
  };

  const emptyTrash = () => {
    if (window.confirm("Permanently delete all items in trash?")) {
      setTrashItems([]);
      localStorage.setItem("starNote_trash", "[]");
    }
  };

  return (
    <div className="trash-page fade-in">
      <div className="trash-header">
        <div className="header-info">
          <h1 className="page-title">Trash</h1>
          <p className="page-subtitle">Recently deleted items will be permanently removed after 30 days.</p>
        </div>
        {trashItems.length > 0 && (
          <button className="btn-empty-all" onClick={emptyTrash}>Empty Trash</button>
        )}
      </div>

      {trashItems.length > 0 ? (
        <div className="trash-list">
          {trashItems.map((item, i) => (
            <div key={i} className="trash-item">
              <div className="item-left">
                <div className="item-icon-circle">{item.icon || "📄"}</div>
                <div className="item-info">
                  <h3>{item.name}</h3>
                  <p>Original folder: {item.cat || "general"} • {item.size}</p>
                </div>
              </div>
              <div className="item-actions">
                <button className="btn-restore" onClick={() => restoreFile(i)} title="Restore">
                  <RotateCcw size={18} />
                  <span>Restore</span>
                </button>
                <button className="btn-delete-perm" onClick={() => deletePermanently(i)} title="Delete Permanently">
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="trash-empty">
          <div className="empty-illustration">
            <Trash2 size={64} />
          </div>
          <h3>Your trash is clear</h3>
          <p>When you delete notes, they'll appear here for 30 days.</p>
        </div>
      )}
    </div>
  );
}

export default Trash;
