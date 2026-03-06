import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          textAlign: 'center',
          background: '#f9fafb',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '20px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
            maxWidth: '500px'
          }}>
            <h1 style={{ color: '#ef4444', marginBottom: '10px' }}>Something went wrong</h1>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              The application encountered an unexpected error. This usually happens after a major update.
            </p>
            <div style={{
               background: '#fef2f2',
               padding: '12px',
               borderRadius: '8px',
               fontSize: '12px',
               color: '#dc2626',
               marginBottom: '24px'
            }}>
                {this.state.error && this.state.error.toString()}
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
              style={{
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Reset Application & Fix
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
