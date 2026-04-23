import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutTemplate, 
  Plus, 
  BookOpen, 
  Brain, 
  Zap, 
  Check,
  ChevronRight,
  GraduationCap,
  Calendar,
  ListTodo
} from "lucide-react";
import "../styles/templates.css";

function Templates() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Academic", "Productivity", "Planning"];

  const templates = [
    { 
      id: "cornell",
      title: "Cornell Notes", 
      desc: "Classic layout for lectures and active recall.", 
      icon: <BookOpen size={20} />, 
      color: "#10b981",
      cat: "Academic",
      content: "# Cornell Notes Template\n\n## Cues\n- Key points here\n\n## Notes\n- Detailed lecture notes here\n\n## Summary\n- 3 sentence summary of the lesson"
    },
    { 
      id: "project",
      title: "Project Roadmap", 
      desc: "Organize long-term research and deadlines.", 
      icon: <Zap size={20} />, 
      color: "#8b5cf6",
      cat: "Planning",
      content: "# Project: [Name]\n\n## Goals\n- Goal 1\n\n## Milestones\n- Phase 1: Planning\n- Phase 2: Execution\n\n## Resources\n- [Link]"
    },
    { 
      id: "deepwork",
      title: "Deep Work Log", 
      desc: "Track focus sessions and flow states.", 
      icon: <Brain size={20} />, 
      color: "#f59e0b",
      cat: "Productivity",
      content: "# Deep Work Session\n\n**Date:** Today\n**Focus Area:** [Subject]\n\n### Distraction Log\n- [ ] Interrupted by phone\n\n### Outcome\n- Completed [Task]"
    },
    { 
      id: "exam",
      title: "Exam Prep Master", 
      desc: "High-yield summary for midterm/finals.", 
      icon: <GraduationCap size={20} />, 
      color: "#ef4444",
      cat: "Academic",
      content: "# Exam Revision: [Subject]\n\n## High-Yield Concepts\n1. Concept A\n2. Concept B\n\n## Formulas to Remember\n- [Formula]\n\n## Weak Areas\n- Re-read Chapter 5"
    },
    { 
      id: "daily",
      title: "Daily Standup", 
      desc: "Simple 3-part daily planning.", 
      icon: <ListTodo size={20} />, 
      color: "#3b82f6",
      cat: "Productivity",
      content: "# Daily Plan\n\n### 1. Done Yesterday\n- Task A\n\n### 2. Focus Today\n- Task B\n\n### 3. Blockers\n- None"
    }
  ];

  const filteredTemplates = selectedCategory === "All" 
    ? templates 
    : templates.filter(t => t.cat === selectedCategory);

  const useTemplate = (t) => {
    const currentFiles = JSON.parse(localStorage.getItem("starNote_files") || "[]");
    const newFile = {
      name: `${t.title} - ${new Date().toLocaleDateString()}`,
      size: "Template",
      date: "Just now",
      icon: "✨",
      cat: "general",
      content: t.content
    };
    const updated = [newFile, ...currentFiles];
    localStorage.setItem("starNote_files", JSON.stringify(updated));
    navigate("/notes");
  };

  return (
    <div className="templates-page fade-in">
      <div className="templates-container">
        <div className="templates-sidebar-nav">
          <h2 className="nav-title">Categories</h2>
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`cat-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
              {selectedCategory === cat && <ChevronRight size={14} />}
            </button>
          ))}
        </div>

        <div className="templates-main">
          <div className="templates-header">
            <h1 className="page-title">Template Gallery</h1>
            <p className="page-subtitle">Jumpstart your workspace with pre-built structures.</p>
          </div>

          <div className="templates-grid">
            {filteredTemplates.map((t) => (
              <div key={t.id} className="template-card-modern" onClick={() => useTemplate(t)}>
                <div className="card-top">
                  <div className="icon-box" style={{ background: `${t.color}15`, color: t.color }}>
                    {t.icon}
                  </div>
                  <span className="cat-badge">{t.cat}</span>
                </div>
                <div className="card-body">
                  <h3>{t.title}</h3>
                  <p>{t.desc}</p>
                </div>
                <div className="card-footer">
                  <button className="btn-use">Use Template <Check size={14} /></button>
                </div>
              </div>
            ))}

            <div className="template-card-modern add-custom-card">
              <div className="icon-box-dashed">
                <Plus size={24} />
              </div>
              <h3>Create Custom</h3>
              <p>Design your own reusable framework.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Templates;
