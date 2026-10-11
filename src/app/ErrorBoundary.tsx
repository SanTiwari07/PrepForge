import { Component, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Page crashed:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="callout callout--danger" role="alert">
          <div>
            <strong>This page hit an error.</strong>
            <p className="small mt-2">{this.state.error.message}</p>
            <p className="small mt-2">Your saved progress is not affected. Try reloading, or go back to the dashboard.</p>
            <div className="row mt-4">
              <button className="btn btn--secondary btn--sm" onClick={() => window.location.reload()}>Reload</button>
              <a className="btn btn--ghost btn--sm" href="/">Dashboard</a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
