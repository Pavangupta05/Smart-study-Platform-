import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ClipboardList, ArrowLeft, Loader2, Calendar, 
  Timer, Target, CheckCircle2, ChevronRight, BookOpen, Trash2,
  AlertTriangle, BookMarked, Lightbulb
} from "lucide-react";
import { toast } from "sonner";
import { examService } from "../services/index";
import "../styles/dashboard.css"; // Reuse dashboard card styles

export default function ExamHistory() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [examDetail, setExamDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await examService.getAll();
      setExams(res.data.exams || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load exam history.");
    } finally {
      setLoading(false);
    }
  };

  const viewExam = async (id) => {
    setLoadingDetail(true);
    setSelectedExamId(id);
    try {
      const res = await examService.getById(id);
      setExamDetail(res.data.exam);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load exam details.");
      setSelectedExamId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const deleteExam = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this exam record?")) return;
    try {
      await examService.delete(id);
      setExams(exams.filter(ex => ex._id !== id));
      toast.success("Exam deleted.");
      if (selectedExamId === id) {
        setSelectedExamId(null);
        setExamDetail(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete exam.");
    }
  };

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVars = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="dash-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 size={32} className="spin" color="var(--primary)" />
      </div>
    );
  }

  // DETAILED VIEW
  if (selectedExamId && examDetail) {
    const scoreColor = examDetail.score >= 80 ? "#10b981" : examDetail.score >= 60 ? "#f59e0b" : "#ef4444";
    const mins = Math.floor(examDetail.timeTaken / 60);
    const secs = examDetail.timeTaken % 60;
    
    return (
      <div className="dash-container fade-in" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '30px' }}>
          <button className="btn-icon-small" onClick={() => { setSelectedExamId(null); setExamDetail(null); }} style={{ background: 'var(--surface)', padding: '8px' }}>
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ margin: 0, fontSize: '24px' }}>{examDetail.title}</h1>
        </div>

        <motion.div className="exam-results-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--surface)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' }}>
            <div className="exam-score-circle" style={{ "--score-color": scoreColor, width: '140px', height: '140px', borderRadius: '50%', border: `8px solid ${scoreColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `rgba(${scoreColor === '#10b981' ? '16,185,129' : scoreColor === '#f59e0b' ? '245,158,11' : '239,68,68'}, 0.1)` }}>
              <span style={{ fontSize: '36px', fontWeight: '900', color: scoreColor }}>{examDetail.score}%</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
            <div className="insight-card" style={{ padding: '12px 20px', flexDirection: 'row', gap: '12px', flex: 'none' }}>
              <Calendar size={18} color="var(--primary)" />
              <span style={{ fontWeight: '600' }}>{new Date(examDetail.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="insight-card" style={{ padding: '12px 20px', flexDirection: 'row', gap: '12px', flex: 'none' }}>
              <Timer size={18} color="#f59e0b" />
              <span style={{ fontWeight: '600' }}>{mins}m {secs}s</span>
            </div>
          </div>

          {examDetail.feedback && (
            <div style={{ marginBottom: '30px', padding: '24px', background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '16px', border: '1px solid rgba(var(--primary-rgb), 0.1)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, color: 'var(--primary)' }}><Lightbulb size={18} /> AI Feedback</h3>
              <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text)' }}>{examDetail.feedback}</p>
            </div>
          )}

          {examDetail.weakTopics?.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}><AlertTriangle size={18} /> Areas to Review</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {examDetail.weakTopics.map((t, i) => (
                  <span key={i} style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {examDetail.studyRecommendations?.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}><BookMarked size={18} /> Next Steps</h3>
              <ul style={{ margin: 0, paddingLeft: '24px', color: 'var(--text-secondary)' }}>
                {examDetail.studyRecommendations.map((r, i) => (
                  <li key={i} style={{ marginBottom: '8px', lineHeight: 1.5 }}>{r}</li>
                ))}
              </ul>
            </div>
          )}

        </motion.div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="dash-container fade-in" style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      
      <header className="dash-header" style={{ marginBottom: '40px' }}>
        <div className="dash-greeting">
          <h1>Exam History 📊</h1>
          <p>Review your past mock exams and track your progress.</p>
        </div>
        <div className="dash-header-actions">
          <button className="btn-primary" onClick={() => navigate("/exam")}>
            <Target size={16} /> Take New Exam
          </button>
        </div>
      </header>

      {exams.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', background: 'var(--surface)', borderRadius: '24px', border: '1px dashed var(--border)' }}>
          <ClipboardList size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>No exams taken yet</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Test your knowledge by generating an AI mock exam from your notes.</p>
          <button className="btn-primary" onClick={() => navigate("/exam")}>Start an Exam</button>
        </div>
      ) : (
        <motion.div 
          className="study-insights" 
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}
          variants={containerVars} initial="hidden" animate="show"
        >
          {exams.map(exam => {
            const scoreColor = exam.score >= 80 ? "#10b981" : exam.score >= 60 ? "#f59e0b" : "#ef4444";
            return (
              <motion.div 
                key={exam._id} 
                variants={itemVars} 
                className="quick-action-card"
                style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '24px', position: 'relative' }}
                onClick={() => viewExam(exam._id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '16px' }}>
                  <div style={{ 
                    background: `rgba(${scoreColor === '#10b981' ? '16,185,129' : scoreColor === '#f59e0b' ? '245,158,11' : '239,68,68'}, 0.1)`, 
                    color: scoreColor, 
                    padding: '8px 12px', 
                    borderRadius: '12px', 
                    fontWeight: '800',
                    fontSize: '18px'
                  }}>
                    {exam.score}%
                  </div>
                  <button 
                    className="btn-icon-small" 
                    style={{ opacity: 0.6 }}
                    onClick={(e) => deleteExam(exam._id, e)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <h3 style={{ fontSize: '16px', margin: '0 0 8px 0', fontWeight: '700' }}>{exam.title}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <BookOpen size={14} /> {exam.noteName || "Unknown Note"}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <Calendar size={14} /> {new Date(exam.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ marginTop: '20px', width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View Results <ChevronRight size={14} />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {loadingDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <Loader2 size={32} className="spin" color="#fff" />
        </div>
      )}
    </div>
  );
}
