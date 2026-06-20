import { Component, type ReactNode } from "react";

// App-wide error boundary: a render error should never show users a blank
// white screen. Catches it, logs it, and offers a calm, on-brand recovery
// path instead of crashing the whole app.
interface State { hasError: boolean }

class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Surface to the console for diagnostics; no PII is logged.
    console.error("Unhandled UI error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
          <div className="mx-auto max-w-md">
            <h1 className="font-serif text-2xl font-bold tracking-tight">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground font-sans">
              An unexpected error interrupted this page. Your work is saved — reloading usually fixes it.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-premium hover:bg-primary/90"
              >
                Reload page
              </button>
              <a
                href="/dashboard"
                className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-premium hover:bg-muted"
              >
                Back to dashboard
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
