import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useEscape } from '@/hooks/useEscape';
import HudCorners from '@/components/HudCorners';
import { X, Send, CheckCircle2, ShieldCheck } from 'lucide-react';

interface Props { systemName: string; slug: string; tier?: string; accent?: string; onClose: () => void }

const BriefingModal: React.FC<Props> = ({ systemName, slug, tier, accent = '#00C2FF', onClose }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  useEscape(onClose);

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid contact email.'); return; }
    setError(''); setSending(true);
    try {
      const { error: err } = await supabase.from('inquiries').insert({
        system_slug: slug, system_name: systemName, tier: tier || null,
        name: name.trim() || null, email: email.trim(), organization: org.trim() || null, message: message.trim() || null,
      });
      if (err) throw err;
      setSent(true);
    } catch {
      setError('Could not submit. Please try again.');
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong rounded-2xl border border-white/10 overflow-hidden">
        <HudCorners color={accent} className="opacity-40" />
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-white/40 hover:text-white transition z-10"><X className="w-5 h-5" /></button>
        <div className="relative p-7">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: `${accent}1f`, border: `1px solid ${accent}44` }}>
                <CheckCircle2 className="w-7 h-7" style={{ color: accent }} />
              </div>
              <div className="text-xl font-bold text-white mb-2">Briefing requested</div>
              <p className="text-white/55 text-sm leading-relaxed">Our sovereign deployment team will reach out about <span className="text-white">{systemName}{tier ? ` · ${tier}` : ''}</span>.</p>
              <button onClick={onClose} className="mt-6 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition">Close</button>
            </div>
          ) : (
            <>
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] mb-2" style={{ color: accent }}>Request deployment briefing</div>
              <div className="font-display text-2xl font-bold text-white mb-1">{systemName}{tier ? ` · ${tier}` : ''}</div>
              <p className="text-white/45 text-sm mb-6">Sovereign acquisition &amp; deployment — institutional engagements only.</p>
              <form onSubmit={submit} className="space-y-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Official email" aria-label="Email"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
                <input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Institution / government / organization" aria-label="Organization"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Deployment context (optional)" aria-label="Message" rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none resize-none" />
                {error && <div className="text-xs text-red-300">{error}</div>}
                <button type="submit" disabled={sending}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold disabled:opacity-50 transition-all"
                  style={{ background: `linear-gradient(135deg, ${accent}, #7C4DFF)` }}>
                  <Send className="w-4 h-4" /> {sending ? 'Submitting…' : 'Request briefing'}
                </button>
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-white/30 pt-1">
                  <ShieldCheck className="w-3 h-3" /> Confidential · sovereign-grade handling
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BriefingModal;
