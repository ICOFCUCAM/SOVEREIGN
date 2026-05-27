import Link from 'next/link';

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen font-mono">
      <header className="flex items-center justify-between border-b border-sov-edge bg-sov-panel/50 px-6 py-4">
        <Link href="/" className="leading-tight">
          <span className="block text-[10px] tracking-[0.3em] text-sov-mute">SOVEREIGN</span>
          <span className="block text-sm font-semibold text-sov-cyan">DEVELOPER PLATFORM</span>
        </Link>
        <nav className="flex gap-5 text-xs text-sov-mute">
          <Link href="/" className="hover:text-sov-cyan">Keys</Link>
          <Link href="/docs" className="hover:text-sov-cyan">API Docs</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
