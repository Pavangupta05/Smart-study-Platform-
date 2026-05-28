import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, BookOpen, Timer, ChevronRight, Check, X, Loader2,
  Trophy, Target, ArrowLeft, RotateCcw, Lightbulb, AlertTriangle,
  BookMarked, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { notesService, aiService, examService } from "../services/index";
import "../styles/exam.css";

// ── Phase 1: Setup ─────────────────────────────────────────────────────────────
function ExamSetup({ onStart }) {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [numQuestions, setNumQuestions] = useState(5);
  const [examType, setExamType] = useState("mixed");
  const [timeLimit, setTimeLimit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    notesService.getAll()
      .then(res => setNotes((res.data.notes || []).filter(n => !n.isTrashed && (n.content || n.pages?.length))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async () => {
    if (!selectedNote) { toast.error("Select a note first."); return; }
    setGenerating(true);
    try {
      const text = [selectedNote.content, ...(selectedNote.pages || [])].filter(Boolean).join("\n");
      if (!text.trim()) { toast.error("Selected note is empty."); return; }
      const res = await aiService.generateExam(text, numQuestions, examType);
      onStart({
        questions: res.data.data.questions,
        note: selectedNote,
        timeLimit,
        examType,
      });
    } catch {
      toast.error("Failed to generate exam. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="exam-setup">
      <motion.div className="exam-setup-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="exam-setup-icon">
          <ClipboardList size={28} />
        </div>
        <h1 className="exam-setup-title">AI Mock Exam</h1>
        <p className="exam-setup-subtitle">Generate a personalized exam from your study notes and get AI-graded results.</p>

        <div className="exam-form">
          {/* Note Selection */}
          <div className="exam-field">
            <label>Study Note</label>
            {loading ? (
              <div className="exam-loading-field"><Loader2 size={14} className="spin" /> Loading notes...</div>
            ) : (
              <div className="exam-note-list">
                {notes.length === 0 ? (
                  <p className="exam-no-notes">No notes with content found. Add content to a note first.</p>
                ) : notes.map(n => (
                  <button
                    key={n._id}
                    className={`exam-note-item ${selectedNote?._id === n._id ? "selected" : ""}`}
                    onClick={() => setSelectedNote(n)}
                  >
                    <span className="exam-note-icon">{n.icon || "📄"}</span>
                    <span className="exam-note-name">{n.name}</span>
                    {selectedNote?._id === n._id && <Check size={14} className="exam-note-check" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Number of Questions */}
          <div className="exam-field">
            <label>Number of Questions</label>
            <div className="exam-options-row">
              {[3, 5, 8, 10].map(n => (
                <button key={n} className={`exam-opt-btn ${numQuestions === n ? "active" : ""}`} onClick={() => setNumQuestions(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Exam Type */}
          <div className="exam-field">
            <label>Question Type</label>
            <div className="exam-options-row">
              {[
                { value: "mcq", label: "Multiple Choice" },
                { value: "short", label: "Short Answer" },
                { value: "mixed", label: "Mixed" },
              ].map(opt => (
                <button key={opt.value} className={`exam-opt-btn ${examType === opt.value ? "active" : ""}`} onClick={() => setExamType(opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Limit */}
          <div className="exam-field">
            <label>Time Limit</label>
            <div className="exam-options-row">
              {[5, 10, 15, 20, 30].map(t => (
                <button key={t} className={`exam-opt-btn ${timeLimit === t ? "active" : ""}`} onClick={() => setTimeLimit(t)}>
                  {t}m
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          className="exam-start-btn"
          onClick={handleStart}
          disabled={generating || !selectedNote}
        >
          {generating ? (
            <><Loader2 size={18} className="spin" /><span>Generating Exam…</span></>
          ) : (
            <><Sparkles size={18} /><span>Generate & Start Exam</span></>
          )}
        </button>
      </motion.div>
    </div>
  );
}

// ── Phase 2: Taking the Exam ──────────────────────────────────────────────────
function ExamTaking({ questions, timeLimit, note, onSubmit }) {
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60);
  const timerRef = useRef(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleSubmit = () => {
    clearInterval(timerRef.current);
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
    onSubmit(answers, timeTaken);
  };

  const q = questions[currentQ];
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");
  const isLowTime = timeLeft < 60;
  const answered = Object.keys(answers).length;

  return (
    <div className="exam-taking">
      {/* Top bar */}
      <div className="exam-topbar">
        <div className="exam-progress-info">
          <span>{answered}/{questions.length} answered</span>
          <div className="exam-progress-bar">
            <div className="exam-progress-fill" style={{ width: `${(answered / questions.length) * 100}%` }} />
          </div>
        </div>
        <div className={`exam-timer ${isLowTime ? "low" : ""}`}>
          <Timer size={14} />
          <span>{mins}:{secs}</span>
        </div>
        <button className="exam-submit-btn" onClick={handleSubmit}>
          Submit <ChevronRight size={14} />
        </button>
      </div>

      <div className="exam-body">
        {/* Question Navigator */}
        <div className="exam-q-nav">
          <p className="exam-q-nav-title">Questions</p>
          <div className="exam-q-grid">
            {questions.map((_, i) => (
              <button
                key={i}
                className={`exam-q-dot ${currentQ === i ? "current" : ""} ${answers[questions[i].id] !== undefined ? "answered" : ""}`}
                onClick={() => setCurrentQ(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="exam-q-nav-legend">
            <span className="legend-item answered-legend">Answered</span>
            <span className="legend-item">Unanswered</span>
          </div>
        </div>

        {/* Question Area */}
        <div className="exam-q-area">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              className="exam-question-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="exam-q-header">
                <span className="exam-q-num">Q{currentQ + 1}</span>
                <span className="exam-q-type">{q.type === "mcq" ? "Multiple Choice" : "Short Answer"}</span>
              </div>
              <p className="exam-q-text">{q.question}</p>

              {q.type === "mcq" ? (
                <div className="exam-mcq-options">
                  {(q.options || []).map((opt, i) => (
                    <button
                      key={i}
                      className={`exam-mcq-opt ${answers[q.id] === opt[0] ? "selected" : ""}`}
                      onClick={() => setAnswers(a => ({ ...a, [q.id]: opt[0] }))}
                    >
                      <span className="exam-opt-letter">{opt[0]}</span>
                      <span>{opt.replace(/^[A-D]\)\s*/, "")}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  className="exam-short-answer"
                  placeholder="Type your answer here..."
                  value={answers[q.id] || ""}
                  onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                  rows={5}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Nav buttons */}
          <div className="exam-nav-btns">
            <button className="exam-nav-btn" onClick={() => setCurrentQ(i => Math.max(0, i - 1))} disabled={currentQ === 0}>
              ← Previous
            </button>
            {currentQ < questions.length - 1 ? (
              <button className="exam-nav-btn primary" onClick={() => setCurrentQ(i => i + 1)}>
                Next →
              </button>
            ) : (
              <button className="exam-nav-btn primary" onClick={handleSubmit}>
                Submit Exam
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Phase 3: Results ──────────────────────────────────────────────────────────
function ExamResults({ result, questions, note, timeTaken, onRetry, onExit }) {
  const scoreColor = result.score >= 80 ? "#10b981" : result.score >= 60 ? "#f59e0b" : "#ef4444";
  const mins = Math.floor(timeTaken / 60);
  const secs = timeTaken % 60;

  return (
    <div className="exam-results">
      <motion.div className="exam-results-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        {/* Score Circle */}
        <div className="exam-score-area">
          <div className="exam-score-circle" style={{ "--score-color": scoreColor }}>
            <span className="exam-score-num">{result.score}%</span>
            <span className="exam-score-label">{result.score >= 80 ? "Excellent!" : result.score >= 60 ? "Good Job!" : "Keep Practicing"}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="exam-result-stats">
          <div className="exam-stat-chip">
            <Check size={14} /><span>{result.correctCount}/{result.totalQuestions} Correct</span>
          </div>
          <div className="exam-stat-chip">
            <Timer size={14} /><span>{mins}m {secs}s</span>
          </div>
          <div className="exam-stat-chip">
            <BookOpen size={14} /><span>{note?.name}</span>
          </div>
        </div>

        {/* Overall Feedback */}
        <div className="exam-feedback-section">
          <h3><Lightbulb size={16} /> AI Feedback</h3>
          <p>{result.feedback}</p>
        </div>

        {/* Weak Topics */}
        {result.weakTopics?.length > 0 && (
          <div className="exam-weak-section">
            <h3><AlertTriangle size={15} /> Areas to Review</h3>
            <div className="exam-weak-tags">
              {result.weakTopics.map((t, i) => (
                <span key={i} className="exam-weak-tag">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Study Recommendations */}
        {result.studyRecommendations?.length > 0 && (
          <div className="exam-recs-section">
            <h3><BookMarked size={15} /> Study Recommendations</h3>
            <ul className="exam-recs-list">
              {result.studyRecommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Question-by-question Breakdown */}
        {result.questionFeedback?.length > 0 && (
          <div className="exam-breakdown">
            <h3>Question Breakdown</h3>
            {result.questionFeedback.map((qf, i) => {
              const q = questions.find(q => q.id === qf.id) || questions[i];
              return (
                <div key={i} className={`exam-qf-item ${qf.correct ? "correct" : "wrong"}`}>
                  <div className="exam-qf-header">
                    {qf.correct ? <Check size={14} /> : <X size={14} />}
                    <span>Q{i + 1}: {q?.question?.slice(0, 60)}…</span>
                  </div>
                  {qf.feedback && <p className="exam-qf-text">{qf.feedback}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="exam-result-actions">
          <button className="exam-result-btn secondary" onClick={onRetry}>
            <RotateCcw size={16} /> Retake
          </button>
          <button className="exam-result-btn primary" onClick={onExit}>
            <ArrowLeft size={16} /> Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Exam Page ─────────────────────────────────────────────────────────────
export default function Exam() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("setup"); // setup | taking | grading | results
  const [examData, setExamData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeTaken, setTimeTaken] = useState(0);
  const [result, setResult] = useState(null);

  const handleStart = (data) => {
    setExamData(data);
    setPhase("taking");
  };

  const handleSubmit = async (submittedAnswers, time) => {
    setAnswers(submittedAnswers);
    setTimeTaken(time);
    setPhase("grading");
    try {
      const text = [examData.note.content, ...(examData.note.pages || [])].filter(Boolean).join("\n");
      const res = await aiService.gradeExam(examData.questions, submittedAnswers, text);
      const gradeResult = res.data.data;
      setResult(gradeResult);

      // Save exam to database
      try {
        await examService.create({
          title: `${examData.note.name} — Mock Exam`,
          noteId: examData.note._id,
          noteName: examData.note.name,
          examType: examData.examType,
          questions: examData.questions,
          answers: submittedAnswers,
          score: gradeResult.score,
          feedback: gradeResult.feedback,
          weakTopics: gradeResult.weakTopics,
          questionFeedback: gradeResult.questionFeedback,
          studyRecommendations: gradeResult.studyRecommendations,
          timeTaken: time,
        });
      } catch (saveErr) {
        console.warn("Exam save failed:", saveErr);
      }

      setPhase("results");
    } catch {
      toast.error("Grading failed. Please try again.");
      setPhase("taking");
    }
  };

  if (phase === "grading") {
    return (
      <div className="exam-grading">
        <Loader2 size={32} className="spin" />
        <h2>AI is grading your exam…</h2>
        <p>Analyzing your answers and preparing detailed feedback</p>
      </div>
    );
  }

  return (
    <div className="exam-page fade-in">
      {/* Header for setup phase */}
      {phase === "setup" && (
        <div className="exam-page-header">
          <button className="exam-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
          </button>
          <h1>Mock Exam</h1>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "setup" && <ExamSetup key="setup" onStart={handleStart} />}
        {phase === "taking" && (
          <ExamTaking
            key="taking"
            questions={examData.questions}
            timeLimit={examData.timeLimit}
            note={examData.note}
            onSubmit={handleSubmit}
          />
        )}
        {phase === "results" && (
          <ExamResults
            key="results"
            result={result}
            questions={examData.questions}
            note={examData.note}
            timeTaken={timeTaken}
            onRetry={() => setPhase("setup")}
            onExit={() => navigate(-1)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
