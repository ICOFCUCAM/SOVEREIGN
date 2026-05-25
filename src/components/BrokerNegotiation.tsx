import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Domain, NegotiationMessage, BrokerResponse } from '@/lib/types';
import { trackEvent } from '@/lib/analytics';
import { useEscape } from '@/hooks/useEscape';
import { X, Send, ShieldCheck, Bot, User, DollarSign, Gauge, Activity, Sparkles, CheckCircle2, ArrowUpRight } from 'lucide-react';

interface Props {
  domain: Domain;
  intent: 'inquiry' | 'offer';
  onClose: () => void;
}

const STAGE_META: Record<string, { label: string; color: string }> = {
  opening: { label: 'Opening', color: '#00D9FF' },
  probing: { label: 'Qualifying', color: '#00D9FF' },
  countering: { label: 'Negotiating', color: '#F59E0B' },
  closing: { label: 'Closing', color: '#10B981' },
  accepted: { label: 'Aligned', color: '#10B981' },
  escalated: { label: 'Escalated', color: '#7C3AED' },
};

const fmt = (n: number) => '$' + Math.round(n).toLocaleString();

const BrokerNegotiation: React.FC<Props> = ({ domain, intent, onClose }) => {
  const [step, setStep] = useState<'identify' | 'chat'>('identify');
  const [buyer, setBuyer] = useState({ name: '', email: '' });
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [input, setInput] = useState('');
  const [offer, setOffer] = useState('');
  const [loading, setLoading] = useState(false);
  const [rounds, setRounds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [state, setState] = useState({ stage: 'opening', status: 'active' as BrokerResponse['status'], confidence: 45, buyer_score: 50, counter: domain.price_usd });
  const scrollRef = useRef<HTMLDivElement>(null);
  useEscape(onClose);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, loading]);

  const terminal = state.status === 'accepted' || state.status === 'escalated';

  const callBroker = async (turnOffer: number, message: string, turnRounds: number): Promise<BrokerResponse | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-broker', {
        body: {
          domain: domain.domain_name,
          asking_price: domain.price_usd,
          intent,
          offer: turnOffer,
          rounds: turnRounds,
          message,
          industry: domain.category || 'technology',
          score: domain.valuation_score,
          email: buyer.email,
        },
      });
      if (error) throw error;
      return data as BrokerResponse;
    } catch {
      return null;
    }
  };

  const persistSession = async (id: string, msgs: NegotiationMessage[], r: BrokerResponse, lastOffer: number) => {
    await supabase.from('negotiation_sessions').update({
      messages: msgs,
      rounds,
      current_offer: lastOffer || null,
      current_counter: r.counter_offer,
      stage: r.stage,
      status: r.status,
      buyer_score: r.buyer_score,
      urgency_score: r.urgency_score,
      confidence: r.confidence,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
  };

  const begin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyer.email) return;
    setLoading(true);

    // Capture the lead immediately (qualification), then open the session.
    const { data: lead } = await supabase.from('leads').insert({
      domain_id: domain.id,
      name: buyer.name || null,
      email: buyer.email,
      intent,
      source: 'broker',
      buyer_score: 50,
      message: 'AI broker negotiation opened',
    }).select('id').single();
    if (lead) setLeadId(lead.id);

    const { data: session } = await supabase.from('negotiation_sessions').insert({
      domain_id: domain.id,
      domain_name: domain.domain_name,
      buyer_name: buyer.name || null,
      buyer_email: buyer.email,
      intent,
      asking_price: domain.price_usd,
      stage: 'opening',
      rounds: 0,
      messages: [],
    }).select('id').single();
    const sid = session?.id ?? null;
    setSessionId(sid);

    trackEvent({ domainId: domain.id, eventType: intent, metadata: { surface: 'broker', stage: 'open' } });

    const opening = await callBroker(0, '', 1);
    const openText = opening?.broker_message
      ?? `${domain.domain_name} is a premium asset positioned at ${fmt(domain.price_usd)}. I represent the principal and I'm authorized to negotiate — tell me about your venture and the number you have in mind.`;
    const msgs: NegotiationMessage[] = [{ role: 'broker', text: openText, ts: new Date().toISOString() }];
    setMessages(msgs);
    setRounds(1);
    if (opening) {
      setState({ stage: opening.stage, status: opening.status, confidence: opening.confidence, buyer_score: opening.buyer_score, counter: opening.counter_offer });
      if (sid) await persistSession(sid, msgs, opening, 0);
    }
    setStep('chat');
    setLoading(false);
  };

  const send = async () => {
    if (loading || terminal) return;
    const turnOffer = Number(offer) || 0;
    const text = input.trim();
    if (!text && !turnOffer) return;

    const buyerMsg: NegotiationMessage = {
      role: 'buyer',
      text: text || `I'd like to offer ${fmt(turnOffer)}.`,
      offer: turnOffer || null,
      ts: new Date().toISOString(),
    };
    const withBuyer = [...messages, buyerMsg];
    setMessages(withBuyer);
    setInput('');
    setOffer('');
    setLoading(true);
    const nextRounds = rounds + 1;
    setRounds(nextRounds);

    const r = await callBroker(turnOffer, buyerMsg.text, nextRounds);
    const replyText = r?.broker_message ?? 'Let me bring this to the principal and revert shortly.';
    const withBroker = [...withBuyer, { role: 'broker', text: replyText, ts: new Date().toISOString() } as NegotiationMessage];
    setMessages(withBroker);

    if (r) {
      setState({ stage: r.stage, status: r.status, confidence: r.confidence, buyer_score: r.buyer_score, counter: r.counter_offer });
      if (sessionId) await persistSession(sessionId, withBroker, r, turnOffer);

      if ((r.accepted || r.escalate) && leadId) {
        await supabase.from('leads').update({
          status: r.accepted ? 'negotiating' : 'qualified',
          offer_amount: turnOffer || r.counter_offer,
          buyer_score: r.buyer_score,
          message: `AI broker · ${r.stage} · counter ${fmt(r.counter_offer)}`,
        }).eq('id', leadId);
        await supabase.from('domains').update({ inquiry_count: (domain.inquiry_count || 0) + 1 }).eq('id', domain.id);
        trackEvent({ domainId: domain.id, eventType: r.accepted ? 'buy_now' : 'offer', metadata: { surface: 'broker', stage: r.stage, counter: r.counter_offer } });
      }
    }
    setLoading(false);
  };

  const stageMeta = STAGE_META[state.stage] || STAGE_META.countering;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="glass-strong rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0A0E27]/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-600/30 border border-cyan-500/40 flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm flex items-center gap-2">
                AI Broker
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider" style={{ background: `${stageMeta.color}20`, color: stageMeta.color }}>{stageMeta.label}</span>
              </div>
              <div className="text-[10px] font-mono text-white/40">Negotiation channel · {domain.domain_name}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60"><X className="w-4 h-4" /></button>
        </div>

        {step === 'identify' ? (
          <form onSubmit={begin} className="p-6 space-y-4">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/40 font-mono uppercase tracking-wider">Asset</span>
                <span className="text-[10px] text-cyan-400 font-mono">SCORE {domain.valuation_score}/100</span>
              </div>
              <div className="text-white font-bold text-xl">{domain.domain_name}</div>
              <div className="text-white/50 text-xs mt-0.5">Asking {fmt(domain.price_usd)} · {domain.category}</div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              You'll negotiate directly with the principal's AI broker — authorized to qualify intent, counter offers, and progress a deal in real time. Identify yourself to open the channel.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/50 font-medium mb-1.5 block">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/50 font-medium mb-1.5 block">Email <span className="text-red-400">*</span></label>
                <input type="email" required value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Opening channel…</> : <><ShieldCheck className="w-4 h-4" /> Open negotiation</>}
            </button>
          </form>
        ) : (
          <>
            {/* Signal bar */}
            <div className="px-5 py-2.5 border-b border-white/5 flex items-center gap-4 text-[10px] font-mono">
              <div className="flex items-center gap-1.5 text-white/50"><Gauge className="w-3 h-3 text-cyan-400" /> Close confidence <span className="text-cyan-300">{state.confidence}%</span></div>
              <div className="flex items-center gap-1.5 text-white/50"><Activity className="w-3 h-3 text-amber-400" /> Buyer <span className="text-amber-300">{state.buyer_score}/100</span></div>
              <div className="ml-auto flex items-center gap-1.5 text-white/50">Round <span className="text-white/80">{rounds}</span></div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[260px]">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'buyer' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${m.role === 'broker' ? 'bg-gradient-to-br from-cyan-500/30 to-purple-600/30 border border-cyan-500/40' : 'bg-white/10'}`}>
                    {m.role === 'broker' ? <Bot className="w-3.5 h-3.5 text-cyan-300" /> : <User className="w-3.5 h-3.5 text-white/70" />}
                  </div>
                  <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === 'broker' ? 'glass text-white/90' : 'bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/20 text-white'}`}>
                    {m.offer ? <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300 mb-1">Offer · {fmt(m.offer)}</div> : null}
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/30 to-purple-600/30 border border-cyan-500/40 flex items-center justify-center"><Bot className="w-3.5 h-3.5 text-cyan-300" /></div>
                  <div className="glass rounded-2xl px-4 py-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Terminal banner / composer */}
            {terminal ? (
              <div className="p-4 border-t border-white/10">
                <div className={`rounded-xl p-4 flex items-start gap-3 ${state.status === 'accepted' ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-purple-500/10 border border-purple-500/30'}`}>
                  {state.status === 'accepted' ? <CheckCircle2 className="w-5 h-5 text-emerald-300 mt-0.5 shrink-0" /> : <ArrowUpRight className="w-5 h-5 text-purple-300 mt-0.5 shrink-0" />}
                  <div>
                    <div className="text-white font-semibold text-sm mb-0.5">{state.status === 'accepted' ? 'Deal aligned' : 'Escalated to principal'}</div>
                    <div className="text-white/60 text-xs leading-relaxed">
                      {state.status === 'accepted'
                        ? `Terms agreed near ${fmt(state.counter)}. A secure, escrow-ready transfer channel will be opened — confirmation at ${buyer.email}.`
                        : `The principal owner has been notified and will finalize terms with you directly at ${buyer.email}.`}
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="w-full mt-3 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium">Close channel</button>
              </div>
            ) : (
              <div className="p-3 border-t border-white/10 space-y-2">
                <div className="flex gap-2">
                  <div className="relative w-36">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400" />
                    <input type="number" value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="Your offer"
                      className="w-full pl-8 pr-2 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-amber-400/50 focus:outline-none" />
                  </div>
                  <button onClick={send} disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Send to broker
                  </button>
                </div>
                <textarea rows={2} value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
                  placeholder="Make your case — venture, timeline, rationale… (⌘/Ctrl+Enter to send)"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none resize-none" />
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/30 font-mono">
                  <Sparkles className="w-3 h-3" /> Autonomous broker · escrow-ready · positions logged
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BrokerNegotiation;
