import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useEscape } from '@/hooks/useEscape';
import HudCorners from '@/components/HudCorners';
import { X, ArrowRight, ArrowLeft, Check, ShieldCheck, Landmark } from 'lucide-react';

interface Props { accent?: string; onClose: () => void }

const ROLES = ['Head of State / Government', 'Minister / Cabinet', 'Agency / Authority', 'Enterprise', 'Sovereign investor', 'Other'];
const DOMAINS = ['Governance', 'Finance', 'Mobility', 'Intelligence', 'Education', 'Commerce', 'Infrastructure'];
const SCALES: Array<{ tier: string; price: string; note: string }> = [
  { tier: 'Core', price: '$8M', note: 'Foundational sovereign stack' },
  { tier: 'Professional', price: '$35M', note: 'Multi-ministry platform' },
  { tier: 'Elite', price: '$120M', note: 'National-scale operations' },
  { tier: 'Strategic', price: '$500M', note: 'Defense-grade infrastructure' },
  { tier: 'Prime', price: '$1B+', note: 'Civilization-scale deployment' },
];
const STEPS = ['Principal', 'Mandate', 'Convene'];

const SovereignBriefing: React.FC<Props> = ({ accent = '#00C2FF', onClose }) => {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState('');
  const [nation, setNation] = useState('');
  const [domains, setDomains] = useState<string[]>([]);
  const [scale, setScale] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  useEscape(onClose);
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  const toggleDomain = (d: string) => setDomains((xs) => (xs.includes(d) ? xs.filter((x) => x !== d) : [...xs, d]));
  const canNext = step === 0 ? !!role : step === 1 ? domains.length > 0 && !!scale : true;

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid contact email.'); return; }
    setError(''); setSending(true);
    const summary = `Principal: ${role}${nation ? ` · ${nation}` : ''}\nMandate: ${domains.join(', ')}\nDeployment scale: CIVICOS ${scale}`;
    try {
      const { error: err } = await supabase.from('inquiries').insert({
        system_slug: 'sovereign-briefing', system_name: 'Sovereign Executive Briefing', tier: scale || null,
        name: name.trim() || null, email: email.trim(), organization: nation.trim() || null, message: summary,
      });
      if (err) throw err;
      setSent(true);
    } catch { setError('Could not submit. Please try again.'); }
    setSending(false);
  };

  const rec = SCALES.find((s) => s.tier === scale);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Sovereign executive briefing">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-white/12 bg-[#070b1c] overflow-hidden">
        <span className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
        <HudCorners color={accent} className="opacity-30" />
        <div className="relative p-7 sm:p-9">
          <div className="flex items-center justify-between mb-6">
            <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.26em] text-cyan-300/70"><ShieldCheck className="w-3.5 h-3.5" /> Sovereign briefing</span>
            <button onClick={onClose} aria-label="Close" className="text-white/40 hover:text-white transition"><X className="w-5 h-5" /></button>
          </div>

          {sent ? (
            <div className="text-center py-6">
              <span className="inline-flex w-14 h-14 rounded-full items-center justify-center mb-5" style={{ background: `${accent}1a`, border: `1px solid ${accent}44` }}><Check className="w-7 h-7" style={{ color: accent }} /></span>
              <h3 className="font-display text-2xl font-bold text-white tracking-tight mb-2">Briefing requested.</h3>
              <p className="text-white/55 max-w-sm mx-auto leading-relaxed mb-6">A sovereign-systems specialist will convene a private briefing. Your routed package:</p>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 text-left max-w-sm mx-auto">
                <div className="flex items-center gap-2 mb-3"><Landmark className="w-4 h-4" style={{ color: accent }} /><span className="font-display text-lg font-bold text-white">CIVICOS {scale}</span><span className="ml-auto text-white tabular-nums font-bold">{rec?.price}</span></div>
                <div className="text-[11px] text-white/45 leading-relaxed">{domains.join(' · ')}</div>
              </div>
              <button onClick={onClose} className="mt-7 px-6 py-3 rounded-xl text-white text-sm font-semibold" style={{ background: `linear-gradient(135deg, ${accent}, #7C4DFF)` }}>Close</button>
            </div>
          ) : (
            <>
              {/* stepper */}
              <div className="flex items-center gap-2 mb-7">
                {STEPS.map((s, i) => (
                  <React.Fragment key={s}>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-colors" style={{ background: i <= step ? accent : 'rgba(255,255,255,0.06)', color: i <= step ? '#05071A' : 'rgba(255,255,255,0.4)' }}>{i < step ? <Check className="w-3 h-3" /> : i + 1}</span>
                      <span className={`text-[10px] font-mono uppercase tracking-[0.16em] ${i === step ? 'text-white' : 'text-white/35'}`}>{s}</span>
                    </div>
                    {i < STEPS.length - 1 && <span className="flex-1 h-px bg-white/10" />}
                  </React.Fragment>
                ))}
              </div>

              {step === 0 && (
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/45 mb-3">Principal authority</div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {ROLES.map((r) => (
                      <button key={r} onClick={() => setRole(r)} className={`px-3.5 py-2 rounded-lg text-xs font-medium transition border ${role === r ? 'text-white' : 'text-white/55 border-white/10 hover:border-white/25'}`} style={role === r ? { background: `${accent}1f`, borderColor: `${accent}66` } : {}}>{r}</button>
                    ))}
                  </div>
                  <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-white/45 mb-2">Nation / Organization</label>
                  <input value={nation} onChange={(e) => setNation(e.target.value)} placeholder="e.g. Republic of —, Ministry of —" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
                </div>
              )}

              {step === 1 && (
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/45 mb-3">Mandate · domains of interest</div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {DOMAINS.map((d) => (
                      <button key={d} onClick={() => toggleDomain(d)} className={`px-3.5 py-2 rounded-lg text-xs font-medium transition border ${domains.includes(d) ? 'text-white' : 'text-white/55 border-white/10 hover:border-white/25'}`} style={domains.includes(d) ? { background: `${accent}1f`, borderColor: `${accent}66` } : {}}>{d}</button>
                    ))}
                  </div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/45 mb-3">Deployment scale</div>
                  <div className="space-y-2">
                    {SCALES.map((s) => (
                      <button key={s.tier} onClick={() => setScale(s.tier)} className={`w-full flex items-center justify-between gap-4 px-4 py-3 rounded-xl border transition text-left ${scale === s.tier ? 'text-white' : 'text-white/60 border-white/10 hover:border-white/25'}`} style={scale === s.tier ? { background: `${accent}14`, borderColor: `${accent}66` } : {}}>
                        <span><span className="font-display font-bold text-white">CIVICOS {s.tier}</span> <span className="text-white/40 text-xs ml-1">· {s.note}</span></span>
                        <span className="font-bold tabular-nums text-white">{s.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/45 mb-3">Convene · secure contact</div>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none mb-3" />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Secure contact email" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
                  <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.02] p-4 text-[11px] font-mono text-white/45 leading-relaxed">
                    <div className="text-white/30 uppercase tracking-[0.18em] mb-1.5">Briefing manifest</div>
                    {role || '—'}{nation ? ` · ${nation}` : ''}<br />
                    {domains.length ? domains.join(' · ') : '—'}<br />
                    <span className="text-white/70">CIVICOS {scale || '—'}{rec ? ` · ${rec.price}` : ''}</span>
                  </div>
                </div>
              )}

              {error && <div className="mt-4 text-xs text-rose-300">{error}</div>}

              <div className="flex items-center justify-between gap-3 mt-7">
                {step > 0 ? (
                  <button onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/60 hover:text-white text-sm font-medium transition"><ArrowLeft className="w-4 h-4" /> Back</button>
                ) : <span />}
                {step < 2 ? (
                  <button onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext} className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all ${canNext ? 'hover:-translate-y-px' : 'opacity-40 cursor-not-allowed'}`} style={{ background: `linear-gradient(135deg, ${accent}, #7C4DFF)` }}>Continue <ArrowRight className="w-4 h-4" /></button>
                ) : (
                  <button onClick={submit} disabled={sending} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:-translate-y-px disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${accent}, #7C4DFF)`, boxShadow: `0 0 30px ${accent}33` }}>{sending ? 'Convening…' : 'Request briefing'} <ArrowRight className="w-4 h-4" /></button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SovereignBriefing;
