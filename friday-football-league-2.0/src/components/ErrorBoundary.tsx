import React from 'react';

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render/runtime errors so the app never fails silently to a blank
 * dark screen. Shows the failure and offers a recovery path instead.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Friday Football League crashed:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center">
          <h1 className="text-xl font-extrabold text-amber-400">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-400">
            The league app hit an unexpected error while loading. Your saved data on this device is untouched.
          </p>
          <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-slate-950 p-3 text-left text-xs text-slate-500">
            {error.message}
          </pre>
          <button
            onClick={this.handleReload}
            className="mt-5 w-full rounded-xl bg-amber-500 px-4 py-2.5 font-bold text-slate-950 hover:bg-amber-400"
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}
