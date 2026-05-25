import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import AnimatedBackground from '@/components/AnimatedBackground';
import { ArrowLeft, Boxes } from 'lucide-react';

const NotFound: React.FC = () => {
  const location = useLocation();
  useEffect(() => {
    if (import.meta.env.DEV) console.warn('404 · unknown route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 text-center text-white overflow-hidden">
      <AnimatedBackground intensity="low" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[160px]" />
      <div className="relative">
        <div className="font-display text-[7rem] sm:text-[10rem] font-bold tracking-tighter leading-none text-gradient-cyan">404</div>
        <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/40 mb-4">Coordinate not found in the sovereign grid</div>
        <p className="text-white/55 max-w-md mx-auto mb-8">This route isn't part of the operating layer — the path may have moved or never existed.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#05071A] font-semibold hover:bg-white/90 transition">
            <ArrowLeft className="w-4 h-4" /> Return to platform
          </Link>
          <Link to="/ecosystem" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition">
            <Boxes className="w-4 h-4 text-cyan-400" /> Explore the ecosystem
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
