import type { Metadata } from 'next';
import './globals.css';
import { CommandShell } from '../components/CommandShell';

export const metadata: Metadata = {
  title: 'Sovereign · Command Center',
  description: 'Executive media, distribution and intelligence command infrastructure.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-mono antialiased">
        <CommandShell>{children}</CommandShell>
      </body>
    </html>
  );
}
