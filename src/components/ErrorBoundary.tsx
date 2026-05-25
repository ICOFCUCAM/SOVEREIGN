import React from 'react';

interface State { hasError: boolean }

/** Catches render-time failures so a single subsystem can't white-screen the platform. */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#05071A] text-white text-center px-4">
          <div className="max-w-md">
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/40 mb-4">Signal interrupted</div>
            <div className="font-display text-3xl font-bold tracking-tighter mb-3">A subsystem failed to render.</div>
            <p className="text-white/50 mb-7">The channel can be re-established — reload to continue.</p>
            <a href="/" className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white text-[#05071A] font-semibold hover:bg-white/90 transition">
              Return to platform
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
