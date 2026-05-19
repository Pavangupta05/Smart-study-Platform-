import { useState, useEffect } from "react";
import { Plus, Search, Brain, Clock, ChevronRight, Sparkles, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import StudySession from "../components/StudySession";
import EmptyState from "../components/ui/EmptyState";
import { flashcardsService, aiService } from "../services/index";
import "../styles/flashcards.css";

function Flashcards() {
  const [activeDeck, setActiveDeck] = useState(null);
  const [decks, setDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getDeckColor = (deckName) => {
    const premiumColors = [
      "#6366f1", // Indigo
      "#ec4899", // Pink
      "#3b82f6", // Blue
      "#10b981", // Emerald
      "#f59e0b", // Amber
      "#8b5cf6", // Violet
      "#06b6d4", // Cyan
      "#f43f5e"  // Rose
    ];
    let hash = 0;
    for (let i = 0; i < deckName.length; i++) {
      hash = deckName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % premiumColors.length;
    return premiumColors[index];
  };

  // Group flat flashcards array into decks
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
      
      // Update lastStudied if this card is more recent
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

  const handleAddDeck = async () => {
    const name = prompt("Enter Deck Name:");
    if (name) {
      // Create a dummy card to instantiate the deck in the DB since cards are flat
      try {
        const res = await flashcardsService.create({ front: "New Card Question?", back: "Answer here.", deck: name });
        // Refetch to cleanly regroup
        const allRes = await flashcardsService.getAll();
        setDecks(processFlashcards(allRes.data.cards || []));
      } catch (err) {
        console.error(err);
        toast.error("Failed to create deck.");
      }
    }
  };

  const handleGenerateDeck = async () => {
    if (!genTopic.trim()) return;
    setIsGenerating(true);

    try {
      const res = await aiService.generateFlashcards(genTopic, genCount);
      const cards = res.data.data.cards;

      // Use backend bulk insert API to save the new cards under this deck name
      await flashcardsService.bulkCreate(cards, genTopic);
      
      // Refetch and regroup
      const allRes = await flashcardsService.getAll();
      setDecks(processFlashcards(allRes.data.cards || []));
      
      setShowGenModal(false);
      setGenTopic("");
      toast.success(`Generated ${cards.length} flashcards for "${genTopic}"`);
    } catch (err) {
      console.error("AI Flashcard Error:", err);
      toast.error("Failed to generate flashcards. Please try again.");
    }

    setIsGenerating(false);
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
                <div className="gen-field">
                  <label>What topic do you want to study?</label>
                  <input
                    type="text"
                    placeholder="e.g. Photosynthesis, JavaScript Closures, World War 2..."
                    value={genTopic}
                    onChange={(e) => setGenTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerateDeck()}
                    autoFocus
                  />
                </div>

                <div className="gen-field">
                  <label>Number of cards</label>
                  <div className="gen-count-selector">
                    {[5, 10, 15, 20].map(n => (
                      <button 
                        key={n}
                        className={`count-btn ${genCount === n ? 'active' : ''}`}
                        onClick={() => setGenCount(n)}
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
                disabled={isGenerating || !genTopic.trim()}
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

      <div className="page-header">
        <div>
          <h1 className="page-title">Flashcards</h1>
          <p className="page-subtitle">Master your subjects with active recall and AI assistance.</p>
        </div>
        <button className="btn-primary" onClick={handleAddDeck}>
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
              onCta={handleAddDeck}
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
