import { useState } from "react";
import { Plus, Search, Brain, Clock, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StudySession from "../components/StudySession";
import "../styles/flashcards.css";

function Flashcards() {
  const [activeDeck, setActiveDeck] = useState(null);
  const [decks, setDecks] = useState([
    { id: 1, name: "Biology 101", count: 24, lastStudied: "2 days ago", color: "#10b981" },
    { id: 2, name: "Computer Science", count: 56, lastStudied: "Today", color: "#3b82f6" },
    { id: 3, name: "Modern History", count: 18, lastStudied: "Yesterday", color: "#f59e0b" },
  ]);

  const handleAddDeck = () => {
    const name = prompt("Enter Deck Name:");
    if (name) {
      const newDeck = {
        id: Date.now(),
        name,
        count: 0,
        lastStudied: "Just now",
        color: "#" + Math.floor(Math.random()*16777215).toString(16)
      };
      setDecks([newDeck, ...decks]);
    }
  };

  const handleGenerateDeck = () => {
    alert("AI is analyzing your notes to generate a new deck...");
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
        <div className="deck-card ai-teaser">
          <div className="ai-badge">AI POWERED</div>
          <h3>Generate from Notes</h3>
          <p>Instantly turn your study notes into a deck of cards.</p>
          <button className="btn-generate" onClick={handleGenerateDeck}>Generate Deck</button>
        </div>
      </div>
    </div>
  );
}

export default Flashcards;
