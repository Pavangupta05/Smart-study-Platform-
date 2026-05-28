import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Play, Pause, Square, ChevronUp, Mic2, Settings2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { aiService } from "../services/index";
import "./VoiceTutor.css";

// ── Waveform Visualizer ───────────────────────────────────────────────────────
function Waveform({ isActive }) {
  return (
    <div className="vt-waveform siri-orb-container" style={{ height: "40px", transform: isActive ? "scale(1.2)" : "scale(0.8)", transition: "all 0.5s ease", opacity: isActive ? 1 : 0.4 }}>
      <div className="siri-orb-core" style={{ width: "24px", height: "24px" }}>
        <div className="orb-blur orb-red" style={{ animationPlayState: isActive ? "running" : "paused" }} />
        <div className="orb-blur orb-blue" style={{ animationPlayState: isActive ? "running" : "paused" }} />
        <div className="orb-blur orb-purple" style={{ animationPlayState: isActive ? "running" : "paused" }} />
      </div>
    </div>
  );
}

// ── Main VoiceTutor ───────────────────────────────────────────────────────────
export default function VoiceTutor({ isOpen, onClose, initialText = "", initialTopic = "" }) {
  const [mode, setMode] = useState("read"); // "read" | "podcast"
  const [text, setText] = useState(initialText);
  const [podcastTopic, setPodcastTopic] = useState(initialTopic);
  const [script, setScript] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentLineIdx, setCurrentLineIdx] = useState(-1);

  const utteranceRef = useRef(null);

  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      const english = v.filter(voice => voice.lang.startsWith("en"));
      setVoices(english.length > 0 ? english : v);
      if (!selectedVoice && (english.length > 0 || v.length > 0)) {
        setSelectedVoice((english[0] || v[0]).name);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    if (initialText) setText(initialText);
  }, [initialText]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentLineIdx(-1);
  }, []);

  const speak = useCallback((textToSpeak) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.rate = speed;
    utterance.pitch = 1;
    utterance.onstart = () => { setIsSpeaking(true); setIsPaused(false); };
    utterance.onend = () => { setIsSpeaking(false); setCurrentLineIdx(-1); };
    utterance.onerror = () => { setIsSpeaking(false); };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [voices, selectedVoice, speed]);

  const speakScript = useCallback((scriptLines) => {
    window.speechSynthesis.cancel();
    const fullText = scriptLines.map(l => `${l.speaker} says: ${l.line}`).join(". ");
    speak(fullText);
  }, [speak]);

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }
    if (mode === "podcast" && script) {
      speakScript(script);
    } else {
      const content = text.replace(/[#*`_]/g, "").trim();
      if (!content) { toast.error("No text to read."); return; }
      speak(content);
    }
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsSpeaking(false);
  };

  const handleGeneratePodcast = async () => {
    if (!podcastTopic.trim()) { toast.error("Enter a topic first."); return; }
    setIsGenerating(true);
    try {
      const res = await aiService.generatePodcast(podcastTopic, "short");
      setScript(res.data.data.script);
      toast.success("Podcast script generated!");
    } catch {
      toast.error("Failed to generate podcast.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="vt-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="vt-panel"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      >
        {/* Header */}
        <div className="vt-header">
          <div className="vt-header-left">
            <div className="vt-logo">
              <Volume2 size={16} />
            </div>
            <div>
              <span className="vt-title">Voice Tutor</span>
              <span className="vt-subtitle">Browser TTS · Offline</span>
            </div>
          </div>
          <div className="vt-header-right">
            <button className="vt-icon-btn" onClick={() => setShowSettings(s => !s)} title="Settings">
              <Settings2 size={15} />
            </button>
            <button className="vt-icon-btn" onClick={() => { stop(); onClose(); }} title="Close">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div className="vt-settings" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div className="vt-setting-row">
                <label>Voice</label>
                <select value={selectedVoice || ""} onChange={e => setSelectedVoice(e.target.value)}>
                  {voices.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                </select>
              </div>
              <div className="vt-setting-row">
                <label>Speed: {speed}x</label>
                <input type="range" min="0.5" max="2" step="0.25" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode Tabs */}
        <div className="vt-tabs">
          <button className={`vt-tab ${mode === "read" ? "active" : ""}`} onClick={() => setMode("read")}>
            <Volume2 size={13} /> Read Aloud
          </button>
          <button className={`vt-tab ${mode === "podcast" ? "active" : ""}`} onClick={() => setMode("podcast")}>
            <Mic2 size={13} /> Podcast Mode
          </button>
        </div>

        {/* Content Area */}
        <div className="vt-content">
          {mode === "read" ? (
            <textarea
              className="vt-textarea"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste or type text to read aloud..."
              rows={4}
            />
          ) : (
            <div className="vt-podcast-area">
              <div className="vt-podcast-input-row">
                <input
                  className="vt-podcast-input"
                  value={podcastTopic}
                  onChange={e => setPodcastTopic(e.target.value)}
                  placeholder="Enter a study topic for the podcast..."
                  onKeyDown={e => e.key === "Enter" && handleGeneratePodcast()}
                />
                <button className="vt-gen-btn" onClick={handleGeneratePodcast} disabled={isGenerating}>
                  {isGenerating ? <Loader2 size={14} className="spin" /> : "Generate"}
                </button>
              </div>
              {script && (
                <div className="vt-script">
                  {script.map((line, i) => (
                    <div key={i} className={`vt-script-line ${line.speaker === "Professor" ? "prof" : "student"}`}>
                      <span className="vt-speaker">{line.speaker}</span>
                      <span className="vt-line-text">{line.line}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Waveform & Controls */}
        <div className="vt-player">
          <Waveform isActive={isSpeaking} />
          <div className="vt-controls">
            {isSpeaking ? (
              <button className="vt-control-btn pause" onClick={handlePause}>
                <Pause size={18} fill="currentColor" />
              </button>
            ) : (
              <button className="vt-control-btn play" onClick={handlePlay}>
                <Play size={18} fill="currentColor" />
              </button>
            )}
            <button className="vt-control-btn stop" onClick={stop} disabled={!isSpeaking && !isPaused}>
              <Square size={14} fill="currentColor" />
            </button>
          </div>
          <span className="vt-status">
            {isSpeaking ? "Speaking..." : isPaused ? "Paused" : "Ready"}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
