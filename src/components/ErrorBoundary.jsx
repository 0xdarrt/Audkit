import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#222', color: '#fff', minHeight: '100vh', width: '100vw', zIndex: 99999, position: 'fixed', top: 0, left: 0 }}>
          <h1 style={{ color: '#ff5555' }}>Something went wrong.</h1>
          <p style={{fontFamily: 'monospace', fontSize: '14px', whiteSpace: 'pre-wrap', background: '#000', padding: '20px', borderRadius: '8px', border: '1px solid #ff5555'}}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </p>
          <button 
            style={{ padding: '10px 20px', background: '#ff5555', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
