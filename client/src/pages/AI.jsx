import AISplit from "../features/ai/AISplit";

/**
 * AI Page Wrapper
 * The monolithic AI logic has been refactored into features/ai/AISplit.jsx
 * This page simply renders the new split workspace.
 */
export default function AI() {
  return (
    <div className="ai-page">
      <AISplit />
    </div>
  );
}