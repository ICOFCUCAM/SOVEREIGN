import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://emergency.ai';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Emergency AI — Institutional Communications Infrastructure',
    template: '%s · Emergency AI',
  },
  description: 'Strategic communications infrastructure for governments, institutions and enterprises operating under public scrutiny.',
  applicationName: 'Emergency AI',
  authors: [{ name: 'SOVEREIGN', url: 'https://sovereign.so' }],
  keywords: ['AI video', 'cinematic AI', 'multi-channel publishing', 'LinkedIn', 'YouTube', 'X', 'sovereign infrastructure'],
  openGraph: {
    type: 'website',
    siteName: 'Emergency AI',
    title: 'Emergency AI — Institutional Communications Infrastructure',
    description: 'Strategic communications infrastructure for governments, institutions and enterprises operating under public scrutiny.',
    url: SITE,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Emergency AI',
    description: 'Strategic communications infrastructure for governments, institutions and enterprises operating under public scrutiny.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-emrg-bg font-sans text-emrg-ink antialiased">
        <AuthProvider>
          {children}
          <Toaster position="top-right" theme="dark" toastOptions={{ style: { background: '#0e0e14', border: '1px solid #1d1d28', color: '#dad3c4' } }} />
        </AuthProvider>
      </body>
    </html>
  );
}
