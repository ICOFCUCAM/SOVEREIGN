import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Mail, Send, ShieldAlert, Clock, LogOut, AlertOctagon } from 'lucide-react';
import { toast } from 'sonner';

// Shown to authenticated users who do not yet have status='approved'.
// Renders three flavors based on UserStatus:
//   pending   — "Awaiting approval" + inline contact form
//   rejected  — "Account not approved" + reason + contact form
//   suspended — "Account suspended" + contact form
//
// The contact form writes to public.contact_submissions (RLS permits
// any authenticated insert; admins read via the admin console).

const PendingApprovalView: React.FC = () => {
  const { user, role, signOut, isPending, isRejected, isSuspended, refresh } = useAuth();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent,  setSent]  = useState(false);

  const heading = isRejected ? 'Account not approved'
                : isSuspended ? 'Account suspended'
                : 'Awaiting approval';

  const headingColor = isRejected || isSuspended ? 'text-rose-300' : 'text-cyan-300';
  const Icon = isRejected ? AlertOctagon : isSuspended ? ShieldAlert : Clock;

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!message.trim()) { toast.error('Write a message first.'); return; }
    setBusy(true);
    const { error } = await supabase.from('contact_submissions').insert({
      user_id:  user?.id ?? null,
      email:    user?.email ?? role?.email ?? '',
      full_name: role?.full_name ?? null,
      subject:  subject.trim() || null,
      message:  message.trim(),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    setSubject(''); setMessage('');
    toast.success('Message sent — an admin will review.');
  };

  return (
    <div className="relative min-h-screen text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(0,217,255,0.08),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(124,77,255,0.06),transparent_55%)] bg-[#05071A]" />

      <div className="max-w-2xl mx-auto px-6 py-16 sm:py-24">
        {/* Status banner */}
        <div className={`flex items-center gap-3 mb-3 text-[10px] font-mono uppercase tracking-[0.28em] ${headingColor}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Sovereign identity gate
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-cinematic leading-tight mb-4">
          <Icon className={`inline w-7 h-7 mr-2 -mt-1 ${headingColor}`} />
          {heading}.
        </h1>

        {isPending && (
          <p className="text-white/65 leading-relaxed max-w-prose">
            Your account has been registered as <span className="text-white">{user?.email}</span>.
            Sovereign access is gated by admin approval. You'll be granted console access once an admin reviews and approves the request.
            In the meantime, you can send a message below — it lands directly in the admin inbox.
          </p>
        )}

        {isRejected && (
          <div>
            <p className="text-white/65 leading-relaxed max-w-prose">
              The administrators have not approved this account. If you believe this is in error, send a message below and we'll review.
            </p>
            {role?.rejected_reason && (
              <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/5 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-300 mb-1.5">Reason on file</div>
                <div className="text-sm text-white/85">{role.rejected_reason}</div>
              </div>
            )}
          </div>
        )}

        {isSuspended && (
          <p className="text-white/65 leading-relaxed max-w-prose">
            Console access is suspended for this account. Contact an administrator below to discuss reinstatement.
          </p>
        )}

        <div className="mt-4 flex items-center gap-3 text-[12px] text-white/45">
          <button
            onClick={async () => { await refresh(); toast.info('Status refreshed'); }}
            className="rounded-md border border-white/15 hover:bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-wide"
          >
            Refresh status
          </button>
          <button
            onClick={async () => { await signOut(); }}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 hover:bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-wide text-white/65"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>

        {/* Contact form */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.015] p-6 sm:p-8">
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyan-300/70 mb-2">
            <Mail className="inline w-3 h-3 mr-1.5 -mt-0.5" /> Contact administrator
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-1">Send a message</h2>
          <p className="text-sm text-white/50 mb-6">
            Goes directly to the admin console. Include context that would help approve your account
            (organization, role, what you intend to deploy).
          </p>

          {sent && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 mb-5 text-sm text-emerald-200">
              Message delivered. You can send another below if needed.
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs text-white/50 font-medium mb-1.5 block">From</label>
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/85">
                {role?.full_name ? `${role.full_name} · ` : ''}{user?.email ?? role?.email}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 font-medium mb-1.5 block">Subject (optional)</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Request access for sovereign deployment review"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 font-medium mb-1.5 block">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                required
                placeholder="Tell us about your organization and what you'd like to deploy on Sovereign."
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold disabled:opacity-50 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-12px_rgba(0,194,255,0.5)]"
            >
              {busy
                ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Sending…</>
                : <><Send className="w-4 h-4" /> Send message</>}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[10px] font-mono text-white/30">
          Encrypted · Audit-logged · Sovereign-grade routing
        </p>
      </div>
    </div>
  );
};

export default PendingApprovalView;
