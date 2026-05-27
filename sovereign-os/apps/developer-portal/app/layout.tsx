import type { Metadata } from 'next';
import './globals.css';
import { PortalShell } from '../components/PortalShell';

export const metadata: Metadata = {
  title: 'Sovereign · Developer Platform',
  description: 'Issue API keys, manage usage, and integrate the Sovereign media, distribution and intelligence API.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PortalShell>{children}</PortalShell>
      </body>
    </html>
  );
}
