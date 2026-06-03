import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)',
          color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', padding: '2rem', textAlign: 'center'
        }}>
          <AlertTriangle size={64} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '500px' }}>
            We encountered an unexpected error. Refreshing the page usually fixes this issue.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
              background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontSize: '1rem', fontWeight: '500'
            }}
          >
            <RefreshCcw size={18} /> Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
