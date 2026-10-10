import React from "react";

// Console iconography — one stroke weight (1.5), one grid (20×20), drawn inline so
// nothing is fetched. Icons are decorative by default (aria-hidden); an icon-only
// control must carry its own accessible name.
type P = { className?: string };
const S: React.FC<P & { d: React.ReactNode }> = ({ className = "h-4 w-4", d }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden focusable="false">{d}</svg>
);

export const Icon = {
  command: (p: P) => <S {...p} d={<><rect x="3" y="3" width="6" height="6" rx="1.2" /><rect x="11" y="3" width="6" height="6" rx="1.2" /><rect x="3" y="11" width="6" height="6" rx="1.2" /><path d="M11 14h6M14 11v6" /></>} />,
  plus: (p: P) => <S {...p} d={<path d="M10 4v12M4 10h12" />} />,
  review: (p: P) => <S {...p} d={<><path d="M4 16.5h8" /><path d="M7.5 9.5l5-5 3 3-5 5z" /><path d="M9 8l3 3" /><path d="M12.5 4.5l3 3" /></>} />,
  register: (p: P) => <S {...p} d={<><rect x="3.5" y="3" width="13" height="14" rx="1.5" /><path d="M6.5 7h7M6.5 10h7M6.5 13h4" /></>} />,
  archive: (p: P) => <S {...p} d={<><rect x="2.5" y="3.5" width="15" height="4" rx="1" /><path d="M4 7.5v8a1 1 0 001 1h10a1 1 0 001-1v-8" /><path d="M8 11h4" /></>} />,
  evidence: (p: P) => <S {...p} d={<><path d="M7 4h6M7 16h6" /><path d="M10 4v12" /><circle cx="10" cy="10" r="2" /><path d="M4 7l2 3-2 3M16 7l-2 3 2 3" /></>} />,
  studio: (p: P) => <S {...p} d={<><path d="M6 3h6l4 4v10H6z" /><path d="M12 3v4h4" /><path d="M8.5 11h5M8.5 14h3" /></>} />,
  building: (p: P) => <S {...p} d={<><path d="M3 8l7-4.5L17 8" /><path d="M4.5 8v7M8 8v7M12 8v7M15.5 8v7" /><path d="M3 16.5h14" /></>} />,
  swap: (p: P) => <S {...p} d={<><path d="M4 7h11l-3-3" /><path d="M16 13H5l3 3" /></>} />,
  logout: (p: P) => <S {...p} d={<><path d="M8 4H5a1 1 0 00-1 1v10a1 1 0 001 1h3" /><path d="M12 6l4 4-4 4M16 10H8" /></>} />,
  home: (p: P) => <S {...p} d={<><path d="M3.5 9.5L10 4l6.5 5.5" /><path d="M5 8.5V16h10V8.5" /></>} />,
  menu: (p: P) => <S {...p} d={<path d="M3.5 6h13M3.5 10h13M3.5 14h13" />} />,
  close: (p: P) => <S {...p} d={<path d="M5 5l10 10M15 5L5 15" />} />,
  search: (p: P) => <S {...p} d={<><circle cx="9" cy="9" r="5" /><path d="M13 13l3.5 3.5" /></>} />,
  refresh: (p: P) => <S {...p} d={<><path d="M16 10a6 6 0 11-1.8-4.3" /><path d="M16 4v3.5h-3.5" /></>} />,
  copy: (p: P) => <S {...p} d={<><rect x="7" y="7" width="9.5" height="9.5" rx="1.5" /><path d="M13 7V4.5A1 1 0 0012 3.5H4.5a1 1 0 00-1 1V12a1 1 0 001 1H7" /></>} />,
  check: (p: P) => <S {...p} d={<path d="M4.5 10.5l3.5 3.5 7.5-8" />} />,
  external: (p: P) => <S {...p} d={<><path d="M11 4h5v5" /><path d="M16 4l-7 7" /><path d="M14 11.5V15a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h3.5" /></>} />,
  chevronRight: (p: P) => <S {...p} d={<path d="M8 5l5 5-5 5" />} />,
  chevronDown: (p: P) => <S {...p} d={<path d="M5 8l5 5 5-5" />} />,
  arrowLeft: (p: P) => <S {...p} d={<path d="M16 10H4M9 5l-5 5 5 5" />} />,
  arrowRight: (p: P) => <S {...p} d={<path d="M4 10h12M11 5l5 5-5 5" />} />,
  alert: (p: P) => <S {...p} d={<><path d="M10 3.5l7 12.5H3z" /><path d="M10 8.5v3.5M10 14.2v.1" /></>} />,
  info: (p: P) => <S {...p} d={<><circle cx="10" cy="10" r="7" /><path d="M10 9v4.5M10 6.5v.1" /></>} />,
  lock: (p: P) => <S {...p} d={<><rect x="4.5" y="9" width="11" height="8" rx="1.5" /><path d="M7 9V6.5a3 3 0 016 0V9" /></>} />,
  shield: (p: P) => <S {...p} d={<path d="M10 3l6 2.2V10c0 3.8-2.6 6.4-6 7.5-3.4-1.1-6-3.7-6-7.5V5.2z" />} />,
  seal: (p: P) => <S {...p} d={<><circle cx="10" cy="8.5" r="5" /><circle cx="10" cy="8.5" r="2.6" /><path d="M7 12.8L6 17.5l4-2 4 2-1-4.7" /></>} />,
  download: (p: P) => <S {...p} d={<><path d="M10 3.5v9M6 9l4 4 4-4" /><path d="M4 16.5h12" /></>} />,
  clock: (p: P) => <S {...p} d={<><circle cx="10" cy="10" r="7" /><path d="M10 6v4l2.5 2" /></>} />,
  user: (p: P) => <S {...p} d={<><circle cx="10" cy="7" r="3.2" /><path d="M4 17c.8-3 3.2-4.5 6-4.5s5.2 1.5 6 4.5" /></>} />,
  hash: (p: P) => <S {...p} d={<path d="M8 3.5L6.5 16.5M13.5 3.5L12 16.5M4 7.5h13M3 12.5h13" />} />,
  keyboard: (p: P) => <S {...p} d={<><rect x="2.5" y="5" width="15" height="10" rx="1.5" /><path d="M5.5 8h1M8.5 8h1M11.5 8h1M14.5 8h0M6.5 12h7" /></>} />,
};
