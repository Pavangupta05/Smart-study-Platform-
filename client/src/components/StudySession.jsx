import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, RotateCcw, ThumbsUp, ThumbsDown, Trophy, Sparkles } from "lucide-react";
import { flashcardsService } from "../services/index";
import "./StudySession.css";

function StudySession({ deck, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);

  // Use cards from the deck, fallback to a dummy if empty
  const cards = deck?.cards?.length > 0 ? deck.cards : [
    { front: "No cards found.", back: "Add some cards to this deck!" }
  ];

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setIsDone(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsDone(false);
    setMasteredCount(0);
  };

  const handleFeedback = async (score) => {
    const card = cards[currentIndex];
    
    const prevRepetitions = card.repetitions || 0;
    const prevInterval = card.interval || 0;
    const prevEaseFactor = card.easeFactor || 2.5;

    let repetitions = prevRepetitions;
    let interval = prevInterval;
    let easeFactor = prevEaseFactor;

    // Score: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
    // Map to SM-2 quality (0-5 scale): map 1->1, 2->3, 3->4, 4->5
    let quality = 4;
    if (score === 1) quality = 1;
    else if (score === 2) quality = 3;
    else if (score === 3) quality = 4;
    else if (score === 4) quality = 5;

    if (quality < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(prevInterval * prevEaseFactor);
      }
      repetitions = repetitions + 1;
    }

    // Ease factor update: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = prevEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    const cardId = card._id || card.id;
    if (cardId) {
      try {
        await flashcardsService.update(cardId, {
          repetitions,
          interval,
          easeFactor,
          nextReviewDate,
          mastered: quality >= 4,
          lastReviewed: new Date()
        });
      } catch (e) {
        console.error("SM-2 Update failed:", e);
      }
    }

    if (quality >= 4) setMasteredCount(prev => prev + 1);
    handleNext();
  };

  if (isDone) {
    const pct = Math.round((masteredCount / cards.length) * 100);
    return (
      <div className="study-session-overlay">
        <div className="session-complete">
          <div className="complete-icon"><Trophy size={48} /></div>
          <h2>Session Complete! 🎉</h2>
          <p className="complete-deck">{deck.name}</p>
          <div className="complete-stats">
            <div className="complete-stat">
              <span className="stat-num">{cards.length}</span>
              <span className="stat-lbl">Cards Reviewed</span>
            </div>
            <div className="complete-stat">
              <span className="stat-num" style={{ color: "#10b981" }}>{masteredCount}</span>
              <span className="stat-lbl">Mastered</span>
            </div>
            <div className="complete-stat">
              <span className="stat-num">{pct}%</span>
              <span className="stat-lbl">Success Rate</span>
            </div>
          </div>
          <div className="complete-actions">
            <button className="btn-restart" onClick={handleRestart}>
              <RotateCcw size={18} /> Study Again
            </button>
            <button className="btn-exit-done" onClick={onExit}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="card-text">{cards[currentIndex].front || cards[currentIndex].q}</div>
            <div className="card-hint">Click to flip</div>
          </div>
          <div className="flashcard-back">
            <div className="card-tag">ANSWER</div>
            <div className="card-text">{cards[currentIndex].back || cards[currentIndex].a}</div>
            <div className="card-hint">Click to see question</div>
          </div>
        </div>
      </div>

      <div className="session-footer">
        <div className="footer-controls">
          <button className="nav-btn" onClick={handlePrev} disabled={currentIndex === 0}><ChevronLeft size={24} /></button>
          
          <div className="feedback-btns">
            <button className="btn-feedback again" onClick={(e) => { e.stopPropagation(); handleFeedback(1); }}>
              <RotateCcw size={16} /> <span>Again</span>
            </button>
            <button className="btn-feedback hard" onClick={(e) => { e.stopPropagation(); handleFeedback(2); }}>
              <ThumbsDown size={16} /> <span>Hard</span>
            </button>
            <button className="btn-feedback good" onClick={(e) => { e.stopPropagation(); handleFeedback(3); }}>
              <ThumbsUp size={16} /> <span>Good</span>
            </button>
            <button className="btn-feedback easy" onClick={(e) => { e.stopPropagation(); handleFeedback(4); }}>
              <Sparkles size={16} /> <span>Easy</span>
            </button>
          </div>

          <button className="nav-btn" onClick={handleNext} disabled={currentIndex === cards.length - 1}><ChevronRight size={24} /></button>
        </div>
      </div>
    </div>
  );
}

export default StudySession;
