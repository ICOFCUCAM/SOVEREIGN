import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<Props> = ({ onClose, initialMode = 'signin' }) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password, fullName);
      if (res.error) {
        setError(res.error);
      } else {
        toast.success(mode === 'signin' ? 'Authenticated' : 'Account provisioned');
        // CRM subscribe on signup
        if (mode === 'signup') {
          fetch('https://famous.ai/api/crm/6a122e7fba2cb2e96599de96/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name: fullName || undefined, source: 'signup', tags: ['platform-user', 'sovereign-os'] })
          }).catch(() => {});
        }
        onClose();
      }
    } catch (e: any) {
      setError(e.message || 'Authentication failed');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="relative glass-strong rounded-2xl w-full max-w-md overflow-hidden animate-stage-in">
        <span className="absolute inset-x-0 top-0 h-px z-10" style={{ background: 'linear-gradient(90deg, transparent, #00D9FF, #7C4DFF, transparent)' }} />
        {/* Header with brand */}
        <div className="relative px-6 py-5 border-b border-white/10 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-600/10">
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Sovereign Identity</div>
              <div className="text-white font-bold text-lg">
                {mode === 'signin' ? 'Authenticate to console' : 'Create operator account'}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-xs text-white/50 font-medium mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ada Mensah"
                  className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
              </div>
            </div>
          )}
          <div>
            <label className="text-xs text-white/50 font-medium mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="operator@org.com"
                className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
            </div>
            {mode === 'signup' && (
              <div className="text-[11px] text-white/40 mt-1.5">Min 6 characters. The first account becomes <span className="text-cyan-400">admin</span>.</div>
            )}
          </div>

          {error && (
            <div className="glass rounded-lg p-3 flex items-start gap-2 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <span className="text-xs text-red-300">{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2 ease-cinematic transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-12px_rgba(0,194,255,0.5)]">
            {loading ? (
              <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Routing...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> {mode === 'signin' ? 'Sign In' : 'Create Account'}</>
            )}
          </button>

          <div className="flex flex-wrap items-center justify-between gap-2 text-center text-xs text-white/50">
            <span>
              {mode === 'signin' ? "Don't have an account?" : 'Already operational?'}
              <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
                className="ml-1.5 text-cyan-400 hover:text-cyan-300 font-semibold">
                {mode === 'signin' ? 'Create one' : 'Sign in'}
              </button>
            </span>
            {mode === 'signin' && (
              <button
                type="button"
                onClick={async () => {
                  if (!email) { setError('Enter your email above first.'); return; }
                  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined });
                  if (error) setError(error.message);
                  else toast.success('Reset link sent — check your inbox');
                }}
                className="text-white/40 hover:text-cyan-300"
              >
                Forgot password?
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-white/5 text-center text-[10px] text-white/30 font-mono">
            Encrypted · RBAC · Audit-logged · Sovereign-grade routing
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
