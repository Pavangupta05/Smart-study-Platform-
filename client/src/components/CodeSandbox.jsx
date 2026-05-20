import { useState, useRef } from "react";
import { Play, ChevronDown, ChevronUp, Terminal } from "lucide-react";

/**
 * Runs JS in a sandboxed iframe (no parent access).
 */
export default function CodeSandbox({ code, lang = "javascript" }) {
  const [open, setOpen] = useState(false);
  const [output, setOutput] = useState("");
  const iframeRef = useRef(null);

  const runnable = /^(javascript|js|typescript|ts)$/i.test(lang || "javascript");

  const runCode = () => {
    if (!runnable) {
      setOutput("Live run is supported for JavaScript only. Copy the snippet to your editor.");
      setOpen(true);
      return;
    }
    setOpen(true);
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const wrapped = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script>
  const logs = [];
  const _log = console.log;
  console.log = (...a) => { logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ')); _log(...a); };
  try {
    ${code}
    parent.postMessage({ type: 'sandbox-out', logs: logs.join('\\n'), error: null }, '*');
  } catch (e) {
    parent.postMessage({ type: 'sandbox-out', logs: logs.join('\\n'), error: e.message }, '*');
  }
</script></body></html>`;

    const onMessage = (e) => {
      if (e.data?.type === "sandbox-out") {
        setOutput(e.data.error ? `Error: ${e.data.error}` : (e.data.logs || "(no output)"));
        window.removeEventListener("message", onMessage);
      }
    };
    window.addEventListener("message", onMessage);
    doc.open();
    doc.write(wrapped);
    doc.close();
  };

  if (!runnable) return null;

  return (
    <div className="code-sandbox">
      <div className="code-sandbox-toolbar">
        <button type="button" className="code-sandbox-run" onClick={runCode} aria-label="Run code in sandbox">
          <Play size={14} />
          Run
        </button>
        <button
          type="button"
          className="code-sandbox-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Hide sandbox output" : "Show sandbox output"}
        >
          <Terminal size={14} />
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {open && (
        <div className="code-sandbox-panel">
          <pre className="code-sandbox-output" role="log">{output || "Click Run to execute safely in an isolated frame."}</pre>
          <iframe
            ref={iframeRef}
            title="Code execution sandbox"
            sandbox="allow-scripts"
            className="code-sandbox-iframe"
          />
        </div>
      )}
    </div>
  );
}
