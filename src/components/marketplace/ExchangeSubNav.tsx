import React, { useEffect, useState } from 'react';

const ITEMS = [
  { id: 'flagship', label: 'Flagship' },
  { id: 'sovereign', label: 'Sovereign' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'platforms', label: 'Platforms' },
];
const OFFSET = 118; // clearance for the floating nav + this strip

// Institutional command strip — appears once past the hero, scroll-spies the
// acquisition sections and smooth-scrolls to each. Docked under PlatformNav.
const ExchangeSubNav: React.FC = () => {
  const [show, setShow] = useState(false);
  const [active, setActive] = useState(ITEMS[0].id);

  useEffect(() => {
    const onScroll = () => {
      setShow(window.scrollY > window.innerHeight * 0.55);
      let cur = ITEMS[0].id;
      for (const it of ITEMS) {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top - OFFSET <= 1) cur = it.id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - OFFSET, behavior: 'smooth' });
  };

  return (
    <div className={`fixed inset-x-0 top-[70px] z-40 px-3 sm:px-4 transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
      <div className="mx-auto max-w-7xl rounded-xl border border-white/10 bg-[#070b1c]/80 backdrop-blur-xl shadow-[0_16px_40px_-20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-1 px-3 h-11 overflow-x-auto">
          <span className="hidden sm:inline-flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.24em] text-cyan-300/50 pr-3 mr-1 border-r border-white/10 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Exchange
          </span>
          {ITEMS.map((it) => (
            <button key={it.id} onClick={() => go(it.id)} aria-current={active === it.id ? 'true' : undefined}
              className={`relative px-3 py-2 text-[11px] font-mono uppercase tracking-[0.18em] whitespace-nowrap transition-colors ${active === it.id ? 'text-white' : 'text-white/45 hover:text-white/80'}`}>
              {it.label}
              {active === it.id && <span className="absolute inset-x-2.5 -bottom-px h-px" style={{ background: 'linear-gradient(90deg, transparent, #00D9FF, transparent)' }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExchangeSubNav;
