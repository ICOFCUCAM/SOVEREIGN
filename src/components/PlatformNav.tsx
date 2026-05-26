import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BarChart3, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';

const LINKS = [
  { to: '/', label: 'Platform' },
  { to: '/ecosystem', label: 'Ecosystem' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/channel', label: 'Channel' },
  { to: '/valuation', label: 'AI Valuation' },
  { to: '/studio', label: 'Studio' },
  { to: '/deploy', label: 'Deploy' },
];

const PlatformNav: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [authModal, setAuthModal] = useState<null | 'signin' | 'signup'>(null);
  const [userMenu, setUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, role, isAdmin, signOut } = useAuth();
  const isActive = (p: string) => {
    const path = location.pathname;
    if (p === '/') return path === '/';
    if (p === '/ecosystem') return path.startsWith('/ecosystem') || path.startsWith('/systems');
    return path.startsWith(p);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav className={`fixed inset-x-0 top-0 z-50 px-3 sm:px-4 transition-all duration-500 ${scrolled ? 'pt-3' : 'pt-0'}`}>
        <div className={`mx-auto max-w-7xl transition-all duration-500 ${scrolled ? 'rounded-2xl border border-white/10 bg-[#070b1c]/80 backdrop-blur-xl shadow-[0_16px_50px_-20px_rgba(0,0,0,0.8)]' : 'border-b border-white/[0.06] bg-transparent'}`}>
          {/* top hairline accent */}
          <div className={`h-px transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'}`} style={{ background: 'linear-gradient(90deg, transparent, rgba(0,194,255,0.4), rgba(124,77,255,0.3), transparent)' }} />
          <div className="px-4 sm:px-5">
            <div className="flex items-center justify-between h-[60px]">
              {/* mark */}
              <Link to="/" aria-label="SOVEREIGN — home" className="flex items-center gap-2.5 group shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-400/40 blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
                  <img src="/sovereign-logo.png" alt="" aria-hidden="true" className="relative w-9 h-9 object-contain drop-shadow-[0_0_10px_rgba(0,194,255,0.35)]" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-white font-bold text-sm tracking-tight">SOVEREIGN</span>
                  <span className="text-cyan-400/60 text-[9px] tracking-[0.24em] font-mono">DOMAIN.OS</span>
                </div>
              </Link>

              {/* command links */}
              <div className="hidden lg:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
                {LINKS.map((l) => {
                  const active = isActive(l.to);
                  return (
                    <Link key={l.to} to={l.to} aria-current={active ? 'page' : undefined}
                      className={`relative text-[13px] font-medium tracking-tight transition-colors ${active ? 'text-white' : 'text-white/55 hover:text-white'}`}>
                      {l.label}
                      {active && <span className="absolute -bottom-[20px] left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #00D9FF, transparent)' }} />}
                    </Link>
                  );
                })}
              </div>

              {/* status + actions */}
              <div className="hidden lg:flex items-center gap-3 shrink-0">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-300/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Operational
                </span>
                <span className="w-px h-5 bg-white/10" />

                {user ? (
                  <div className="relative">
                    <button onClick={() => setUserMenu(!userMenu)} aria-label="Account menu" aria-expanded={userMenu}
                      className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-white/5 transition">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                        {(role?.full_name || user.email || 'U').slice(0, 1).toUpperCase()}
                      </div>
                      <span className={`text-[9px] font-mono uppercase tracking-wider ${isAdmin ? 'text-amber-300' : 'text-white/45'}`}>{role?.role || 'viewer'}</span>
                      <ChevronDown className="w-3 h-3 text-white/40" />
                    </button>
                    {userMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />
                        <div className="absolute right-0 top-full mt-2 w-56 glass-strong rounded-xl py-2 z-50 border border-white/10">
                          <div className="px-3 py-2 border-b border-white/5">
                            <div className="text-xs text-white font-medium truncate">{user.email}</div>
                            <div className={`text-[10px] font-mono uppercase tracking-wider mt-0.5 ${isAdmin ? 'text-amber-300' : 'text-white/40'}`}>{role?.role || 'viewer'} role</div>
                          </div>
                          {isAdmin && (
                            <Link to="/admin" onClick={() => setUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5">
                              <BarChart3 className="w-3.5 h-3.5" /> Command Center
                            </Link>
                          )}
                          <button onClick={async () => { await signOut(); setUserMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5">
                            <LogOut className="w-3.5 h-3.5" /> Sign out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <button onClick={() => setAuthModal('signin')} className="text-[13px] text-white/60 hover:text-white font-medium transition">Sign In</button>
                    <button onClick={() => setAuthModal('signup')}
                      className="px-4 py-2 rounded-lg text-white text-[13px] font-semibold transition-all hover:-translate-y-px"
                      style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)', boxShadow: '0 0 28px rgba(0,194,255,0.28)' }}>
                      Launch Console
                    </button>
                  </>
                )}
              </div>

              <button onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open} className="lg:hidden text-white p-2">
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

            {open && (
              <div className="lg:hidden py-3 border-t border-white/5 space-y-1">
                {LINKS.map((l) => (
                  <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                    className={`block px-3 py-2 text-sm rounded-lg ${isActive(l.to) ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
                    {l.label}
                  </Link>
                ))}
                <div className="pt-2 mt-2 border-t border-white/5 space-y-1">
                  {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-white/70 hover:text-white rounded-lg">Command Center</Link>}
                  {user ? (
                    <button onClick={async () => { await signOut(); setOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white rounded-lg">Sign out</button>
                  ) : (
                    <button onClick={() => { setAuthModal('signup'); setOpen(false); }}
                      className="w-full px-3 py-2 rounded-lg text-white text-sm font-semibold text-center" style={{ background: 'linear-gradient(135deg, #00C2FF, #7C4DFF)' }}>
                      Launch Console
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {authModal && <AuthModal initialMode={authModal} onClose={() => setAuthModal(null)} />}
    </>
  );
};

export default PlatformNav;
