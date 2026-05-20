import { useState, useEffect } from "react";
import { Plus, Search, Brain, Clock, ChevronRight, Sparkles, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import StudySession from "../components/StudySession";
import EmptyState from "../components/ui/EmptyState";
import { flashcardsService, aiService, notesService } from "../services/index";
import "../styles/flashcards.css";

// Moved outside component to avoid re-creation on every render
const PREMIUM_COLORS = [
  "#6366f1", "#ec4899", "#3b82f6", "#10b981",
  "#f59e0b", "#8b5cf6", "#06b6d4", "#f43f5e"
];

const getDeckColor = (deckName) => {
  let hash = 0;
  for (let i = 0; i < deckName.length; i++) {
    hash = deckName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PREMIUM_COLORS[Math.abs(hash) % PREMIUM_COLORS.length];
};

const processFlashcards = (cards) => {
  const grouped = {};
  cards.forEach(c => {
    const deckName = c.deck || "Default Deck";
    if (!grouped[deckName]) {
      grouped[deckName] = {
        id: deckName,
        name: deckName,
        count: 0,
        lastStudied: c.lastReviewed ? new Date(c.lastReviewed).toLocaleDateString() : "Never",
        color: getDeckColor(deckName),
        cards: []
      };
    }
    grouped[deckName].count++;
    grouped[deckName].cards.push(c);
    if (c.lastReviewed) {
      const lastDate = new Date(grouped[deckName].lastStudied);
      const thisDate = new Date(c.lastReviewed);
      if (isNaN(lastDate) || thisDate > lastDate) {
        grouped[deckName].lastStudied = thisDate.toLocaleDateString();
      }
    }
  });
  return Object.values(grouped);
};

function Flashcards() {
  const [activeDeck, setActiveDeck] = useState(null);
  const [decks, setDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    flashcardsService.getAll()
      .then(res => setDecks(processFlashcards(res.data.cards || [])))
      .catch(err => {
        console.error(err);
        toast.error("Failed to load flashcards.");
      })
      .finally(() => setIsLoading(false));
  }, []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [genCount, setGenCount] = useState(10);
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [genMethod, setGenMethod] = useState("topic"); // "topic" or "note"

  useEffect(() => {
    if (showGenModal) {
      notesService.getAll()
        .then(res => setNotes(res.data.notes || []))
        .catch(err => console.error("Failed to load notes for flashcards", err));
    }
  }, [showGenModal]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);

  const handleAddDeck = async (e) => {
    if (e) e.preventDefault();
    if (!newDeckName.trim()) return;
    const name = newDeckName.trim();
    setIsCreatingDeck(true);
    try {
      const res = await flashcardsService.create({ front: "New Card Question?", back: "Answer here.", deck: name });
      const allRes = await flashcardsService.getAll();
      setDecks(processFlashcards(allRes.data.cards || []));
      setShowCreateModal(false);
      setNewDeckName("");
      toast.success(`Deck "${name}" created successfully!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create deck.");
    } finally {
      setIsCreatingDeck(false);
    }
  };

  const handleGenerateDeck = async () => {
    let topicText = "";
    let deckName = "";

    if (genMethod === "topic") {
      if (!genTopic.trim()) return;
      topicText = genTopic.trim();
      deckName = genTopic.trim();
    } else {
      if (!selectedNoteId) {
        toast.error("Please select a note first.");
        return;
      }
      const note = notes.find(n => n._id === selectedNoteId);
      if (!note) return;
      
      let text = note.content || "";
      if (note.pages && note.pages.length > 0) {
        text += "\n" + note.pages.join("\n");
      }
      
      if (!text.trim()) {
        toast.error("The selected note is empty. Please choose a note with text.");
        return;
      }
      
      topicText = `Generate flashcards based on this content:\n${text}`;
      deckName = note.name;
    }

    setIsGenerating(true);

    try {
      const res = await aiService.generateFlashcards(topicText, genCount);
      let rawCards = res.data.data.cards || [];

      // Transform cards keys to front/back matching DB schema
      const cards = rawCards.map(c => ({
        front: c.front || c.question || c.q || "",
        back: c.back || c.answer || c.a || ""
      }));

      if (cards.length === 0) {
        throw new Error("No cards generated.");
      }

      await flashcardsService.bulkCreate(cards, deckName);
      
      const allRes = await flashcardsService.getAll();
      setDecks(processFlashcards(allRes.data.cards || []));
      
      setShowGenModal(false);
      setGenTopic("");
      setSelectedNoteId("");
      toast.success(`Generated ${cards.length} flashcards for "${deckName}"`);
    } catch (err) {
      console.error("AI Flashcard Error:", err);
      toast.error("Failed to generate flashcards. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flashcards-page fade-in">
      <AnimatePresence>
        {activeDeck && (
          <StudySession 
            deck={activeDeck} 
            onExit={() => setActiveDeck(null)} 
          />
        )}
      </AnimatePresence>

      {/* AI GENERATION MODAL */}
      <AnimatePresence>
        {showGenModal && (
          <motion.div 
            className="gen-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="gen-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <div className="gen-modal-header">
                <div className="gen-modal-title">
                  <Sparkles size={18} />
                  <h3>AI Flashcard Generator</h3>
                </div>
                <button className="gen-close" onClick={() => setShowGenModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="gen-modal-body">
                <div className="gen-method-tabs" style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                  <button 
                    type="button"
                    className={`method-tab ${genMethod === 'topic' ? 'active' : ''}`}
                    onClick={() => setGenMethod("topic")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      background: genMethod === 'topic' ? 'var(--primary-weak)' : 'transparent',
                      color: genMethod === 'topic' ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    💡 By Topic
                  </button>
                  <button 
                    type="button"
                    className={`method-tab ${genMethod === 'note' ? 'active' : ''}`}
                    onClick={() => setGenMethod("note")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      background: genMethod === 'note' ? 'var(--primary-weak)' : 'transparent',
                      color: genMethod === 'note' ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    📄 From Note
                  </button>
                </div>

                {genMethod === "topic" ? (
                  <div className="gen-field" style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600 }}>What topic do you want to study?</label>
                    <input
                      type="text"
                      placeholder="e.g. Photosynthesis, JavaScript Closures, World War 2..."
                      value={genTopic}
                      onChange={(e) => setGenTopic(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGenerateDeck()}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        border: "1px solid var(--border)",
                        background: "rgba(var(--surface-rgb), 0.5)",
                        color: "var(--text)"
                      }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="gen-field" style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600 }}>Select a Study Note</label>
                    <select
                      value={selectedNoteId}
                      onChange={(e) => setSelectedNoteId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        border: "1px solid var(--border)",
                        background: "rgba(var(--surface-rgb), 0.5)",
                        color: "var(--text)",
                        outline: "none"
                      }}
                    >
                      <option value="" disabled>-- Select a Notebook/Page --</option>
                      {notes.map(note => (
                        <option key={note._id} value={note._id}>
                          {note.icon || "📄"} {note.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="gen-field" style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600 }}>Number of cards</label>
                  <div className="gen-count-selector" style={{ display: "flex", gap: "8px" }}>
                    {[5, 10, 15, 20].map(n => (
                      <button 
                        type="button"
                        key={n}
                        className={`count-btn ${genCount === n ? 'active' : ''}`}
                        onClick={() => setGenCount(n)}
                        style={{
                          flex: 1,
                          padding: "10px",
                          borderRadius: "12px",
                          border: "1px solid var(--border)",
                          background: genCount === n ? 'var(--primary-weak)' : 'rgba(var(--surface-rgb), 0.3)',
                          color: genCount === n ? 'var(--primary)' : 'var(--text-secondary)',
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                className="gen-submit" 
                onClick={handleGenerateDeck}
                disabled={isGenerating || (genMethod === "topic" ? !genTopic.trim() : !selectedNoteId)}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Generating {genCount} cards...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate {genCount} Flashcards</span>
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE NEW DECK MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            className="gen-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="gen-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <div className="gen-modal-header">
                <div className="gen-modal-title">
                  <Plus size={18} />
                  <h3>Create New Deck</h3>
                </div>
                <button className="gen-close" onClick={() => setShowCreateModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddDeck}>
                <div className="gen-modal-body">
                  <div className="gen-field">
                    <label>Deck Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Biology 101, Linear Algebra..."
                      value={newDeckName}
                      onChange={(e) => setNewDeckName(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <button 
                  className="gen-submit" 
                  type="submit"
                  disabled={!newDeckName.trim() || isCreatingDeck}
                >
                  {isCreatingDeck ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Create Deck</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="page-header">
        <div>
          <h1 className="page-title">Flashcards</h1>
          <p className="page-subtitle">Master your subjects with active recall and AI assistance.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          <span>New Deck</span>
        </button>
      </div>

      <div className="flashcards-grid">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="deck-card skeleton" style={{ minHeight: 120 }} />
          ))
        ) : decks.length === 0 ? (
          <div style={{ gridColumn: "1 / -1" }}>
            <EmptyState
              icon={<Brain size={48} strokeWidth={1.2} />}
              title="No flashcard decks yet"
              description="Create your first deck manually or let AI generate one from any topic in seconds."
              ctaLabel="+ New Deck"
              onCta={() => setShowCreateModal(true)}
              secondary={
                <button
                  className="empty-state-cta"
                  style={{ background: "var(--surface-hover)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                  onClick={() => setShowGenModal(true)}
                >
                  ✨ Generate with AI
                </button>
              }
            />
          </div>
        ) : (
          decks.map(deck => (
            <motion.div
              key={deck.id}
              className="deck-card"
              whileHover={{ y: -5 }}
            >
              <div className="deck-color" style={{ backgroundColor: deck.color }}></div>
              <div className="deck-info">
                <h3>{deck.name}</h3>
                <div className="deck-stats">
                  <div className="stat">
                    <Brain size={14} />
                    <span>{deck.count} cards</span>
                  </div>
                  <div className="stat">
                    <Clock size={14} />
                    <span>{deck.lastStudied}</span>
                  </div>
                </div>
              </div>
              <button className="btn-study" onClick={() => setActiveDeck(deck)}>
                <span>Study</span>
                <ChevronRight size={16} />
              </button>
            </motion.div>
          ))
        )}

        {/* AI Generator Teaser — only shown when decks exist */}
        {!isLoading && decks.length > 0 && (
          <div className="deck-card ai-teaser" onClick={() => setShowGenModal(true)}>
            <div className="ai-badge">AI POWERED</div>
            <h3>Generate from AI</h3>
            <p>Give a topic and AI will create flashcards instantly.</p>
            <button className="btn-generate" onClick={(e) => { e.stopPropagation(); setShowGenModal(true); }}>
              <Sparkles size={14} />
              Generate Deck
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Flashcards;
