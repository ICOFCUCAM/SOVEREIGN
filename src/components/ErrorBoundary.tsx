import React from 'react';

interface State { hasError: boolean; error: Error | null }

/** Catches render-time failures so a single subsystem can't white-screen the platform. */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) console.error('[ErrorBoundary]', error);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#05071A] text-white text-center px-4">
          <div className="max-w-md">
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/40 mb-4">Signal interrupted</div>
            <div className="font-display text-3xl font-bold tracking-tighter mb-3">A subsystem failed to render.</div>
            <p className="text-white/50 mb-3">The channel can be re-established — try again or return to the platform.</p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left text-[11px] bg-black/40 border border-white/10 rounded-lg p-3 mb-5 overflow-auto max-h-40 text-rose-300/80">{this.state.error.message}</pre>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
              <button onClick={this.reset} className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white text-[#05071A] font-semibold hover:bg-white/90 transition">
                Try again
              </button>
              <button onClick={() => window.location.reload()} className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition">
                Reload
              </button>
              <a href="/" className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition">
                Return to platform
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
