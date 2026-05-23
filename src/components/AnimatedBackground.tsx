import React from 'react';

const AnimatedBackground: React.FC<{ intensity?: 'low' | 'high' }> = ({ intensity = 'high' }) => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#05071A]">
      {/* Gradient mesh */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-40 w-[800px] h-[800px] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute top-1/3 -right-40 w-[700px] h-[700px] rounded-full bg-purple-600/10 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,217,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)'
        }} />

      {/* Particle dots */}
      {intensity === 'high' && (
        <div className="absolute inset-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i}
              className="absolute w-1 h-1 rounded-full bg-cyan-400/40 animate-float"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 100}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${8 + (i % 5)}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Noise overlay */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence baseFrequency=\'0.9\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />
    </div>
  );
};

export default AnimatedBackground;
