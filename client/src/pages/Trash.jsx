import { useState, useEffect } from "react";
import { Trash2, RotateCcw, X, FileText, AlertCircle } from "lucide-react";
import { notesService } from "../services/index";
import "../styles/trash.css";

function Trash() {
  const [trashItems, setTrashItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    notesService.getTrash()
      .then(res => setTrashItems(res.data.notes || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const restoreFile = async (id) => {
    try {
      await notesService.restore(id);
      setTrashItems(prev => prev.filter(item => item._id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const deletePermanently = async (id) => {
    try {
      await notesService.deletePermanent(id);
      setTrashItems(prev => prev.filter(item => item._id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const emptyTrash = async () => {
    if (window.confirm("Permanently delete all items in trash?")) {
      try {
        for (const item of trashItems) {
          await notesService.deletePermanent(item._id);
        }
        setTrashItems([]);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="trash-page fade-in">
      <div className="trash-header">
        <div className="header-info">
          <h1 className="page-title">Trash</h1>
          <p className="page-subtitle">Deleted items stay here for 30 days.</p>
        </div>
        {trashItems.length > 0 && (
          <button className="btn-empty-all" onClick={emptyTrash}>
            <Trash2 size={16} />
            <span>Empty Trash</span>
          </button>
        )}
      </div>

      <div className="trash-warning-banner">
        <AlertCircle size={18} />
        <span>Items deleted permanently cannot be recovered.</span>
      </div>

      {isLoading ? (
        <div className="trash-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="trash-item skeleton" style={{ padding: "16px", minHeight: "80px", borderRadius: "16px" }}>
              <div className="item-left">
                <div className="skeleton-icon" style={{ width: 48, height: 48, borderRadius: "50%", marginBottom: 0 }}></div>
                <div style={{ marginLeft: "16px", flex: 1 }}>
                  <div className="skeleton-text short" style={{ height: "14px" }}></div>
                  <div className="skeleton-text long" style={{ height: "10px", marginTop: "8px" }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : trashItems.length > 0 ? (
        <div className="trash-list">
          {trashItems.map((item) => (
            <div key={item._id} className="trash-item">
              <div className="item-left">
                <div className="item-icon-circle">{item.icon || "📄"}</div>
                <div className="item-info">
                  <h3>{item.name}</h3>
                  <p>Original folder: {item.cat || "general"} • {item.size}</p>
                </div>
              </div>
              <div className="item-actions">
                <button className="btn-restore" onClick={() => restoreFile(item._id)} title="Restore">
                  <RotateCcw size={18} />
                  <span>Restore</span>
                </button>
                <button className="btn-delete-perm" onClick={() => deletePermanently(item._id)} title="Delete Permanently">
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
