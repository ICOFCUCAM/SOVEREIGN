import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useEscape } from '@/hooks/useEscape';
import HudCorners from '@/components/HudCorners';
import { X, Send, CheckCircle2, ShieldCheck } from 'lucide-react';

export type ContactPurpose =
  | 'institutional'
  | 'privacy'
  | 'security'
  | 'status'
  | 'press'
  | 'legal'
  | 'general';

interface Copy {
  kicker: string;
  title: string;
  helper: string;
  accent: string;
  slug: string;
}

const PURPOSE_COPY: Record<ContactPurpose, Copy> = {
  institutional: {
    kicker: 'Sovereign briefing',
    title:  'Institutional briefing',
    helper: 'Acquisition and deployment briefings for institutional buyers.',
    accent: '#00C2FF',
    slug:   'contact:institutional',
  },
  privacy: {
    kicker: 'Privacy desk',
    title:  'Privacy request',
    helper: 'Access, correction, deletion or export of personal data. Identify the account email on file in the message.',
    accent: '#7C4DFF',
    slug:   'contact:privacy',
  },
  security: {
    kicker: 'Security disclosure',
    title:  'Security disclosure',
    helper: 'Vulnerability reports and disclosure correspondence. Coordinated disclosure handled under the Sovereign disclosure policy.',
    accent: '#FF7043',
    slug:   'contact:security',
  },
  status: {
    kicker: 'Status & incidents',
    title:  'Incident & status updates',
    helper: 'Subscribe to incident updates or report an operational issue.',
    accent: '#34D399',
    slug:   'contact:status',
  },
  press: {
    kicker: 'Press',
    title:  'Press inquiry',
    helper: 'Editorial, interview and licensing inquiries for the Sovereign platform.',
    accent: '#F59E0B',
    slug:   'contact:press',
  },
  legal: {
    kicker: 'Legal',
    title:  'Legal inquiry',
    helper: 'Questions about the Terms of Service or contractual posture.',
    accent: '#94A3B8',
    slug:   'contact:legal',
  },
  general: {
    kicker: 'Contact',
    title:  'Contact Sovereign',
    helper: 'General correspondence. We route by topic on receipt.',
    accent: '#00C2FF',
    slug:   'contact:general',
  },
};

interface Props {
  purpose: ContactPurpose;
  subjectHint?: string;
  onClose: () => void;
}

const ContactModal: React.FC<Props> = ({ purpose, subjectHint, onClose }) => {
  const copy = PURPOSE_COPY[purpose];
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [message, setMessage] = useState(subjectHint ?? '');
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
        system_slug: copy.slug,
        system_name: copy.title,
        tier: null,
        name: name.trim() || null,
        email: email.trim(),
        organization: org.trim() || null,
        message: message.trim() || null,
      });
      if (err) throw err;
      setSent(true);
    } catch {
      setError('Could not submit. Please try again.');
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={copy.title}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong rounded-2xl border border-white/10 overflow-hidden animate-stage-in">
        <HudCorners color={copy.accent} className="opacity-40" />
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-white/40 hover:text-white transition z-10"><X className="w-5 h-5" /></button>
        <div className="relative p-7">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: `${copy.accent}1f`, border: `1px solid ${copy.accent}44` }}>
                <CheckCircle2 className="w-7 h-7" style={{ color: copy.accent }} />
              </div>
              <div className="text-xl font-bold text-white mb-2">Message received</div>
              <p className="text-white/55 text-sm leading-relaxed">The {copy.title.toLowerCase()} desk will route this to the responsible team.</p>
              <button onClick={onClose} className="mt-6 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition">Close</button>
            </div>
          ) : (
            <>
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] mb-2" style={{ color: copy.accent }}>{copy.kicker}</div>
              <div className="font-display text-2xl font-bold text-white mb-1">{copy.title}</div>
              <p className="text-white/45 text-sm mb-6">{copy.helper}</p>
              <form onSubmit={submit} className="space-y-3">
                <input autoFocus autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
                <input type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
                <input value={org} autoComplete="organization" onChange={(e) => setOrg(e.target.value)} placeholder="Institution / organization (optional)" aria-label="Organization"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" aria-label="Message" rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none resize-none" />
                {error && <div className="text-xs text-red-300">{error}</div>}
                <button type="submit" disabled={sending}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold disabled:opacity-50 transition-all"
                  style={{ background: `linear-gradient(135deg, ${copy.accent}, #7C4DFF)` }}>
                  <Send className="w-4 h-4" /> {sending ? 'Submitting…' : 'Send'}
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

export default ContactModal;
