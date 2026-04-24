import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, RotateCcw, ThumbsUp, ThumbsDown } from "lucide-react";
import "./StudySession.css";

function StudySession({ deck, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progress, setProgress] = useState(0);

  // Mock cards for the deck
  const cards = [
    { q: "What is the powerhouse of the cell?", a: "The Mitochondria" },
    { q: "What is the chemical symbol for Gold?", a: "Au" },
    { q: "Who discovered Penicillin?", a: "Alexander Fleming" },
    { q: "What is the speed of light?", a: "299,792,458 m/s" },
  ];

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setProgress(((currentIndex + 1) / cards.length) * 100);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  return (
    <div className="study-session-overlay">
      <div className="session-header">
        <div className="header-left">
          <button className="btn-exit" onClick={onExit}><X size={20} /></button>
          <div className="session-info">
            <h2>{deck.name}</h2>
            <span>{currentIndex + 1} of {cards.length} cards</span>
          </div>
        </div>
        <div className="progress-container">
          <div className="progress-bar">
            <motion.div className="progress-fill" animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}></motion.div>
          </div>
        </div>
      </div>

      <div className="card-container">
        <div className={`flashcard-wrapper ${isFlipped ? "flipped" : ""}`} onClick={() => setIsFlipped(!isFlipped)}>
          <div className="flashcard-front">
            <div className="card-tag">QUESTION</div>
            <div className="card-text">{cards[currentIndex].q}</div>
            <div className="card-hint">Click to flip</div>
          </div>
          <div className="flashcard-back">
            <div className="card-tag">ANSWER</div>
            <div className="card-text">{cards[currentIndex].a}</div>
            <div className="card-hint">Click to see question</div>
          </div>
        </div>
      </div>

      <div className="session-footer">
        <div className="footer-controls">
          <button className="nav-btn" onClick={handlePrev} disabled={currentIndex === 0}><ChevronLeft size={24} /></button>
          
          <div className="feedback-btns">
            <button className="btn-feedback easy"><ThumbsUp size={20} /> <span>Easy</span></button>
            <button className="btn-feedback hard"><ThumbsDown size={20} /> <span>Hard</span></button>
          </div>

          <button className="nav-btn" onClick={handleNext} disabled={currentIndex === cards.length - 1}><ChevronRight size={24} /></button>
        </div>
      </div>
    </div>
  );
}

export default StudySession;
