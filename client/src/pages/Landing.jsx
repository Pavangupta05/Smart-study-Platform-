import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, BookOpen, Layout, ShieldCheck, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/landing.css";

const slides = [
  {
    id: 1,
    title: "Study Smarter with AI",
    subtitle: "All your study tools in one place, powered by AI.",
    icon: <Sparkles className="hero-icon" size={48} />,
    color: "var(--primary)",
    image: "✨"
  },
  {
    id: 2,
    title: "AI Tutor & Summaries",
    subtitle: "Get instant explanations and summarize chapters in seconds.",
    icon: <BookOpen className="hero-icon" size={48} />,
    color: "#3b82f6",
    image: "🧠"
  },
  {
    id: 3,
    title: "Stay Organized",
    subtitle: "Keep your notes and flashcards in one clean workspace.",
    icon: <Layout className="hero-icon" size={48} />,
    color: "#8b5cf6",
    image: "📁"
  },
  {
    id: 4,
    title: "Ready to Start?",
    subtitle: "Join StarNote today and level up your studies.",
    icon: <ShieldCheck className="hero-icon" size={48} />,
    color: "#10b981",
    image: "🚀"
  }
];

function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-nav">
        <div className="landing-logo">
          <Sparkles size={24} />
          <span>StarNote AI</span>
        </div>
        <div className="landing-actions">
          <button className="btn-login-nav" onClick={() => navigate("/auth")}>Login</button>
          <button className="btn-join-nav" onClick={() => navigate("/auth")}>Join Now</button>
        </div>
      </div>

      <div className="landing-content">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlide}
            className="slide-container"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="slide-visual" style={{ color: slides[currentSlide].color }}>
              <div className="floating-blob" style={{ background: slides[currentSlide].color }}></div>
              <span className="slide-emoji">{slides[currentSlide].image}</span>
            </div>

            <div className="slide-info">
              <div className="slide-icon-wrapper" style={{ color: slides[currentSlide].color }}>
                {slides[currentSlide].icon}
              </div>
              <h1>{slides[currentSlide].title}</h1>
              <p>{slides[currentSlide].subtitle}</p>
              
              <div className="slide-actions">
                <button className="btn-next" onClick={handleNext}>
                  {currentSlide === slides.length - 1 ? "Get Started" : "Continue"}
                  <ArrowRight size={18} />
                </button>
                {currentSlide < slides.length - 1 && (
                  <button className="btn-skip" onClick={() => navigate("/auth")}>Skip</button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="landing-footer">
        <div className="slide-indicators">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`indicator ${i === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Landing;
