import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const AIContext = createContext();

export function AIProvider({ children }) {
  const [currentNote, setCurrentNote] = useState(null);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [highlightedText, setHighlightedText] = useState("");
  
  const location = useLocation();

  // Reset context when navigating away from reader/notes
  useEffect(() => {
    if (!location.pathname.includes("/reader") && !location.pathname.includes("/notes")) {
      setCurrentNote(null);
      setCurrentDocument(null);
      setHighlightedText("");
    }
  }, [location.pathname]);

  // Track text selection globally for the AI to "see"
  useEffect(() => {
    const handleSelection = () => {
      const text = window.getSelection().toString().trim();
      if (text.length > 5 && text.length < 2000) {
        setHighlightedText(text);
      }
    };
    
    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, []);

  const value = {
    currentNote,
    setCurrentNote,
    currentDocument,
    setCurrentDocument,
    highlightedText,
    setHighlightedText,
    selection: highlightedText, // Provide as 'selection' for the backend
    currentPage: location.pathname
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAIContext() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error("useAIContext must be used within an AIProvider");
  }
  return context;
}
