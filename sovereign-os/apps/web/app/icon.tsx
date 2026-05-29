import { ImageResponse } from 'next/og';

// Next.js dynamic favicon — renders the Emergency AI brandmark at 32×32 so the
// tab shows the same gold lozenge as the header.
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#08080d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 32 32">
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#efd9b3" />
              <stop offset="100%" stopColor="#d4a86a" />
            </linearGradient>
          </defs>
          <path d="M16 2 L28 16 L16 30 L4 16 Z" fill="none" stroke="url(#g)" strokeWidth="2" />
          <path d="M16 9 L22 16 L16 23 L10 16 Z" fill="url(#g)" />
        </svg>
      </div>
    ),
    size,
  );
}
