import { ImageResponse } from 'next/og';

// Cinematic OG card — rendered at request time so it always reflects the
// current brand. 1200×630 follows the standard share-card spec.
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Emergency AI — Cinematic Intelligence Infrastructure';

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          backgroundColor: '#08080d',
          backgroundImage:
            'radial-gradient(circle at 80% 30%, rgba(212,168,106,0.20), transparent 60%)',
          color: '#dad3c4',
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg width="44" height="44" viewBox="0 0 32 32">
            <defs>
              <linearGradient id="og-g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#efd9b3" />
                <stop offset="100%" stopColor="#d4a86a" />
              </linearGradient>
            </defs>
            <path d="M16 2 L28 16 L16 30 L4 16 Z" fill="none" stroke="url(#og-g)" strokeWidth="1.5" />
            <path d="M16 9 L22 16 L16 23 L10 16 Z" fill="url(#og-g)" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontSize: 22, letterSpacing: '0.18em', color: '#dad3c4' }}>EMERGENCY AI</span>
            <span style={{ fontSize: 14, letterSpacing: '0.32em', color: '#7d7a72' }}>BY SOVEREIGN</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: '0.28em', color: '#d4a86a' }}>
            CINEMATIC INTELLIGENCE INFRASTRUCTURE
          </div>
          <div style={{ display: 'flex', fontSize: 92, fontWeight: 600, lineHeight: 1.02, marginTop: 24, color: '#dad3c4', maxWidth: 1000 }}>
            Own the&nbsp;<span style={{ fontStyle: 'italic', color: '#efd9b3' }}>narrative.</span>
          </div>
          <div style={{ display: 'flex', fontSize: 30, marginTop: 28, color: '#7d7a72', maxWidth: 880, lineHeight: 1.3 }}>
            Cinematic media, intelligent distribution, and strategic communications — unified in one sovereign platform.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 18, letterSpacing: '0.32em', color: '#7d7a72' }}>
            EMERGENCY.AI
          </div>
          <div style={{ fontSize: 18, letterSpacing: '0.22em', color: '#7d7a72' }}>
            LINKEDIN · YOUTUBE · X
          </div>
        </div>
      </div>
    ),
    size,
  );
}
