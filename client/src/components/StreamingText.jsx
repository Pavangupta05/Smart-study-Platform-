import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

/**
 * Reveals streaming AI text word-by-word (typewriter highlight).
 */
const StreamingText = memo(({ text, isStreaming }) => {
  const words = useMemo(() => {
    if (!text) return [];
    return text.split(/(\s+)/);
  }, [text]);

  if (!isStreaming || words.length === 0) {
    return <ReactMarkdown>{text || ""}</ReactMarkdown>;
  }

  return (
    <div className="ais-streaming-md">
      {words.map((word, i) => (
        <motion.span
          key={`${i}-${word.slice(0, 8)}`}
          className="ais-stream-word"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.05, delay: Math.min(i * 0.006, 0.35) }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
});

StreamingText.displayName = "StreamingText";
export default StreamingText;
