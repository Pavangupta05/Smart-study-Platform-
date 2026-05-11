import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { parseFlashcards, parseQuiz } from "./artifactDetector";
import {
  FileText,
  Layers,
  BarChart3,
  Code2,
  GitBranch,
  BookOpen,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import { useState } from "react";

// ── Type metadata ────────────────────────────────────────────────────────────
const TYPE_META = {
  markdown:    { icon: FileText,     label: "Document" },
  flashcards:  { icon: Layers,       label: "Flashcards" },
  quiz:        { icon: ClipboardList,label: "Quiz" },
  table:       { icon: BarChart3,    label: "Table" },
  "study-plan":{ icon: BookOpen,     label: "Study Plan" },
  code:        { icon: Code2,        label: "Code" },
  mermaid:     { icon: GitBranch,    label: "Diagram" },
};

// ── Flashcard viewer ─────────────────────────────────────────────────────────
function FlashcardViewer({ content }) {
  const cards = parseFlashcards(content);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState(new Set());

  if (!cards.length) return <ReactMarkdown>{content}</ReactMarkdown>;

  const card = cards[index];
  const isMastered = mastered.has(index);

  return (
    <div className="artifact-flashcard-viewer">
      <div className="artifact-fc-progress">
        <span>{index + 1} / {cards.length}</span>
        <span className="artifact-fc-mastered">{mastered.size} mastered</span>
      </div>

      <div
        className={`artifact-fc-card ${flipped ? "flipped" : ""} ${isMastered ? "mastered" : ""}`}
        onClick={() => setFlipped(!flipped)}
      >
        <div className="artifact-fc-front">
          <span className="artifact-fc-badge">Question</span>
          <p>{card.question}</p>
          <span className="artifact-fc-tap">Tap to reveal answer</span>
        </div>
        <div className="artifact-fc-back">
          <span className="artifact-fc-badge answer">Answer</span>
          <p>{card.answer}</p>
        </div>
      </div>

      <div className="artifact-fc-controls">
        <button
          className="artifact-fc-btn"
          onClick={() => { setIndex(i => Math.max(0, i - 1)); setFlipped(false); }}
          disabled={index === 0}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          className={`artifact-fc-btn master ${isMastered ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setMastered(prev => {
              const next = new Set(prev);
              isMastered ? next.delete(index) : next.add(index);
              return next;
            });
          }}
          title={isMastered ? "Unmark mastered" : "Mark as mastered"}
        >
          <Check size={16} />
          {isMastered ? "Mastered" : "Got it"}
        </button>
        <button
          className="artifact-fc-btn"
          onClick={() => { setIndex(i => Math.min(cards.length - 1, i + 1)); setFlipped(false); }}
          disabled={index === cards.length - 1}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ── Quiz viewer ──────────────────────────────────────────────────────────────
function QuizViewer({ content }) {
  const questions = parseQuiz(content);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!questions.length) return <ReactMarkdown>{content}</ReactMarkdown>;

  return (
    <div className="artifact-quiz-viewer">
      {questions.map((q, qi) => (
        <div key={qi} className="artifact-quiz-question">
          <p className="artifact-quiz-q-text"><span className="artifact-quiz-num">{qi + 1}.</span> {q.question}</p>
          <div className="artifact-quiz-options">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                className={`artifact-quiz-option ${answers[qi] === oi ? "selected" : ""}`}
                onClick={() => !submitted && setAnswers(a => ({ ...a, [qi]: oi }))}
              >
                <span className="artifact-quiz-opt-letter">{String.fromCharCode(65 + oi)}</span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="artifact-quiz-footer">
        <span className="artifact-quiz-count">{Object.keys(answers).length} / {questions.length} answered</span>
        {!submitted ? (
          <button
            className="artifact-quiz-submit"
            onClick={() => setSubmitted(true)}
            disabled={Object.keys(answers).length === 0}
          >
            Submit Quiz
          </button>
        ) : (
          <span className="artifact-quiz-done">✓ Submitted</span>
        )}
      </div>
    </div>
  );
}

// ── Code viewer ──────────────────────────────────────────────────────────────
function CodeViewer({ content, lang }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="artifact-code-viewer">
      <div className="artifact-code-header">
        <span className="artifact-code-lang">{lang || "code"}</span>
        <button className="artifact-code-copy" onClick={handleCopy}>
          {copied ? <Check size={13} /> : null}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="artifact-code-block"><code>{content}</code></pre>
    </div>
  );
}

// ── Main ArtifactRenderer ────────────────────────────────────────────────────
export default function ArtifactRenderer({ artifact }) {
  if (!artifact) return null;

  const { type, content, meta } = artifact;
  const TypeMeta = TYPE_META[type] || TYPE_META.markdown;
  const Icon = TypeMeta.icon;

  const renderContent = () => {
    switch (type) {
      case "flashcards":  return <FlashcardViewer content={content} />;
      case "quiz":        return <QuizViewer content={content} />;
      case "code":        return <CodeViewer content={content} lang={meta?.lang} />;
      case "mermaid":     return (
        <div className="artifact-mermaid-placeholder">
          <GitBranch size={32} strokeWidth={1.5} />
          <p>Mermaid diagram detected.</p>
          <pre className="artifact-mermaid-code">{content}</pre>
        </div>
      );
      case "table":
      case "study-plan":
      case "markdown":
      default:
        return (
          <div className="artifact-markdown-body">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        );
    }
  };

  return (
    <motion.div
      className="artifact-renderer"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="artifact-header">
        <div className="artifact-header-left">
          <Icon size={15} strokeWidth={2} />
          <span className="artifact-type-label">{TypeMeta.label}</span>
        </div>
      </div>
      <div className="artifact-content">
        {renderContent()}
      </div>
    </motion.div>
  );
}
