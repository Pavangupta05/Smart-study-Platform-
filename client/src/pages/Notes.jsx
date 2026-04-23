import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, FileText } from "lucide-react";
import "../styles/notes.css";

function Notes() {
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [notes, setNotes] = useState(() => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return [];
      const saved = localStorage.getItem("notes");
      if (!saved || saved === "undefined" || saved === "null") return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
      localStorage.removeItem("notes");
      return [];
    } catch (error) {
      console.error("LocalStorage error:", error);
      localStorage.removeItem("notes");
      return [];
    }
  });

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");

  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  const handleAddNote = () => {
    if (!title.trim() || !subject.trim()) return;

    const newNote = {
      title,
      subject: subject.toLowerCase(),
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
    };

    setNotes((prev) => [newNote, ...prev]);
    resetModal();
  };

  const handleEdit = (index) => {
    const realIndex = notes.findIndex(n => n === filteredNotes[index]);
    const note = notes[realIndex];
    if (!note) return;

    setTitle(note.title);
    setSubject(note.subject);
    setEditIndex(realIndex);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleUpdateNote = () => {
    if (!title.trim() || !subject.trim()) return;

    setNotes((prev) =>
      prev.map((n, i) =>
        i === editIndex
          ? { ...n, title, subject: subject.toLowerCase() }
          : n
      )
    );

    resetModal();
  };

  const handleDelete = (index) => {
    const realIndex = notes.findIndex(n => n === filteredNotes[index]);
    setNotes((prev) => prev.filter((_, i) => i !== realIndex));
  };

  const resetModal = () => {
    setTitle("");
    setSubject("");
    setShowModal(false);
    setIsEdit(false);
    setEditIndex(null);
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="notes-page fade-in">
      {/* HEADER */}
      <div className="notes-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">Manage your study notes and resources.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span>New Document</span>
        </button>
      </div>

      {/* CONTROLS */}
      <div className="notes-controls">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search documents..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* EMPTY STATE */}
      {notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FileText size={48} />
          </div>
          <h3>No documents found</h3>
          <p>Get started by creating a new document for your studies.</p>
          <button className="btn-secondary mt-4" onClick={() => setShowModal(true)}>
            Create Document
          </button>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="empty-state">
          <h3>No matching documents</h3>
          <p>Try adjusting your search query.</p>
        </div>
      ) : (
        /* LIST */
        <div className="notes-container">
          <div className="notes-grid-header">
            <div className="col-title">Title</div>
            <div className="col-subject">Subject</div>
            <div className="col-date">Last Edited</div>
            <div className="col-actions"></div>
          </div>
          
          <div className="notes-list">
            {filteredNotes.map((note, index) => (
              <div className="note-card" key={index} style={{ animationDelay: `${index * 50}ms` }}>
                <div className="col-title note-title-group" onClick={() => handleEdit(index)}>
                  <FileText size={16} className="note-icon" />
                  <span className="note-title">{note.title}</span>
                </div>
                
                <div className="col-subject">
                  <span className="badge" data-subject={note.subject}>
                    {note.subject}
                  </span>
                </div>

                <div className="col-date">
                  <span className="note-date">{note.date}</span>
                </div>

                <div className="col-actions">
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => handleEdit(index)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="btn-icon danger" onClick={() => handleDelete(index)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="modal-backdrop" onClick={resetModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEdit ? "Edit Document" : "Create Document"}</h2>
              <p>{isEdit ? "Update your document details below." : "Add a new document to your workspace."}</p>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input
                  placeholder="e.g. Chapter 1 Summary"
                  className="input-field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Subject</label>
                <input
                  placeholder="e.g. Computer Science"
                  className="input-field"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-ghost" onClick={resetModal}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={isEdit ? handleUpdateNote : handleAddNote}
                disabled={!title.trim() || !subject.trim()}
              >
                {isEdit ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notes;