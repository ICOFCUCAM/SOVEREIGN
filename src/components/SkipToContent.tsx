import React from 'react';

// Visually-hidden skip link revealed on focus — keyboard accessibility primer.
// Pair with `<main id="main">` on any page that uses it.
export const SkipToContent: React.FC<{ targetId?: string }> = ({ targetId = 'main' }) => (
  <a
    href={`#${targetId}`}
    className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-[#05071A] focus:font-semibold"
  >
    Skip to content
  </a>
);

export default SkipToContent;
