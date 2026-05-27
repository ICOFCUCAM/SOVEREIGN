import React, { useState } from 'react';
import { X, Send, MessageCircle, DollarSign, Mail, User, Building } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Domain } from '@/lib/types';
import { toast } from 'sonner';
import { useEscape } from '@/hooks/useEscape';

interface Props {
  domain: Domain;
  intent: 'inquiry' | 'offer' | 'buy_now';
  onClose: () => void;
}

const InquiryModal: React.FC<Props> = ({ domain, intent, onClose }) => {
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', message: '', offer: domain.price_usd });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  useEscape(onClose);

  const titles = {
    inquiry: 'Inquire about this domain',
    offer: 'Submit a private offer',
    buy_now: 'Acquire this domain now',
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) return;
    setLoading(true);
    try {
      // Save lead
      await supabase.from('leads').insert({
        domain_id: domain.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        message: form.message,
        offer_amount: intent === 'offer' ? form.offer : intent === 'buy_now' ? domain.price_usd : null,
        intent,
        source: 'landing',
        buyer_score: 50 + (form.company ? 15 : 0) + (form.phone ? 10 : 0) + (form.message?.length > 50 ? 15 : 0),
      });

      // Bump inquiry count (safe RPC — table writes are admin-only)
      await supabase.rpc('increment_domain_inquiry', { p_id: domain.id });

      // Analytics event
      await supabase.from('analytics_events').insert({
        domain_id: domain.id,
        event_type: intent,
        path: `/d/${domain.domain_name}`,
      });

      // CRM subscribe (best-effort: must never fail the lead capture itself)
      try {
        await fetch('https://famous.ai/api/crm/6a122e7fba2cb2e96599de96/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            name: form.name || undefined,
            source: intent === 'buy_now' ? 'checkout' : intent === 'offer' ? 'offer' : 'contact-form',
            tags: [intent, domain.domain_name, domain.category || 'general', 'sovereign-platform']
          })
        });
      } catch {
        /* non-blocking */
      }

      setSuccess(true);
      toast.success(intent === 'buy_now' ? 'Acquisition request submitted' : 'Inquiry sent to AI Broker');
    } catch {
      toast.error('Submission failed. Try again.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="relative glass-strong rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-stage-in">
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0A0E27]/95 backdrop-blur">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">AI Broker · Negotiation Channel</div>
            <div className="text-white font-semibold text-lg">{titles[intent]}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4">
              <Send className="w-7 h-7 text-emerald-300" />
            </div>
            <div className="text-white text-xl font-bold mb-2">Channel established</div>
            <p className="text-white/60 text-sm mb-5 max-w-sm mx-auto">
              The AI Broker will analyze your intent profile and respond with strategic next steps within minutes. Expect contact via {form.email}.
            </p>
            <div className="glass rounded-lg p-3 text-left max-w-sm mx-auto">
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 mb-1">Session ID</div>
              <div className="text-white/70 text-xs font-mono">SOV-{Date.now().toString(36).toUpperCase()}</div>
            </div>
            <button onClick={onClose} className="mt-6 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/40 font-mono uppercase tracking-wider">Asset</span>
                <span className="text-[10px] text-cyan-400 font-mono">SCORE {domain.valuation_score}/100</span>
              </div>
              <div className="text-white font-bold text-xl">{domain.domain_name}</div>
              <div className="text-white/50 text-xs mt-0.5">{domain.tagline}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/50 font-medium mb-1.5 block">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/50 font-medium mb-1.5 block">Company</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input value={form.company} onChange={e => setForm({...form, company: e.target.value})}
                    className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 font-medium mb-1.5 block">Email <span className="text-red-400">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none" />
              </div>
            </div>

            {intent === 'offer' && (
              <div>
                <label className="text-xs text-white/50 font-medium mb-1.5 block">Offer (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400" />
                  <input type="number" value={form.offer} onChange={e => setForm({...form, offer: Number(e.target.value)})}
                    className="w-full pl-9 pr-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg text-sm text-white focus:border-amber-400/50 focus:outline-none" />
                </div>
                <div className="text-[11px] text-white/40 mt-1.5">Asking price: ${domain.price_usd.toLocaleString()} · The AI Broker will counter or accept based on market signal.</div>
              </div>
            )}

            <div>
              <label className="text-xs text-white/50 font-medium mb-1.5 block">Message · use case · intent</label>
              <textarea rows={3} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                placeholder="Tell the AI broker about your venture, timeline, and acquisition intent..."
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none resize-none" />
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? 'Routing to AI Broker...' : <><Send className="w-4 h-4" /> Send to AI Broker</>}
              </button>
              {domain.whatsapp_number && (
                <a href={`https://wa.me/${domain.whatsapp_number}?text=Interested in ${domain.domain_name}`} target="_blank" rel="noreferrer"
                  className="px-4 py-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </div>
            <div className="text-center text-[10px] text-white/30 font-mono">
              Encrypted · Anti-spam · Escrow-ready · Sovereign-grade routing
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default InquiryModal;
