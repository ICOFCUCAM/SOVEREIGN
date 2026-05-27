import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sovereign — AI Media & Acquisition Infrastructure',
  description: 'Generate cinematic media, distribute across 11 platforms, and run strategic intelligence through one sovereign API you own.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-mono antialiased">{children}</body>
    </html>
  );
}
