/**
 * detectArtifact — Intelligently classify AI response content
 * Returns an artifact descriptor or null if plain chat.
 *
 * Precedence (most-specific first):
 *  mermaid → code → flashcards → quiz → table → study-plan → markdown
 */
export function detectArtifact(text) {
  if (!text || text.length < 40) return null;

  // Mermaid diagram
  if (/```mermaid/i.test(text)) {
    return { type: "mermaid", content: extractFence(text, "mermaid") };
  }

  // Code block (any language)
  if (/```[\w]*\n[\s\S]+?```/.test(text)) {
    const lang = (text.match(/```(\w+)/) || [])[1] || "text";
    return { type: "code", content: extractFence(text, lang), meta: { lang } };
  }

  // Flashcard pattern — Q: / A: OR **Q:** format
  if (
    /(\*\*Q:|Q\d*[:.)]\s|\*\*Question\s*\d*:)/i.test(text) &&
    /(A\d*[:.)]\s|\*\*A:|Answer:)/i.test(text)
  ) {
    return { type: "flashcards", content: text };
  }

  // Quiz pattern — numbered questions with options A) B) C)
  if (
    /\d+[\.\)]\s+.{10,}/.test(text) &&
    /[A-D][\.\)]\s/.test(text)
  ) {
    return { type: "quiz", content: text };
  }

  // Table — markdown pipe table
  if (/\|.+\|.+\|/.test(text) && /\|[-:]+\|/.test(text)) {
    return { type: "table", content: text };
  }

  // Study plan / schedule — contains day patterns or numbered day schedule
  if (
    /(day\s*\d|week\s*\d|\bschedule\b|\bplan\b)/i.test(text) &&
    /\d+[\.\)]\s/.test(text) &&
    text.length > 300
  ) {
    return { type: "study-plan", content: text };
  }

  // Long structured markdown (headings + bullets, substantial)
  if (text.length > 400 && /^#{1,3} /m.test(text)) {
    return { type: "markdown", content: text };
  }

  return null;
}

/** Extract code from a fenced block */
function extractFence(text, lang) {
  const regex = new RegExp("```" + lang + "\\n([\\s\\S]+?)```", "i");
  const match = text.match(regex);
  return match ? match[1].trim() : text;
}

/** Parse flashcard text into [{question, answer}] pairs */
export function parseFlashcards(text) {
  const cards = [];

  // Try **Q: / **A: format
  const boldFormat = [...text.matchAll(/\*\*Q\d*[:.)]\*?\*?\s*(.+?)\n+\*\*A\d*[:.)]\*?\*?\s*([\s\S]+?)(?=\*\*Q|\n\n\n|$)/gi)];
  if (boldFormat.length > 0) {
    boldFormat.forEach((m) => cards.push({ question: m[1].trim(), answer: m[2].trim() }));
    return cards;
  }

  // Try numbered Q: / A: format
  const lines = text.split("\n").filter(Boolean);
  let current = null;
  for (const line of lines) {
    const qMatch = line.match(/^Q\d*[:.)]\s*(.+)/i);
    const aMatch = line.match(/^A\d*[:.)]\s*(.+)/i);
    if (qMatch) { current = { question: qMatch[1].trim(), answer: "" }; }
    else if (aMatch && current) {
      current.answer = aMatch[1].trim();
      cards.push(current);
      current = null;
    }
  }
  return cards;
}

/** Parse quiz into [{question, options[], answer?}] */
export function parseQuiz(text) {
  const questions = [];
  const blocks = text.split(/\n(?=\d+[\.\)])/);
  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    if (!lines.length) continue;
    const question = lines[0].replace(/^\d+[\.\)]\s*/, "").trim();
    const options = lines.slice(1)
      .filter((l) => /^[A-D][\.\)]\s/.test(l))
      .map((l) => l.replace(/^[A-D][\.\)]\s*/, "").trim());
    if (question && options.length >= 2) {
      questions.push({ question, options });
    }
  }
  return questions;
}
