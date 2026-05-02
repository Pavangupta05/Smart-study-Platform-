import { useState, useEffect } from "react";
import { Plus, Search, Brain, Clock, ChevronRight, Sparkles, Loader2, X } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from "framer-motion";
import StudySession from "../components/StudySession";
import { flashcardsService } from "../services/index";
import "../styles/flashcards.css";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

function Flashcards() {
  const [activeDeck, setActiveDeck] = useState(null);
  const [decks, setDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
          color: "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
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
      .catch(console.error)
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
      }
    }
  };

  const handleGenerateDeck = async () => {
    if (!genTopic.trim()) return;
    setIsGenerating(true);

    try {
      const prompt = `Generate exactly ${genCount} flashcards for the topic: "${genTopic}".
Return ONLY a valid JSON array. Each object must have "question" and "answer" keys.
Example format:
[{"question": "What is X?", "answer": "X is..."}]
No extra text, no markdown, no code fences. Just the JSON array.`;

      const result = await aiModel.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      
      // Clean up response - remove markdown code fences if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const cards = JSON.parse(text);

      // Use backend bulk insert API to save the new cards under this deck name
      await flashcardsService.bulkCreate(cards, genTopic);
      
      // Refetch and regroup
      const allRes = await flashcardsService.getAll();
      setDecks(processFlashcards(allRes.data.cards || []));
      
      setShowGenModal(false);
      setGenTopic("");
    } catch (err) {
      console.error("AI Flashcard Error:", err);
      alert("Failed to generate flashcards. Please try again.");
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
        {decks.map(deck => (
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
        ))}
        
        {/* AI Generator Teaser */}
        <div className="deck-card ai-teaser" onClick={() => setShowGenModal(true)}>
          <div className="ai-badge">AI POWERED</div>
          <h3>Generate from AI</h3>
          <p>Give a topic and AI will create flashcards instantly.</p>
          <button className="btn-generate" onClick={(e) => { e.stopPropagation(); setShowGenModal(true); }}>
            <Sparkles size={14} />
            Generate Deck
          </button>
        </div>
      </div>
    </div>
  );
}

export default Flashcards;
