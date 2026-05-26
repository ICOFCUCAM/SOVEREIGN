import React from 'react';

/** Command-interface corner brackets — classified/operational framing for premium panels. */
const HudCorners: React.FC<{ color?: string; className?: string }> = ({ color = '#00C2FF', className = '' }) => (
  <span aria-hidden className={`pointer-events-none absolute inset-0 ${className}`} style={{ color }}>
    <span className="absolute top-2.5 left-2.5 w-3 h-3 border-t border-l border-current" />
    <span className="absolute top-2.5 right-2.5 w-3 h-3 border-t border-r border-current" />
    <span className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b border-l border-current" />
    <span className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b border-r border-current" />
  </span>
);

export default HudCorners;
