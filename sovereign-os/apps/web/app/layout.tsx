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

export const metadata: Metadata = {
  title: 'Emergency AI — Cinematic Intelligence Infrastructure',
  description: 'Cinematic media, intelligent distribution, and strategic communications — unified in one sovereign platform.',
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
