import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, Menu, X, Shield, Sparkles, BarChart3, LayoutGrid, LogIn, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';

const PlatformNav: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [authModal, setAuthModal] = useState<null | 'signin' | 'signup'>(null);
  const [userMenu, setUserMenu] = useState(false);
  const location = useLocation();
  const { user, role, isAdmin, signOut } = useAuth();
  const isActive = (p: string) => location.pathname === p;

  const links = [
    { to: '/', label: 'Platform', icon: Globe },
    { to: '/marketplace', label: 'Marketplace', icon: LayoutGrid },
    { to: '/valuation', label: 'AI Valuation', icon: Sparkles },
    { to: '/admin', label: 'Command Center', icon: BarChart3 },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#05071A]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-400 blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
                <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-white font-bold text-sm tracking-tight">SOVEREIGN</span>
                <span className="text-cyan-400/70 text-[10px] tracking-[0.2em] font-mono">DOMAIN.OS</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {links.map(l => {
                const Icon = l.icon;
                return (
                  <Link key={l.to} to={l.to}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      isActive(l.to) ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}>
                    <Icon className="w-3.5 h-3.5" />
                    {l.label}
                  </Link>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-300 font-mono uppercase tracking-wider">Live</span>
              </div>

              {user ? (
                <div className="relative">
                  <button onClick={() => setUserMenu(!userMenu)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg glass hover:glass-strong transition">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                      {(role?.full_name || user.email || 'U').slice(0,1).toUpperCase()}
                    </div>
                    <div className="text-left leading-none">
                      <div className="text-xs text-white font-medium max-w-[120px] truncate">{role?.full_name || user.email?.split('@')[0]}</div>
                      <div className={`text-[9px] font-mono uppercase tracking-wider ${isAdmin ? 'text-amber-300' : 'text-white/40'}`}>
                        {role?.role || 'viewer'}
                      </div>
                    </div>
                    <ChevronDown className="w-3 h-3 text-white/40" />
                  </button>

                  {userMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 glass-strong rounded-xl py-2 z-50">
                        <div className="px-3 py-2 border-b border-white/5">
                          <div className="text-xs text-white font-medium truncate">{user.email}</div>
                          <div className={`text-[10px] font-mono uppercase tracking-wider mt-0.5 ${isAdmin ? 'text-amber-300' : 'text-white/40'}`}>
                            {role?.role || 'viewer'} role
                          </div>
                        </div>
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setUserMenu(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5">
                            <BarChart3 className="w-3.5 h-3.5" /> Command Center
                          </Link>
                        )}
                        <button onClick={async () => { await signOut(); setUserMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5">
                          <LogOut className="w-3.5 h-3.5" /> Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <button onClick={() => setAuthModal('signin')}
                    className="px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white font-medium flex items-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5" /> Sign In
                  </button>
                  <button onClick={() => setAuthModal('signup')}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
                    Launch Console
                  </button>
                </>
              )}
            </div>

            <button onClick={() => setOpen(!open)} className="md:hidden text-white p-2">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {open && (
            <div className="md:hidden py-3 border-t border-white/5 space-y-1">
              {links.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg">
                  {l.label}
                </Link>
              ))}
              <div className="pt-2 mt-2 border-t border-white/5">
                {user ? (
                  <button onClick={async () => { await signOut(); setOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white rounded-lg">Sign out</button>
                ) : (
                  <button onClick={() => { setAuthModal('signin'); setOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white rounded-lg">Sign in</button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {authModal && <AuthModal initialMode={authModal} onClose={() => setAuthModal(null)} />}
    </>
  );
};

export default PlatformNav;
