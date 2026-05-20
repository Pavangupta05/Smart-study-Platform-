import { useEffect } from "react";

/**
 * Bind keyboard shortcuts. Ignores when focus is in input/textarea (except when allowInInput is true).
 */
export function useHotkeys(bindings, deps = []) {
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      const inField = tag === "input" || tag === "textarea" || e.target?.isContentEditable;

      for (const b of bindings) {
        if (b.allowInInput !== true && inField) continue;
        const ctrl = b.ctrl ?? b.meta;
        const wantCtrl = ctrl === true || (ctrl === undefined && (b.key === " " || b.key === "m" || b.key === "f"));
        if (wantCtrl && !(e.ctrlKey || e.metaKey)) continue;
        if (!wantCtrl && (e.ctrlKey || e.metaKey) && b.key !== "Enter") continue;
        if (b.shift && !e.shiftKey) continue;
        if (!b.shift && b.key === "Enter" && e.shiftKey) continue;
        if (e.key.toLowerCase() !== b.key.toLowerCase() && e.code !== b.code) continue;
        e.preventDefault();
        b.handler(e);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
