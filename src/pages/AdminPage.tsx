import React, { useEffect, useMemo, useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { supabase } from '@/lib/supabase';
import type { Domain, Lead, AnalyticsEvent, UserRoleRow, EcosystemProduct } from '@/lib/types';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { logAudit, fetchRecentAuditLogs, AuditLogEntry } from '@/lib/audit';
import { toast } from 'sonner';
import { useEscape } from '@/hooks/useEscape';
import type { LucideIcon } from 'lucide-react';
import {
  Plus, Edit2, Trash2, Eye, Globe, Users, DollarSign, TrendingUp, X, Save, Activity, Lock,
  ShieldAlert, LogIn, FileText, Pencil, PlusCircle, Trash, BarChart3, Monitor, Smartphone, Tablet,
  Radio, Search, Share2, Link2, Mail, Image as ImageIcon, MessageCircle, Crown, ShieldCheck, Fingerprint,
  Boxes, ExternalLink, Film, Play, Sparkles,
} from 'lucide-react';

type Tab = 'overview' | 'domains' | 'leads' | 'briefings' | 'channel' | 'narratives' | 'campaigns' | 'scenarios' | 'pipelines' | 'analytics' | 'ecosystem' | 'team' | 'activity';
interface Scenario { id: string; label: string; accent: string; icon_key: string; origin: number; down: number[]; respond: number[]; phases: Array<{ label: string; resilience: number; affected: number; clock: string; desc: string }>; published: boolean; sort_order: number; created_at: string }
interface PipelineJob { id: string; kind: string; status: string; provider: string | null; title: string | null; result_url: string | null; error: string | null; created_at: string }
interface MediaItem { id: string; media_class: string; kind: string; title: string; meta: string | null; length: string | null; youtube_id: string | null; sort_order: number }
interface Narrative { id: string; kind: string; media_class: string | null; title: string; subtitle: string | null; body: string; read_time: string | null; published: boolean; sort_order: number; cover_image_url: string | null }
interface Campaign { id: string; name: string; media_class: string | null; channel: string; status: string; asset_ref: string | null; scheduled_at: string | null; created_at: string }
type LeadFilter = 'all' | 'inquiry' | 'offer' | 'buy_now';
interface Inquiry { id: string; created_at: string; system_slug: string | null; system_name: string | null; tier: string | null; name: string | null; email: string; organization: string | null; message: string | null; status?: string | null; ai_score?: number | null; ai_priority?: string | null; ai_summary?: string | null; ai_reply?: string | null; ai_signals?: string[] | null; analyzed_at?: string | null }

// Image generation can take 20-40s; cap it so a stalled request never freezes the UI.
async function invokeImage(body: Record<string, unknown>, ms = 90000): Promise<{ url?: string; error?: string }> {
  const result = await Promise.race([
    supabase.functions.invoke('generate-image', { body }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timed out — image generation took too long')), ms)),
  ]);
  const { data, error } = result as { data: { url?: string; error?: string } | null; error: { message: string } | null };
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.url) throw new Error('No image URL returned');
  return data;
}

const ORIGIN_META: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  direct: { icon: Radio, color: '#00D9FF', label: 'Direct' },
  search: { icon: Search, color: '#10B981', label: 'Search' },
  social: { icon: Share2, color: '#7C3AED', label: 'Social' },
  referral: { icon: Link2, color: '#F59E0B', label: 'Referral' },
  internal: { icon: Globe, color: '#94A3B8', label: 'Internal' },
};

const DEVICE_META: Record<string, { icon: LucideIcon; color: string }> = {
  desktop: { icon: Monitor, color: '#00D9FF' },
  mobile: { icon: Smartphone, color: '#10B981' },
  tablet: { icon: Tablet, color: '#F59E0B' },
};

const AdminPage: React.FC = () => {
  useDocumentTitle('Command Center', 'Operate the sovereign platform — domains, leads, analytics, ecosystem and deployment governance.');
  const { user, role, isAdmin, loading: authLoading } = useAuth();
  const [authModal, setAuthModal] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [briefings, setBriefings] = useState<Inquiry[]>([]);
  const [briefingFilter, setBriefingFilter] = useState<string>('all');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [openAnalysis, setOpenAnalysis] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioBrief, setScenarioBrief] = useState('');
  const [genScenario, setGenScenario] = useState(false);
  const [pipelineJobs, setPipelineJobs] = useState<PipelineJob[]>([]);
  const [pipelineBusy, setPipelineBusy] = useState<string | null>(null);
  const [filmTitle, setFilmTitle] = useState('');
  const [filmScript, setFilmScript] = useState('');
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [users, setUsers] = useState<UserRoleRow[]>([]);
  const [systems, setSystems] = useState<EcosystemProduct[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [editNar, setEditNar] = useState<Partial<Narrative> | null>(null);
  const [editCamp, setEditCamp] = useState<Partial<Campaign> | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genBrief, setGenBrief] = useState('');
  const [editingSystem, setEditingSystem] = useState<Partial<EcosystemProduct> | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [genRowId, setGenRowId] = useState<string | null>(null);
  useEscape(() => { setEditing(null); setEditingSystem(null); });
  const [audit, setAudit] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Domain> | null>(null);
  const [leadFilter, setLeadFilter] = useState<LeadFilter>('all');

  const load = async () => {
    setLoading(true);
    const [d, l, ev, u, a] = await Promise.all([
      supabase.from('domains').select('*').order('created_at', { ascending: false }),
      supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(2000),
      supabase.from('user_roles').select('*').order('created_at', { ascending: true }),
      fetchRecentAuditLogs(50),
    ]);
    const sys = await supabase.from('ecosystem_products').select('*').order('sort_order', { ascending: true });
    const inq = await supabase.from('inquiries').select('*').order('created_at', { ascending: false }).limit(200);
    const med = await supabase.from('media').select('*').order('media_class', { ascending: true }).order('sort_order', { ascending: true });
    const nar = await supabase.from('narratives').select('*').order('sort_order', { ascending: true });
    const camp = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
    const scn = await supabase.from('scenarios').select('*').order('sort_order', { ascending: true });
    const pj = await supabase.from('pipeline_jobs').select('id, kind, status, provider, title, result_url, error, created_at').order('created_at', { ascending: false }).limit(50);
    setMedia((med.data || []) as MediaItem[]);
    setNarratives((nar.data || []) as Narrative[]);
    setCampaigns((camp.data || []) as Campaign[]);
    setScenarios((scn.data || []) as Scenario[]);
    setPipelineJobs((pj.data || []) as PipelineJob[]);
    setDomains((d.data || []) as Domain[]);
    setLeads((l.data || []) as Lead[]);
    setBriefings((inq.data || []) as Inquiry[]);
    setEvents((ev.data || []) as AnalyticsEvent[]);
    setUsers((u.data || []) as UserRoleRow[]);
    setSystems((sys.data || []) as EcosystemProduct[]);
    setAudit(a);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const domainName = useMemo(() => {
    const m: Record<string, string> = {};
    for (const d of domains) m[d.id] = d.domain_name;
    return m;
  }, [domains]);

  const stats = useMemo(() => {
    const totalValue = domains.reduce((s, d) => s + Number(d.price_usd || 0), 0);
    const totalViews = domains.reduce((s, d) => s + (d.view_count || 0), 0);
    const activeDomains = domains.filter((d) => d.status === 'active' && !d.deleted_at).length;
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const newLeadsToday = leads.filter((l) => new Date(l.created_at) >= startOfToday).length;
    const uniqueVisitors = new Set(events.map((e) => e.visitor_id).filter(Boolean)).size;
    return {
      totalValue, totalViews, activeDomains, newLeadsToday, uniqueVisitors,
      domainCount: domains.length, leadCount: leads.length,
    };
  }, [domains, leads, events]);

  // ---- Analytics aggregations (real telemetry, no placeholders) ----
  const analytics = useMemo(() => {
    const views = events.filter((e) => e.event_type === 'view').length;
    const ctaClicks = events.filter((e) => e.event_type === 'cta_click').length;
    const conversions = events.filter((e) => ['inquiry', 'offer', 'buy_now'].includes(e.event_type)).length;
    const uniqueVisitors = new Set(events.map((e) => e.visitor_id).filter(Boolean)).size;
    const conversionRate = views > 0 ? (conversions / views) * 100 : 0;

    const tally = (key: (e: AnalyticsEvent) => string) => {
      const m: Record<string, number> = {};
      for (const e of events) { const k = key(e); m[k] = (m[k] || 0) + 1; }
      return Object.entries(m).sort((a, b) => b[1] - a[1]);
    };
    const origins = tally((e) => (e.metadata?.traffic_origin as string) || 'direct');
    const devices = tally((e) => e.device || 'unknown');

    // Events per day for the last 14 days.
    const days: { key: string; label: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const dt = new Date(); dt.setHours(0, 0, 0, 0); dt.setDate(dt.getDate() - i);
      days.push({ key: dt.toISOString().slice(0, 10), label: dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), count: 0 });
    }
    const dayIdx: Record<string, number> = {};
    days.forEach((d, i) => { dayIdx[d.key] = i; });
    for (const e of events) { const k = e.created_at.slice(0, 10); if (k in dayIdx) days[dayIdx[k]].count++; }
    const maxDay = Math.max(1, ...days.map((d) => d.count));

    // Top domains by event volume.
    const perDomain: Record<string, number> = {};
    for (const e of events) { if (e.domain_id) perDomain[e.domain_id] = (perDomain[e.domain_id] || 0) + 1; }
    const topDomains = Object.entries(perDomain).sort((a, b) => b[1] - a[1]).slice(0, 6);

    return { views, ctaClicks, conversions, uniqueVisitors, conversionRate, origins, devices, days, maxDay, topDomains };
  }, [events]);

  const filteredLeads = useMemo(
    () => (leadFilter === 'all' ? leads : leads.filter((l) => l.intent === leadFilter)),
    [leads, leadFilter],
  );
  const offerCount = useMemo(() => leads.filter((l) => l.intent === 'offer').length, [leads]);

  // === Access control screens ===
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <AnimatedBackground intensity="low" />
        <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen text-white">
        <AnimatedBackground intensity="low" />
        <PlatformNav />
        <main className="pt-32 px-4 max-w-xl mx-auto">
          <div className="glass-strong rounded-2xl p-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 flex items-center justify-center mb-5">
              <Lock className="w-7 h-7 text-cyan-300" />
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 mb-2">Restricted · Sovereign Console</div>
            <h1 className="text-3xl font-bold mb-2">Authentication required</h1>
            <p className="text-white/60 text-sm max-w-md mx-auto mb-6">
              The Command Center is gated by sovereign identity verification. Sign in with an admin-tier account to access domain registry controls, lead intelligence, and operational telemetry.
            </p>
            <button onClick={() => setAuthModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold">
              <LogIn className="w-4 h-4" /> Authenticate
            </button>
            <div className="mt-6 pt-6 border-t border-white/5 text-[11px] text-white/40 font-mono">
              First-created account is automatically elevated to <span className="text-amber-300">admin</span> tier.
            </div>
          </div>
        </main>
        {authModal && <AuthModal onClose={() => setAuthModal(false)} initialMode="signin" />}
        <PlatformFooter />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="relative min-h-screen text-white">
        <AnimatedBackground intensity="low" />
        <PlatformNav />
        <main className="pt-32 px-4 max-w-xl mx-auto">
          <div className="glass-strong rounded-2xl p-10 text-center border border-red-500/20">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-5">
              <ShieldAlert className="w-7 h-7 text-red-300" />
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-red-400 mb-2">Access Denied · RBAC Block</div>
            <h1 className="text-3xl font-bold mb-2">Insufficient privileges</h1>
            <p className="text-white/60 text-sm max-w-md mx-auto mb-4">
              Your account holds the <span className="text-white font-mono">{role?.role || 'viewer'}</span> role. Admin-tier authorization is required to operate the sovereign console.
            </p>
            <div className="glass rounded-lg p-3 max-w-sm mx-auto mb-6 text-left">
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">Identity</div>
              <div className="text-white/80 text-sm">{user.email}</div>
              <div className="text-[10px] text-white/40 font-mono mt-1.5">UID · {user.id.slice(0, 8)}...{user.id.slice(-4)}</div>
            </div>
            <p className="text-white/40 text-xs">Contact a platform administrator to request elevation.</p>
          </div>
        </main>
        <PlatformFooter />
      </div>
    );
  }

  // === Admin actions with audit logging ===
  const saveDomain = async () => {
    if (!editing?.domain_name) return toast.error('Domain name required');
    try {
      const payload = {
        domain_name: editing.domain_name.toLowerCase().trim(),
        tagline: editing.tagline || '',
        description: editing.description || '',
        logo_url: editing.logo_url || null,
        hero_image_url: editing.hero_image_url || null,
        price_usd: Number(editing.price_usd) || 0,
        category: editing.category || 'general',
        tld: editing.domain_name.includes('.') ? '.' + editing.domain_name.split('.').slice(-1)[0] : '.com',
        brand_color: editing.brand_color || '#00D9FF',
        accent_color: editing.accent_color || '#7C3AED',
        is_premium: editing.is_premium || false,
        is_featured: editing.is_featured || false,
        valuation_score: Number(editing.valuation_score) || 75,
        whatsapp_number: editing.whatsapp_number || null,
        contact_email: editing.contact_email || null,
        status: editing.status || 'active',
      };
      if (editing.id) {
        const prev = domains.find((d) => d.id === editing.id);
        const { error } = await supabase.from('domains').update(payload).eq('id', editing.id);
        if (error) throw error;
        await logAudit({
          action: 'domain.update',
          resource_type: 'domain',
          resource_id: editing.id,
          actor_email: user.email,
          changes: { domain_name: payload.domain_name, before_price: prev?.price_usd, after_price: payload.price_usd, before_status: prev?.status, after_status: payload.status },
        });
        toast.success('Domain updated · logged');
      } else {
        const { data, error } = await supabase.from('domains').insert(payload).select().single();
        if (error) throw error;
        await logAudit({
          action: 'domain.create',
          resource_type: 'domain',
          resource_id: data.id,
          actor_email: user.email,
          changes: { domain_name: payload.domain_name, price: payload.price_usd, category: payload.category },
        });
        toast.success('Domain registered · logged');
      }
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const removeDomain = async (id: string) => {
    if (!confirm('Soft-delete this domain?')) return;
    const target = domains.find((d) => d.id === id);
    const { error } = await supabase.from('domains').update({ deleted_at: new Date().toISOString(), status: 'inactive' }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    await logAudit({
      action: 'domain.delete',
      resource_type: 'domain',
      resource_id: id,
      actor_email: user.email,
      changes: { domain_name: target?.domain_name, soft_delete: true },
    });
    toast.success('Archived · logged');
    load();
  };

  const updateMediaVideo = async (id: string, youtube_id: string) => {
    const v = youtube_id.trim() || null;
    setMedia((prev) => prev.map((m) => (m.id === id ? { ...m, youtube_id: v } : m)));
    const { error } = await supabase.from('media').update({ youtube_id: v }).eq('id', id);
    if (error) toast.error('Could not save video id'); else toast.success('Media updated');
  };

  const generateContent = async (type: string, mediaClass: string | null, onText: (t: string) => void) => {
    const brief = genBrief.trim();
    if (!brief) { toast.error('Add a brief first — what should the AI draft?'); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { type, brief, mediaClass: mediaClass || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const text = (data?.text || '').trim();
      if (!text) throw new Error('Empty draft returned');
      onText(text);
      toast.success('Draft generated');
    } catch (e) {
      toast.error(`Generation failed: ${(e as Error).message}`);
    }
    setGenerating(false);
  };

  const saveNarrative = async () => {
    if (!editNar?.title?.trim() || !editNar?.body?.trim()) { toast.error('Title and body required'); return; }
    const payload = { kind: editNar.kind || 'dispatch', media_class: editNar.media_class || null, title: editNar.title.trim(), subtitle: editNar.subtitle?.trim() || null, body: editNar.body, read_time: editNar.read_time?.trim() || null, published: editNar.published ?? true, sort_order: editNar.sort_order ?? (narratives.length + 1), cover_image_url: editNar.cover_image_url?.trim() || null };
    const { error } = editNar.id ? await supabase.from('narratives').update(payload).eq('id', editNar.id) : await supabase.from('narratives').insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success('Dispatch saved'); setEditNar(null); loadAll();
  };
  const generateNarrativeCover = async () => {
    if (!editNar?.title?.trim()) { toast.error('Add a title first'); return; }
    const prompt = `Cover key art for a sovereign dispatch titled "${editNar.title}".${editNar.subtitle ? ` ${editNar.subtitle}.` : ''} Editorial, cinematic, civilization-scale.`;
    setGenerating(true);
    try {
      const data = await invokeImage({ prompt, mediaClass: editNar.media_class || 'strategic', orientation: 'landscape' });
      setEditNar((cur) => (cur ? { ...cur, cover_image_url: data.url } : cur));
      toast.success('Cover art generated');
    } catch (e) {
      toast.error(`Image generation failed: ${(e as Error).message}`);
    }
    setGenerating(false);
  };
  const deleteNarrative = async (id: string) => {
    if (!confirm('Delete this dispatch?')) return;
    const { error } = await supabase.from('narratives').delete().eq('id', id);
    if (error) { toast.error(error.message); return; } toast.success('Deleted'); loadAll();
  };
  const saveCampaign = async () => {
    if (!editCamp?.name?.trim()) { toast.error('Name required'); return; }
    const payload = { name: editCamp.name.trim(), media_class: editCamp.media_class || null, channel: editCamp.channel || 'executive', status: editCamp.status || 'draft', asset_ref: editCamp.asset_ref?.trim() || null, scheduled_at: editCamp.scheduled_at || null };
    const { error } = editCamp.id ? await supabase.from('campaigns').update(payload).eq('id', editCamp.id) : await supabase.from('campaigns').insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success('Campaign saved'); setEditCamp(null); loadAll();
  };
  const setCampaignStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('campaigns').update({ status }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    setCampaigns((cs) => cs.map((c) => (c.id === id ? { ...c, status } : c)));
    toast.success(status === 'live' ? 'Now broadcasting' : `Marked ${status}`);
  };
  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) { toast.error(error.message); return; } toast.success('Deleted'); loadAll();
  };

  const generateScenario = async () => {
    if (!scenarioBrief.trim()) { toast.error('Describe the crisis to simulate'); return; }
    setGenScenario(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-scenario', { body: { brief: scenarioBrief.trim() } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const s = data.scenario;
      if (!s || !Array.isArray(s.phases) || s.phases.length !== 5) throw new Error('Model returned an invalid scenario shape');
      const { error: insErr } = await supabase.from('scenarios').insert({
        label: s.label, accent: s.accent, icon_key: s.icon_key, origin: s.origin,
        down: s.down, respond: s.respond, phases: s.phases, published: true, sort_order: scenarios.length + 1,
      });
      if (insErr) throw insErr;
      toast.success('Scenario generated & published');
      setScenarioBrief('');
      loadAll();
    } catch (e) {
      toast.error(`Scenario generation failed: ${(e as Error).message}`);
    }
    setGenScenario(false);
  };
  const toggleScenario = async (s: Scenario) => {
    const { error } = await supabase.from('scenarios').update({ published: !s.published }).eq('id', s.id);
    if (error) { toast.error(error.message); return; }
    setScenarios((prev) => prev.map((x) => (x.id === s.id ? { ...x, published: !x.published } : x)));
  };
  const deleteScenario = async (id: string) => {
    if (!confirm('Delete this scenario?')) return;
    const { error } = await supabase.from('scenarios').delete().eq('id', id);
    if (error) { toast.error(error.message); return; } toast.success('Deleted'); loadAll();
  };

  const refreshPipelineJobs = async () => {
    const pj = await supabase.from('pipeline_jobs').select('id, kind, status, provider, title, result_url, error, created_at').order('created_at', { ascending: false }).limit(50);
    setPipelineJobs((pj.data || []) as PipelineJob[]);
  };
  const voiceDispatch = async (n: Narrative) => {
    setPipelineBusy('voice-' + n.id);
    try {
      const { data, error } = await supabase.functions.invoke('generate-narration', { body: { script: n.body, title: n.title, voice: 'onyx' } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Narration generated');
      refreshPipelineJobs();
    } catch (e) { toast.error(`Narration failed: ${(e as Error).message}`); }
    setPipelineBusy(null);
  };
  const renderFilm = async () => {
    if (!filmScript.trim()) { toast.error('Add a script for the film'); return; }
    setPipelineBusy('film');
    try {
      const { data, error } = await supabase.functions.invoke('render-video', { body: { script: filmScript.trim(), title: filmTitle.trim() || 'Untitled film', mediaClass: 'cinematic' } });
      if (error) throw error;
      if (data?.error) { toast(data.error + (data.detail ? ` — ${data.detail}` : '')); } else { toast.success('Render submitted'); }
      setFilmTitle(''); setFilmScript('');
      refreshPipelineJobs();
    } catch (e) { toast.error(`Render failed: ${(e as Error).message}`); }
    setPipelineBusy(null);
  };
  const publishCampaignNow = async (c: Campaign) => {
    setPipelineBusy('pub-' + c.id);
    try {
      const { data, error } = await supabase.functions.invoke('post-campaign', { body: { campaign_id: c.id } });
      if (error) throw error;
      if (data?.error) { toast(data.error + (data.detail ? ` — ${data.detail}` : '')); } else { toast.success(`Publishing to ${c.channel}`); }
      refreshPipelineJobs();
    } catch (e) { toast.error(`Publish failed: ${(e as Error).message}`); }
    setPipelineBusy(null);
  };

  const updateInquiryStatus = async (id: string, status: string) => {
    setBriefings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    await supabase.from('inquiries').update({ status }).eq('id', id);
  };

  const analyzeBriefing = async (b: Inquiry) => {
    setAnalyzingId(b.id);
    setOpenAnalysis(b.id);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-lead', {
        body: { inquiry: { system_slug: b.system_slug, system_name: b.system_name, tier: b.tier, name: b.name, email: b.email, organization: b.organization, message: b.message } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const patch = {
        ai_score: data.score ?? null,
        ai_priority: data.priority ?? null,
        ai_summary: data.summary ?? '',
        ai_reply: data.suggested_reply ?? '',
        ai_signals: Array.isArray(data.signals) ? data.signals : [],
        analyzed_at: new Date().toISOString(),
      };
      const { error: upErr } = await supabase.from('inquiries').update(patch).eq('id', b.id);
      if (upErr) throw upErr;
      setBriefings((prev) => prev.map((x) => (x.id === b.id ? { ...x, ...patch } : x)));
      toast.success('Briefing analyzed');
    } catch (e) {
      toast.error(`Analysis failed: ${(e as Error).message}`);
    }
    setAnalyzingId(null);
  };

  const exportBriefings = () => {
    const head = ['Created', 'System', 'Tier', 'Name', 'Email', 'Organization', 'Status', 'Message'];
    const rows = briefings.map((b) => [b.created_at, b.system_name || b.system_slug || '', b.tier || '', b.name || '', b.email, b.organization || '', b.status || 'new', (b.message || '').replace(/\s+/g, ' ')]);
    const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'sovereign-briefings.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const updateLeadStatus = async (id: string, status: string) => {
    const target = leads.find((l) => l.id === id);
    await supabase.from('leads').update({ status }).eq('id', id);
    await logAudit({
      action: 'lead.update',
      resource_type: 'lead',
      resource_id: id,
      actor_email: user.email,
      changes: { email: target?.email, before: target?.status, after: status },
    });
    toast.success('Lead updated · logged');
    load();
  };

  const updateUserRole = async (u: UserRoleRow, newRole: string) => {
    if (newRole === u.role) return;
    if (u.user_id === user.id) { toast.error('You cannot change your own role'); return; }
    const { error } = await supabase.from('user_roles').update({ role: newRole }).eq('user_id', u.user_id);
    if (error) { toast.error(error.message); return; }
    await logAudit({
      action: 'role.update',
      resource_type: 'user_role',
      resource_id: u.user_id,
      actor_email: user.email,
      changes: { email: u.email, before: u.role, after: newRole },
    });
    toast.success(`Role updated → ${newRole} · logged`);
    load();
  };

  const saveSystem = async () => {
    const s = editingSystem;
    if (!s?.name || !s?.slug) return toast.error('Name and slug required');
    const capabilities = typeof (s as { capsText?: string }).capsText === 'string'
      ? (s as { capsText?: string }).capsText!.split('\n').map((x) => x.trim()).filter(Boolean)
      : (s.capabilities || []);
    const metrics = typeof (s as { metricsText?: string }).metricsText === 'string'
      ? (s as { metricsText?: string }).metricsText!.split('\n').map((l) => l.split('=')).filter((p) => p.length === 2).map(([label, value]) => ({ label: label.trim(), value: value.trim() }))
      : (s.metrics || []);
    const payload = {
      slug: s.slug.toLowerCase().trim(),
      name: s.name, category: s.category || 'Sovereign Infrastructure',
      tagline: s.tagline || '', description: s.description || '',
      capabilities, metrics, accent: s.accent || '#00D9FF',
      url: s.url || null, image_url: s.image_url || null,
      status: s.status || 'deployable', is_featured: s.is_featured || false,
      sort_order: Number(s.sort_order) || 100, updated_at: new Date().toISOString(),
    };
    try {
      if (s.id) {
        const { error } = await supabase.from('ecosystem_products').update(payload).eq('id', s.id);
        if (error) throw error;
        await logAudit({ action: 'system.update', resource_type: 'ecosystem', resource_id: s.id, actor_email: user.email, changes: { name: payload.name, slug: payload.slug } });
        toast.success('System updated · logged');
      } else {
        const { data, error } = await supabase.from('ecosystem_products').insert(payload).select('id').single();
        if (error) throw error;
        await logAudit({ action: 'system.create', resource_type: 'ecosystem', resource_id: data.id, actor_email: user.email, changes: { name: payload.name, slug: payload.slug } });
        toast.success('System added · logged');
      }
      setEditingSystem(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const generateSystemVisual = async () => {
    const s = editingSystem;
    if (!s?.name?.trim()) { toast.error('Add a system name first'); return; }
    const prompt = `Cover key art for "${s.name}"${s.category ? `, a ${s.category}` : ''}.${s.tagline ? ` ${s.tagline}.` : ''}${s.description ? ` ${s.description}` : ''}`;
    setUploadingImage(true);
    try {
      const data = await invokeImage({ prompt, mediaClass: 'cinematic', orientation: 'landscape' });
      setEditingSystem((cur) => (cur ? { ...cur, image_url: data.url } : cur));
      toast.success('Visual generated');
    } catch (e) {
      toast.error(`Image generation failed: ${(e as Error).message}`);
    }
    setUploadingImage(false);
  };

  const generateSystemCoverRow = async (s: EcosystemProduct) => {
    setGenRowId(s.id);
    const prompt = `Cover key art for "${s.name}"${s.category ? `, a ${s.category}` : ''}.${s.tagline ? ` ${s.tagline}.` : ''}`;
    try {
      const data = await invokeImage({ prompt, mediaClass: 'cinematic', orientation: 'landscape' });
      const { error: upErr } = await supabase.from('ecosystem_products').update({ image_url: data.url }).eq('id', s.id);
      if (upErr) throw upErr;
      setSystems((cur) => cur.map((x) => (x.id === s.id ? { ...x, image_url: data.url } : x)));
      toast.success(`Cover generated for ${s.name}`);
    } catch (e) {
      toast.error(`Image generation failed: ${(e as Error).message}`);
    }
    setGenRowId(null);
  };

  const generateDomainHero = async () => {
    const d = editing;
    if (!d?.domain_name?.trim()) { toast.error('Add a domain name first'); return; }
    const prompt = `Hero key art for the premium domain "${d.domain_name}"${d.category ? `, in the ${d.category} category` : ''}.${d.tagline ? ` ${d.tagline}.` : ''} Evoke its brand identity as a flagship digital asset.`;
    setUploadingImage(true);
    try {
      const data = await invokeImage({ prompt, mediaClass: 'cinematic', orientation: 'landscape' });
      setEditing((cur) => (cur ? { ...cur, hero_image_url: data.url } : cur));
      toast.success('Hero art generated');
    } catch (e) {
      toast.error(`Image generation failed: ${(e as Error).message}`);
    }
    setUploadingImage(false);
  };

  const uploadSystemImage = async (file: File) => {
    if (!file) return;
    setUploadingImage(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${(editingSystem?.slug || 'system').replace(/[^a-z0-9-]/gi, '')}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('ecosystem').upload(path, file, { upsert: true, cacheControl: '3600' });
    if (error) { toast.error(error.message); setUploadingImage(false); return; }
    const { data } = supabase.storage.from('ecosystem').getPublicUrl(path);
    setEditingSystem((s) => (s ? { ...s, image_url: data.publicUrl } : s));
    setUploadingImage(false);
    toast.success('Image uploaded');
  };

  const removeSystem = async (s: EcosystemProduct) => {
    if (!confirm(`Delete system "${s.name}"?`)) return;
    const { error } = await supabase.from('ecosystem_products').delete().eq('id', s.id);
    if (error) { toast.error(error.message); return; }
    await logAudit({ action: 'system.delete', resource_type: 'ecosystem', resource_id: s.id, actor_email: user.email, changes: { name: s.name, slug: s.slug } });
    toast.success('System deleted · logged');
    load();
  };

  const actionMeta: Record<string, { icon: LucideIcon; color: string; label: string }> = {
    'domain.create': { icon: PlusCircle, color: '#10B981', label: 'Created domain' },
    'domain.update': { icon: Pencil, color: '#00D9FF', label: 'Updated domain' },
    'domain.delete': { icon: Trash, color: '#EF4444', label: 'Archived domain' },
    'lead.update': { icon: Users, color: '#7C3AED', label: 'Updated lead' },
    'role.update': { icon: ShieldAlert, color: '#F59E0B', label: 'Changed role' },
    'system.create': { icon: PlusCircle, color: '#10B981', label: 'Added system' },
    'system.update': { icon: Pencil, color: '#22D3EE', label: 'Updated system' },
    'system.delete': { icon: Trash, color: '#EF4444', label: 'Deleted system' },
  };

  const formatRelative = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(iso).toLocaleDateString();
  };

  const overviewCards: Array<{ icon: LucideIcon; label: string; val: string | number; sub: string; color: string }> = [
    { icon: Globe, label: 'Domain Registry', val: stats.domainCount, sub: `${stats.activeDomains} active`, color: '#00D9FF' },
    { icon: DollarSign, label: 'Value Locked', val: `$${(stats.totalValue / 1000).toFixed(1)}k`, sub: `${domains.length ? '$' + Math.round(stats.totalValue / Math.max(1, domains.length)).toLocaleString() : '—'} avg`, color: '#10B981' },
    { icon: Users, label: 'Total Inquiries', val: stats.leadCount, sub: `${stats.newLeadsToday} today`, color: '#7C3AED' },
    { icon: TrendingUp, label: 'Unique Visitors', val: stats.uniqueVisitors, sub: `${stats.totalViews.toLocaleString()} views`, color: '#F59E0B' },
    { icon: ShieldAlert, label: 'Deployment Briefings', val: briefings.length, sub: `${briefings.filter((b) => (b.status || 'new') === 'new').length} new`, color: '#22D3EE' },
  ];

  const leadFilters: Array<{ id: LeadFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: leads.length },
    { id: 'inquiry', label: 'Inquiries', count: leads.filter((l) => l.intent === 'inquiry').length },
    { id: 'offer', label: 'Offers', count: offerCount },
    { id: 'buy_now', label: 'Buy Now', count: leads.filter((l) => l.intent === 'buy_now').length },
  ];

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-300">Command Center · Live</span>
                <span className="w-px h-3 bg-white/20" />
                <span className="text-xs font-mono text-amber-300">{role?.role}</span>
              </div>
              <h1 className="font-display text-4xl font-bold tracking-tight">Operational Console</h1>
              <p className="text-white/50 mt-1">Signed in as <span className="text-cyan-300 font-mono">{user.email}</span> · sovereign-grade RBAC active</p>
            </div>
            <button onClick={() => setEditing({})} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold">
              <Plus className="w-4 h-4" /> New Domain
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-white/5 overflow-x-auto">
            {([
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'domains', label: `Domains (${domains.length})`, icon: Globe },
              { id: 'leads', label: `Inquiries (${leads.length})`, icon: Users },
              { id: 'briefings', label: `Briefings (${briefings.length})`, icon: ShieldAlert },
              { id: 'channel', label: `Channel (${media.length})`, icon: Film },
              { id: 'narratives', label: `Dispatches (${narratives.length})`, icon: FileText },
              { id: 'campaigns', label: `Campaigns (${campaigns.length})`, icon: Radio },
              { id: 'scenarios', label: `Scenarios (${scenarios.length})`, icon: ShieldAlert },
              { id: 'pipelines', label: 'Pipelines', icon: Boxes },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'ecosystem', label: `Ecosystem (${systems.length})`, icon: Boxes },
              { id: 'team', label: `Access (${users.length})`, icon: ShieldCheck },
              { id: 'activity', label: `Activity (${audit.length})`, icon: FileText },
            ] as Array<{ id: Tab; label: string; icon: LucideIcon }>).map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                    tab === t.id ? 'text-cyan-400 border-cyan-400' : 'text-white/50 border-transparent hover:text-white'
                  }`}>
                  <Icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              );
            })}
          </div>

          {/* Overview */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {overviewCards.map((m) => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className="glass-strong rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${m.color}30, ${m.color}10)`, border: `1px solid ${m.color}40` }}>
                          <Icon className="w-5 h-5" style={{ color: m.color }} />
                        </div>
                        <span className="text-[10px] font-mono text-white/40">{m.sub}</span>
                      </div>
                      <div className="text-3xl font-bold text-white tabular-nums">{m.val}</div>
                      <div className="text-[10px] text-white/40 uppercase font-mono tracking-widest mt-1">{m.label}</div>
                    </div>
                  );
                })}
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                {/* Recent activity feed */}
                <div className="glass-strong rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <div className="text-white font-semibold">Recent Activity</div>
                    </div>
                    <button onClick={() => setTab('activity')} className="text-xs text-cyan-400 font-mono">VIEW ALL →</button>
                  </div>
                  <div className="space-y-1.5 max-h-80 overflow-y-auto">
                    {audit.slice(0, 8).map((a) => {
                      const meta = actionMeta[a.action] || { icon: FileText, color: '#94A3B8', label: a.action };
                      const Icon = meta.icon;
                      return (
                        <div key={a.id} className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.03]">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}40` }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white">
                              <span className="font-medium">{meta.label}</span>
                              {a.changes?.domain_name && <span className="text-cyan-300 font-mono ml-1.5">{a.changes.domain_name}</span>}
                              {a.changes?.email && <span className="text-purple-300 font-mono ml-1.5 text-xs">{a.changes.email}</span>}
                            </div>
                            <div className="text-[11px] text-white/40 mt-0.5 truncate">
                              {a.actor_email || 'system'} · {formatRelative(a.created_at)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {audit.length === 0 && (
                      <div className="text-white/30 text-sm text-center py-8">No activity yet · admin actions will appear here</div>
                    )}
                  </div>
                </div>

                <div className="glass-strong rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-white font-semibold">Top Performers</div>
                    <span className="text-xs text-white/40 font-mono">BY VIEWS</span>
                  </div>
                  {[...domains].sort((a, b) => b.view_count - a.view_count).slice(0, 8).map((d) => (
                    <div key={d.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full" style={{ background: d.brand_color }} />
                        <div className="min-w-0">
                          <div className="text-white text-sm font-medium truncate">{d.domain_name}</div>
                          <div className="text-xs text-white/40">${d.price_usd.toLocaleString()} · score {d.valuation_score}</div>
                        </div>
                      </div>
                      <div className="text-cyan-300 text-sm font-mono">{d.view_count}</div>
                    </div>
                  ))}
                  {domains.length === 0 && <div className="text-white/30 text-sm text-center py-8">No domains yet</div>}
                </div>
              </div>
            </div>
          )}

          {/* Domains tab */}
          {tab === 'domains' && (
            <div className="glass-strong rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-[10px] font-mono uppercase tracking-widest text-white/40">
                      <th className="px-5 py-3">Domain</th>
                      <th className="px-3 py-3">Category</th>
                      <th className="px-3 py-3">Price</th>
                      <th className="px-3 py-3">Score</th>
                      <th className="px-3 py-3">Views</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="text-center py-12 text-white/40">Loading...</td></tr>
                    ) : domains.map((d) => (
                      <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: d.brand_color }} />
                            <div>
                              <div className="text-white font-semibold">{d.domain_name}</div>
                              <div className="text-xs text-white/40 truncate max-w-[200px]">{d.tagline}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-white/60 text-xs font-mono uppercase">{d.category}</td>
                        <td className="px-3 py-3.5 text-white">${d.price_usd.toLocaleString()}</td>
                        <td className="px-3 py-3.5"><span className="text-cyan-300 font-mono">{d.valuation_score}</span></td>
                        <td className="px-3 py-3.5 text-white/60">{d.view_count}</td>
                        <td className="px-3 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                            d.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-white/50'
                          }`}>{d.status}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-1 justify-end">
                            <a href={`/d/${encodeURIComponent(d.domain_name)}`} target="_blank" rel="noreferrer" className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-cyan-400">
                              <Eye className="w-3.5 h-3.5" />
                            </a>
                            <button onClick={() => setEditing(d)} className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-cyan-400">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => removeDomain(d.id)} className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-red-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Leads tab */}
          {tab === 'leads' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {leadFilters.map((f) => (
                  <button key={f.id} onClick={() => setLeadFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition flex items-center gap-1.5 ${
                      leadFilter === f.id ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'glass text-white/50 hover:text-white'
                    }`}>
                    {f.label} <span className="text-white/40">{f.count}</span>
                  </button>
                ))}
              </div>
              <div className="glass-strong rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-[10px] font-mono uppercase tracking-widest text-white/40">
                        <th className="px-5 py-3">Contact</th>
                        <th className="px-3 py-3">Domain</th>
                        <th className="px-3 py-3">Intent</th>
                        <th className="px-3 py-3">Offer</th>
                        <th className="px-3 py-3">Score</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((l) => (
                        <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="px-5 py-3.5">
                            <div className="text-white">{l.name || '—'}</div>
                            <div className="text-xs text-white/40">{l.email}</div>
                          </td>
                          <td className="px-3 py-3.5 text-cyan-300 text-xs font-mono">{domainName[l.domain_id] || '—'}</td>
                          <td className="px-3 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                              l.intent === 'offer' ? 'bg-amber-500/15 text-amber-300' : l.intent === 'buy_now' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-purple-500/15 text-purple-300'
                            }`}>{l.intent}</span>
                          </td>
                          <td className="px-3 py-3.5 text-white/80 text-sm">{l.offer_amount ? `$${Number(l.offer_amount).toLocaleString()}` : '—'}</td>
                          <td className="px-3 py-3.5"><span className="text-amber-300 font-mono text-xs">{l.buyer_score}/100</span></td>
                          <td className="px-3 py-3.5">
                            <select value={l.status} onChange={(e) => updateLeadStatus(l.id, e.target.value)} aria-label="Lead status"
                              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] font-mono uppercase text-white">
                              <option value="new">new</option>
                              <option value="qualified">qualified</option>
                              <option value="negotiating">negotiating</option>
                              <option value="closed_won">closed_won</option>
                              <option value="closed_lost">closed_lost</option>
                            </select>
                          </td>
                          <td className="px-3 py-3.5 text-white/40 text-xs font-mono">{new Date(l.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {filteredLeads.length === 0 && (
                        <tr><td colSpan={7} className="text-center py-12 text-white/40">No {leadFilter === 'all' ? 'inquiries' : leadFilter} yet · waiting for buyer signal</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Deployment briefings */}
          {tab === 'briefings' && (
            <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {(['all', 'new', 'contacted', 'qualified', 'briefed', 'closed']).map((f) => (
                <button key={f} onClick={() => setBriefingFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition ${briefingFilter === f ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'glass text-white/50 hover:text-white'}`}>
                  {f} <span className="text-white/40">{f === 'all' ? briefings.length : briefings.filter((b) => (b.status || 'new') === f).length}</span>
                </button>
              ))}
              {briefings.length > 0 && (
                <button onClick={exportBriefings} className="ml-auto px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider glass text-white/60 hover:text-white transition flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Export CSV
                </button>
              )}
            </div>
            {/* acquisition funnel */}
            {briefings.length > 0 && (() => {
              const sc = (s: string) => briefings.filter((b) => (b.status || 'new') === s).length;
              const stages = [
                { label: 'Received', val: briefings.length, c: '#00D9FF' },
                { label: 'Contacted', val: sc('contacted') + sc('qualified') + sc('briefed') + sc('closed'), c: '#22D3EE' },
                { label: 'Qualified', val: sc('qualified') + sc('briefed') + sc('closed'), c: '#7C4DFF' },
                { label: 'Briefed', val: sc('briefed') + sc('closed'), c: '#10E5A0' },
                { label: 'Closed', val: sc('closed'), c: '#E8C572' },
              ];
              const tiers = Array.from(new Set(briefings.map((b) => b.tier).filter(Boolean))) as string[];
              return (
                <div className="grid lg:grid-cols-[2fr_1fr] gap-3">
                  <div className="glass rounded-2xl p-5">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/40 mb-4">Acquisition funnel</div>
                    <div className="grid grid-cols-5 gap-2">
                      {stages.map((s) => (
                        <div key={s.label}>
                          <div className="text-2xl font-bold text-white tabular-nums leading-none">{s.val}</div>
                          <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-white/40 mt-1.5">{s.label}</div>
                          <div className="h-1 rounded-full bg-white/8 mt-2 overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${briefings.length ? Math.round((s.val / briefings.length) * 100) : 0}%`, background: s.c }} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="glass rounded-2xl p-5">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/40 mb-4">By deployment scale</div>
                    {tiers.length ? (
                      <div className="space-y-2">
                        {tiers.map((t) => { const n = briefings.filter((b) => b.tier === t).length; return (
                          <div key={t} className="flex items-center justify-between text-xs"><span className="text-white/70 font-mono uppercase tracking-wider">{t}</span><span className="text-white tabular-nums">{n}</span></div>
                        ); })}
                      </div>
                    ) : <div className="text-white/30 text-xs">No tiered briefings yet.</div>}
                  </div>
                </div>
              );
            })()}
            <div className="glass-strong rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-[10px] font-mono uppercase tracking-widest text-white/40">
                      <th className="px-5 py-3">System</th>
                      <th className="px-3 py-3">Tier</th>
                      <th className="px-3 py-3">Contact</th>
                      <th className="px-3 py-3">Organization</th>
                      <th className="px-3 py-3">Context</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">AI triage</th>
                      <th className="px-3 py-3">Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {briefings.filter((b) => briefingFilter === 'all' || (b.status || 'new') === briefingFilter).map((b) => (
                      <React.Fragment key={b.id}>
                      <tr className="border-b border-white/5 hover:bg-white/[0.02] align-top">
                        <td className="px-5 py-3.5 text-cyan-300 text-xs font-mono">
                          {b.system_name || b.system_slug || '—'}
                          {b.system_slug === 'sovereign-briefing' && <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider bg-cyan-500/15 text-cyan-300 align-middle">Sovereign</span>}
                        </td>
                        <td className="px-3 py-3.5">{b.tier ? <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-500/15 text-purple-300">{b.tier}</span> : <span className="text-white/30">—</span>}</td>
                        <td className="px-3 py-3.5"><div className="text-white">{b.name || '—'}</div><a href={`mailto:${b.email}`} className="text-xs text-cyan-300/70 hover:text-cyan-300">{b.email}</a></td>
                        <td className="px-3 py-3.5 text-white/80 text-sm">{b.organization || '—'}</td>
                        <td className="px-3 py-3.5 text-white/55 text-xs max-w-[300px] whitespace-pre-line leading-relaxed">{b.message || '—'}</td>
                        <td className="px-3 py-3.5">
                          <select value={b.status || 'new'} onChange={(e) => updateInquiryStatus(b.id, e.target.value)} aria-label="Briefing status"
                            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] font-mono uppercase text-white">
                            <option value="new">new</option>
                            <option value="contacted">contacted</option>
                            <option value="qualified">qualified</option>
                            <option value="briefed">briefed</option>
                            <option value="closed">closed</option>
                          </select>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2">
                            {typeof b.ai_score === 'number' && (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${b.ai_score >= 80 ? 'bg-emerald-500/15 text-emerald-300' : b.ai_score >= 55 ? 'bg-cyan-500/15 text-cyan-300' : 'bg-white/8 text-white/50'}`}>{b.ai_score}</span>
                            )}
                            <button onClick={() => (b.analyzed_at && openAnalysis !== b.id ? setOpenAnalysis(b.id) : analyzeBriefing(b))} disabled={analyzingId !== null}
                              className="px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider bg-gradient-to-r from-cyan-500/80 to-purple-600/80 text-white inline-flex items-center gap-1 disabled:opacity-50">
                              {analyzingId === b.id ? <span className="block w-3 h-3 rounded-full border border-white/40 border-t-white animate-spin" /> : <Sparkles className="w-3 h-3" />}
                              {b.analyzed_at && openAnalysis !== b.id ? 'View' : analyzingId === b.id ? '' : b.analyzed_at ? 'Redo' : 'Analyze'}
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-white/40 text-xs font-mono whitespace-nowrap">{new Date(b.created_at).toLocaleDateString()}</td>
                      </tr>
                      {openAnalysis === b.id && b.analyzed_at && (
                        <tr className="border-b border-white/5 bg-cyan-500/[0.03]">
                          <td colSpan={8} className="px-5 py-4">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300/80">
                                <Sparkles className="w-3.5 h-3.5" /> AI revenue triage
                                {b.ai_priority && <span className="px-2 py-0.5 rounded bg-white/8 text-white/60">{b.ai_priority}</span>}
                              </div>
                              <button onClick={() => setOpenAnalysis(null)} className="text-white/40 hover:text-white text-xs">Collapse</button>
                            </div>
                            {b.ai_summary && <p className="text-white/75 text-sm leading-relaxed mb-3">{b.ai_summary}</p>}
                            {Array.isArray(b.ai_signals) && b.ai_signals.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-4">
                                {b.ai_signals.map((s, i) => <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-white/55 border border-white/10">{s}</span>)}
                              </div>
                            )}
                            {b.ai_reply && (
                              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Suggested reply</span>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => { navigator.clipboard.writeText(b.ai_reply || ''); toast.success('Reply copied'); }} className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 hover:text-cyan-200">Copy</button>
                                    <a href={`mailto:${b.email}?subject=${encodeURIComponent('Re: ' + (b.system_name || 'Sovereign briefing'))}&body=${encodeURIComponent(b.ai_reply || '')}`} className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 hover:text-cyan-200">Open in mail</a>
                                  </div>
                                </div>
                                <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{b.ai_reply}</p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    ))}
                    {briefings.filter((b) => briefingFilter === 'all' || (b.status || 'new') === briefingFilter).length === 0 && (
                      <tr><td colSpan={8} className="text-center py-12 text-white/40">No {briefingFilter === 'all' ? '' : briefingFilter + ' '}deployment briefings · institutional requests will appear here</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          )}

          {/* Channel media tab */}
          {tab === 'channel' && (
            <div className="space-y-6">
              <p className="text-sm text-white/50 max-w-2xl">Manage the Sovereign Channel. Paste a YouTube video ID into any item to make it play on the public channel — leave blank to keep the cinematic “in production” state.</p>
              {['cinematic', 'operational', 'strategic', 'crisis'].map((cls) => {
                const items = media.filter((m) => m.media_class === cls);
                if (items.length === 0) return null;
                return (
                  <div key={cls} className="glass-strong rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/10 text-[11px] font-mono uppercase tracking-[0.24em] text-cyan-300/70">{cls}</div>
                    <div className="divide-y divide-white/5">
                      {items.map((m) => (
                        <div key={m.id} className="flex items-center gap-4 px-5 py-3.5">
                          <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${m.kind === 'feature' ? 'bg-cyan-500/15 text-cyan-300' : 'bg-white/5 text-white/40'}`}>{m.kind === 'feature' ? <Film className="w-3.5 h-3.5" /> : <Play className="w-3 h-3" />}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-white truncate">{m.title}</div>
                            <div className="text-[10px] font-mono uppercase tracking-wider text-white/35">{m.kind}{m.length ? ` · ${m.length}` : ''}</div>
                          </div>
                          <input defaultValue={m.youtube_id || ''} placeholder="YouTube ID" aria-label={`YouTube ID for ${m.title}`}
                            onBlur={(e) => { if ((e.target.value.trim() || null) !== (m.youtube_id || null)) updateMediaVideo(m.id, e.target.value); }}
                            className="w-40 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
                          {m.youtube_id ? <span className="text-[10px] font-mono text-emerald-300/70 shrink-0">live</span> : <span className="text-[10px] font-mono text-white/25 shrink-0">—</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {media.length === 0 && <div className="glass rounded-2xl p-12 text-center text-white/40">No media rows.</div>}
            </div>
          )}

          {/* Narratives (dispatches) tab */}
          {tab === 'narratives' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-white/50">Author the Sovereign Dispatches that appear on the public Channel — manifestos, whitepapers, film scripts and after-action reports.</p>
                <button onClick={() => setEditNar({ kind: 'dispatch', published: true })} className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"><Plus className="w-3.5 h-3.5" /> New dispatch</button>
              </div>
              <div className="glass-strong rounded-2xl overflow-hidden divide-y divide-white/5">
                {narratives.map((n) => (
                  <div key={n.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/50 shrink-0">{n.kind}</span>
                    <div className="min-w-0 flex-1"><div className="text-sm text-white truncate">{n.title}</div><div className="text-[10px] text-white/35 truncate">{n.subtitle}</div></div>
                    <span className={`text-[10px] font-mono shrink-0 ${n.published ? 'text-emerald-300/70' : 'text-white/30'}`}>{n.published ? 'published' : 'draft'}</span>
                    <button onClick={() => voiceDispatch(n)} disabled={pipelineBusy !== null} title="Generate narration audio" className="text-white/40 hover:text-cyan-300 transition shrink-0 disabled:opacity-40">{pipelineBusy === 'voice-' + n.id ? <span className="block w-4 h-4 rounded-full border border-cyan-300/40 border-t-cyan-300 animate-spin" /> : <Play className="w-4 h-4" />}</button>
                    <button onClick={() => setEditNar(n)} aria-label="Edit" className="text-white/40 hover:text-white transition shrink-0"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteNarrative(n.id)} aria-label="Delete" className="text-white/40 hover:text-rose-300 transition shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {narratives.length === 0 && <div className="px-5 py-12 text-center text-white/40">No dispatches yet — author the first.</div>}
              </div>
            </div>
          )}

          {/* Campaigns tab */}
          {tab === 'campaigns' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-white/50">Plan distribution campaigns across executive briefings, LinkedIn and YouTube. (Posting automation activates once a distribution key is connected.)</p>
                <button onClick={() => setEditCamp({ channel: 'executive', status: 'draft' })} className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"><Plus className="w-3.5 h-3.5" /> New campaign</button>
              </div>
              <div className="glass-strong rounded-2xl overflow-hidden divide-y divide-white/5">
                {campaigns.map((c) => (
                  <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="min-w-0 flex-1"><div className="text-sm text-white truncate">{c.name}</div><div className="text-[10px] font-mono uppercase tracking-wider text-white/35">{c.channel}{c.media_class ? ` · ${c.media_class}` : ''}</div></div>
                    {c.scheduled_at && <span className="text-[10px] font-mono text-white/40 shrink-0">{new Date(c.scheduled_at).toLocaleDateString()}</span>}
                    <select value={c.status} onChange={(e) => setCampaignStatus(c.id, e.target.value)} aria-label="Status" className={`text-[10px] font-mono uppercase px-2 py-1 rounded shrink-0 border-0 cursor-pointer focus:outline-none ${c.status === 'live' ? 'bg-emerald-500/15 text-emerald-300' : c.status === 'scheduled' ? 'bg-cyan-500/15 text-cyan-300' : c.status === 'archived' ? 'bg-white/5 text-white/35' : 'bg-amber-500/15 text-amber-300'}`}>
                      {['draft', 'scheduled', 'live', 'archived'].map((s) => <option key={s} value={s} className="bg-[#0A0E27] text-white">{s}</option>)}
                    </select>
                    <button onClick={() => publishCampaignNow(c)} disabled={pipelineBusy !== null} title="Publish to channel now" className="text-white/40 hover:text-emerald-300 transition shrink-0 disabled:opacity-40">{pipelineBusy === 'pub-' + c.id ? <span className="block w-4 h-4 rounded-full border border-emerald-300/40 border-t-emerald-300 animate-spin" /> : <Share2 className="w-4 h-4" />}</button>
                    <button onClick={() => setEditCamp(c)} aria-label="Edit" className="text-white/40 hover:text-white transition shrink-0"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteCampaign(c.id)} aria-label="Delete" className="text-white/40 hover:text-rose-300 transition shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {campaigns.length === 0 && <div className="px-5 py-12 text-center text-white/40">No campaigns yet.</div>}
              </div>
            </div>
          )}

          {/* Scenarios tab */}
          {tab === 'scenarios' && (
            <div className="space-y-4">
              <p className="text-sm text-white/50">Generate AI crisis simulations that play live on the public Channel command center. Each renders across the 7-node ministry mesh (Power · Comms · Transport · Emergency · Health · Justice · Treasury).</p>
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-cyan-300/80"><Sparkles className="w-3.5 h-3.5" /> Scenario generator</div>
                <textarea value={scenarioBrief} onChange={(e) => setScenarioBrief(e.target.value)} placeholder="Describe the crisis — e.g. 'A coordinated ransomware strike on the national treasury during an election', or 'A category-5 storm overwhelming health and transport'…" rows={2} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 resize-none" />
                <button type="button" disabled={genScenario} onClick={generateScenario} className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50">
                  <Sparkles className="w-3.5 h-3.5" /> {genScenario ? 'Designing simulation…' : 'Generate & publish'}
                </button>
              </div>
              <div className="glass-strong rounded-2xl overflow-hidden divide-y divide-white/5">
                {scenarios.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.accent }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white truncate">{s.label}</div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-white/35">{Array.isArray(s.phases) ? s.phases.length : 0} phases · origin node {s.origin} · {Array.isArray(s.down) ? s.down.length : 0} affected</div>
                    </div>
                    <button onClick={() => toggleScenario(s)} className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded shrink-0 ${s.published ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-white/35'}`}>{s.published ? 'live' : 'hidden'}</button>
                    <button onClick={() => deleteScenario(s.id)} aria-label="Delete" className="text-white/40 hover:text-rose-300 transition shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {scenarios.length === 0 && <div className="px-5 py-12 text-center text-white/40">No AI scenarios yet — the three built-in simulations always play on the Channel. Generate one to add to them.</div>}
              </div>
            </div>
          )}

          {/* Pipelines tab */}
          {tab === 'pipelines' && (
            <div className="space-y-5">
              <p className="text-sm text-white/50">Media & automation pipelines. Narration is live (OpenAI TTS). Video render and social posting activate once their provider keys are configured — every run is recorded below either way.</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-cyan-300/80"><Film className="w-3.5 h-3.5" /> Render film</div>
                  <input value={filmTitle} onChange={(e) => setFilmTitle(e.target.value)} placeholder="Film title" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30" />
                  <textarea value={filmScript} onChange={(e) => setFilmScript(e.target.value)} placeholder="Script / shot description for the render…" rows={2} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 resize-none" />
                  <button type="button" disabled={pipelineBusy !== null} onClick={renderFilm} className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50">
                    <Film className="w-3.5 h-3.5" /> {pipelineBusy === 'film' ? 'Submitting…' : 'Submit render'}
                  </button>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-white/55 leading-relaxed">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-white/40 mb-2">Triggers</div>
                  <p className="mb-1.5"><span className="text-cyan-300">Voice</span> — the ▶ on any dispatch (Dispatches tab) generates narration audio.</p>
                  <p className="mb-1.5"><span className="text-emerald-300">Publish</span> — the share icon on any campaign (Campaigns tab) posts to its channel.</p>
                  <p>Provider keys needed: <span className="font-mono">VIDEO_PROVIDER_URL/KEY</span> for video, <span className="font-mono">LINKEDIN/YOUTUBE_ACCESS_TOKEN</span> for social.</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/40">Recent jobs</div>
                <button onClick={refreshPipelineJobs} className="text-[10px] font-mono uppercase tracking-wider glass px-2.5 py-1 rounded text-white/60 hover:text-white">Refresh</button>
              </div>
              <div className="glass-strong rounded-2xl overflow-hidden divide-y divide-white/5">
                {pipelineJobs.map((j) => (
                  <div key={j.id} className="flex items-center gap-4 px-5 py-3">
                    <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/50 shrink-0 w-20 text-center">{j.kind}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white truncate">{j.title || '—'}{j.provider ? <span className="text-white/35 text-xs font-mono"> · {j.provider}</span> : null}</div>
                      {j.error && <div className="text-[10px] text-rose-300/70 truncate">{j.error}</div>}
                    </div>
                    {j.result_url && <a href={j.result_url} target="_blank" rel="noreferrer" className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 hover:text-cyan-200 shrink-0">Open</a>}
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded shrink-0 ${j.status === 'done' ? 'bg-emerald-500/15 text-emerald-300' : j.status === 'processing' ? 'bg-cyan-500/15 text-cyan-300' : j.status === 'failed' ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}>{j.status}</span>
                    <span className="text-white/35 text-xs font-mono whitespace-nowrap shrink-0">{new Date(j.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
                {pipelineJobs.length === 0 && <div className="px-5 py-12 text-center text-white/40">No pipeline runs yet.</div>}
              </div>
            </div>
          )}

          {/* Analytics tab */}
          {tab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {([
                  { label: 'Total Events', val: events.length.toLocaleString(), color: '#00D9FF' },
                  { label: 'Unique Visitors', val: analytics.uniqueVisitors.toLocaleString(), color: '#7C3AED' },
                  { label: 'Page Views', val: analytics.views.toLocaleString(), color: '#10B981' },
                  { label: 'CTA Clicks', val: analytics.ctaClicks.toLocaleString(), color: '#F59E0B' },
                  { label: 'Conversion Rate', val: `${analytics.conversionRate.toFixed(1)}%`, color: '#EF4444' },
                ] as Array<{ label: string; val: string; color: string }>).map((m) => (
                  <div key={m.label} className="glass-strong rounded-xl p-4">
                    <div className="text-2xl font-bold text-white tabular-nums" style={{ color: m.color }}>{m.val}</div>
                    <div className="text-[10px] text-white/40 uppercase font-mono tracking-widest mt-1">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Traffic over time */}
              <div className="glass-strong rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <div className="text-white font-semibold">Engagement · last 14 days</div>
                </div>
                <div className="flex items-end gap-1.5 h-40">
                  {analytics.days.map((d) => (
                    <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <div className="w-full rounded-t bg-gradient-to-t from-cyan-500/40 to-purple-500/60 hover:from-cyan-400/60 hover:to-purple-400/80 transition-all relative"
                        style={{ height: `${(d.count / analytics.maxDay) * 100}%`, minHeight: d.count > 0 ? '4px' : '2px' }}>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] font-mono text-white bg-black/80 px-1.5 py-0.5 rounded whitespace-nowrap transition">{d.count}</div>
                      </div>
                      <div className="text-[8px] text-white/30 font-mono whitespace-nowrap">{d.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                {/* Traffic origin */}
                <div className="glass-strong rounded-2xl p-5">
                  <div className="text-white font-semibold mb-4">Traffic Origin</div>
                  {analytics.origins.length === 0 && <div className="text-white/30 text-sm text-center py-8">No traffic data yet</div>}
                  {analytics.origins.map(([origin, count]) => {
                    const meta = ORIGIN_META[origin] || { icon: Link2, color: '#94A3B8', label: origin };
                    const Icon = meta.icon;
                    const pct = events.length ? (count / events.length) * 100 : 0;
                    return (
                      <div key={origin} className="mb-3 last:mb-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                            <span className="text-sm text-white/80">{meta.label}</span>
                          </div>
                          <span className="text-xs font-mono text-white/50">{count} · {pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Devices + top domains */}
                <div className="space-y-4">
                  <div className="glass-strong rounded-2xl p-5">
                    <div className="text-white font-semibold mb-4">Device Mix</div>
                    {analytics.devices.length === 0 && <div className="text-white/30 text-sm text-center py-4">No device data yet</div>}
                    <div className="flex items-center gap-4 flex-wrap">
                      {analytics.devices.map(([device, count]) => {
                        const meta = DEVICE_META[device] || { icon: Monitor, color: '#94A3B8' };
                        const Icon = meta.icon;
                        const pct = events.length ? (count / events.length) * 100 : 0;
                        return (
                          <div key={device} className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}30` }}>
                              <Icon className="w-4 h-4" style={{ color: meta.color }} />
                            </div>
                            <div>
                              <div className="text-white font-semibold tabular-nums">{pct.toFixed(0)}%</div>
                              <div className="text-[10px] text-white/40 font-mono uppercase">{device}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="glass-strong rounded-2xl p-5">
                    <div className="text-white font-semibold mb-4">Top Domains · by engagement</div>
                    {analytics.topDomains.length === 0 && <div className="text-white/30 text-sm text-center py-4">No engagement yet</div>}
                    {analytics.topDomains.map(([id, count]) => (
                      <div key={id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <span className="text-sm text-cyan-300 font-mono truncate">{domainName[id] || id.slice(0, 8)}</span>
                        <span className="text-xs font-mono text-white/50">{count} events</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ecosystem tab */}
          {tab === 'ecosystem' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/50">Manage the ecosystem systems shown on the homepage, hub, and /systems pages.</p>
                <button onClick={() => setEditingSystem({ accent: '#00D9FF', status: 'deployable', sort_order: 100 })}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold text-sm">
                  <Plus className="w-4 h-4" /> New System
                </button>
              </div>
              <div className="glass-strong rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-[10px] font-mono uppercase tracking-widest text-white/40">
                        <th className="px-5 py-3">System</th>
                        <th className="px-3 py-3">Category</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Featured</th>
                        <th className="px-3 py-3">Link</th>
                        <th className="px-3 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systems.map((s) => (
                        <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: s.accent }} />
                              <div>
                                <div className="text-white font-semibold">{s.name}</div>
                                <div className="text-xs text-white/40 font-mono">/systems/{s.slug}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3.5 text-white/60 text-xs">{s.category}</td>
                          <td className="px-3 py-3.5"><span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 text-white/60">{s.status}</span></td>
                          <td className="px-3 py-3.5 text-xs">{s.is_featured ? <span className="text-amber-300">★ featured</span> : <span className="text-white/30">—</span>}</td>
                          <td className="px-3 py-3.5">
                            {s.url ? <a href={s.url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300"><ExternalLink className="w-3.5 h-3.5" /></a> : <span className="text-white/20">—</span>}
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => generateSystemCoverRow(s)} disabled={genRowId !== null} title={s.image_url ? 'Regenerate AI cover' : 'Generate AI cover'} className={`p-1.5 rounded hover:bg-white/10 disabled:opacity-40 ${s.image_url ? 'text-cyan-300' : 'text-white/60 hover:text-cyan-400'}`}>
                                {genRowId === s.id ? <span className="block w-3.5 h-3.5 rounded-full border border-cyan-300/40 border-t-cyan-300 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => setEditingSystem({ ...s, ...{ capsText: (s.capabilities || []).join('\n'), metricsText: (s.metrics || []).map((m) => `${m.label} = ${m.value}`).join('\n') } } as Partial<EcosystemProduct>)} className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-cyan-400"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => removeSystem(s)} className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {systems.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-white/40">No systems yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Team / Access tab */}
          {tab === 'team' && (
            <div className="glass-strong rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <div className="text-white font-semibold">Access Registry · RBAC</div>
                </div>
                <span className="text-[10px] font-mono text-white/40">{users.length} identities</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-[10px] font-mono uppercase tracking-widest text-white/40">
                      <th className="px-5 py-3">Identity</th>
                      <th className="px-3 py-3">Role</th>
                      <th className="px-3 py-3">User ID</th>
                      <th className="px-3 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isAdminRole = u.role === 'admin';
                      const RoleIcon = isAdminRole ? Crown : u.role === 'operator' ? Fingerprint : Users;
                      return (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="px-5 py-3.5">
                            <div className="text-white">{u.full_name || u.email?.split('@')[0] || '—'}</div>
                            <div className="text-xs text-white/40">{u.email}</div>
                          </td>
                          <td className="px-3 py-3.5">
                            {u.user_id === user.id ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-300">
                                <RoleIcon className="w-3 h-3" /> {u.role} · you
                              </span>
                            ) : (
                              <select value={u.role} onChange={(e) => updateUserRole(u, e.target.value)}
                                className={`bg-white/5 border rounded px-2 py-1 text-[10px] font-mono uppercase focus:outline-none focus:border-cyan-400/50 ${
                                  isAdminRole ? 'border-amber-500/30 text-amber-300' : u.role === 'operator' ? 'border-cyan-500/30 text-cyan-300' : 'border-white/10 text-white/70'
                                }`}>
                                <option value="admin">admin</option>
                                <option value="operator">operator</option>
                                <option value="viewer">viewer</option>
                              </select>
                            )}
                          </td>
                          <td className="px-3 py-3.5 text-white/40 text-xs font-mono">{u.user_id.slice(0, 8)}…{u.user_id.slice(-4)}</td>
                          <td className="px-3 py-3.5 text-white/40 text-xs font-mono">{new Date(u.created_at).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                    {users.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-12 text-white/40">No identities provisioned</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-white/5 text-[11px] text-white/40 font-mono">
                Role changes are admin-only — enforced by row-level security + a BEFORE UPDATE trigger, and recorded to the immutable audit trail. Your own role is locked to prevent admin lockout.
              </div>
            </div>
          )}

          {/* Activity tab */}
          {tab === 'activity' && (
            <div className="glass-strong rounded-2xl p-2">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <div className="text-white font-semibold">Audit Telemetry · immutable action log</div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> STREAMING
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {audit.length === 0 && (
                  <div className="py-12 text-center text-white/30 text-sm">No audit entries · admin actions automatically logged here</div>
                )}
                {audit.map((a) => {
                  const meta = actionMeta[a.action] || { icon: FileText, color: '#94A3B8', label: a.action };
                  const Icon = meta.icon;
                  return (
                    <div key={a.id} className="px-4 py-3 hover:bg-white/[0.02] flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}40` }}>
                        <Icon className="w-4 h-4" style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-medium text-sm">{meta.label}</span>
                          {a.changes?.domain_name && <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[10px] font-mono">{a.changes.domain_name}</span>}
                          {a.changes?.email && <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px] font-mono">{a.changes.email}</span>}
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-white/50 text-[10px] font-mono">{a.action}</span>
                        </div>
                        <div className="text-[11px] text-white/40 mt-1 font-mono">
                          actor · <span className="text-white/60">{a.actor_email || 'system'}</span>
                          {a.changes?.before_price !== undefined && (
                            <span> · price ${a.changes.before_price?.toLocaleString?.() || a.changes.before_price} → ${a.changes.after_price?.toLocaleString?.() || a.changes.after_price}</span>
                          )}
                          {a.changes?.before && a.changes?.after && (
                            <span> · {a.changes.before} → {a.changes.after}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-[10px] text-white/40 font-mono shrink-0 text-right">
                        <div>{formatRelative(a.created_at)}</div>
                        <div className="text-white/30">{new Date(a.created_at).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Domain Editor Modal */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="glass-strong rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0A0E27]/95 backdrop-blur">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Domain Registry</div>
                <div className="text-white font-semibold text-lg">{editing.id ? 'Edit Domain' : 'Register New Domain'}</div>
              </div>
              <button onClick={() => setEditing(null)} aria-label="Close" className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Domain Name *</label>
                  <input value={editing.domain_name || ''} onChange={(e) => setEditing({ ...editing, domain_name: e.target.value })}
                    placeholder="example.ai" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Category</label>
                  <select value={editing.category || 'ai'} onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none">
                    <option value="ai">AI</option>
                    <option value="fintech">Fintech</option>
                    <option value="saas">SaaS</option>
                    <option value="infra">Infrastructure</option>
                    <option value="govtech">GovTech</option>
                    <option value="logistics">Logistics</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-white/50 font-medium mb-1.5 block">Tagline</label>
                <input value={editing.tagline || ''} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-white/50 font-medium mb-1.5 block">Description</label>
                <textarea rows={3} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block flex items-center gap-1.5"><ImageIcon className="w-3 h-3" /> Logo URL</label>
                  <input value={editing.logo_url || ''} onChange={(e) => setEditing({ ...editing, logo_url: e.target.value })}
                    placeholder="https://…/logo.svg" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:border-cyan-400/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block flex items-center gap-1.5"><ImageIcon className="w-3 h-3" /> Hero Image URL</label>
                  <div className="flex gap-2">
                    <input value={editing.hero_image_url || ''} onChange={(e) => setEditing({ ...editing, hero_image_url: e.target.value })}
                      placeholder="https://…/hero.jpg" className="flex-1 min-w-0 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:border-cyan-400/50 focus:outline-none" />
                    <button type="button" disabled={uploadingImage} onClick={generateDomainHero} title="Generate hero art from this domain's name & tagline" className="shrink-0 px-3 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50">
                      <Sparkles className="w-3.5 h-3.5" /> {uploadingImage ? '…' : 'Generate'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block flex items-center gap-1.5"><MessageCircle className="w-3 h-3" /> WhatsApp</label>
                  <input value={editing.whatsapp_number || ''} onChange={(e) => setEditing({ ...editing, whatsapp_number: e.target.value })}
                    placeholder="14155550123" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:border-cyan-400/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block flex items-center gap-1.5"><Mail className="w-3 h-3" /> Contact Email</label>
                  <input value={editing.contact_email || ''} onChange={(e) => setEditing({ ...editing, contact_email: e.target.value })}
                    placeholder="broker@domain.ai" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Price (USD)</label>
                  <input type="number" value={editing.price_usd || 0} onChange={(e) => setEditing({ ...editing, price_usd: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Valuation Score</label>
                  <input type="number" min={0} max={100} value={editing.valuation_score || 75} onChange={(e) => setEditing({ ...editing, valuation_score: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Status</label>
                  <select value={editing.status || 'active'} onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none">
                    <option value="active">Active</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Brand Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={editing.brand_color || '#00D9FF'} onChange={(e) => setEditing({ ...editing, brand_color: e.target.value })}
                      className="w-12 h-10 rounded-lg border border-white/10 bg-transparent" />
                    <input value={editing.brand_color || '#00D9FF'} onChange={(e) => setEditing({ ...editing, brand_color: e.target.value })}
                      className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:border-cyan-400/50 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Accent Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={editing.accent_color || '#7C3AED'} onChange={(e) => setEditing({ ...editing, accent_color: e.target.value })}
                      className="w-12 h-10 rounded-lg border border-white/10 bg-transparent" />
                    <input value={editing.accent_color || '#7C3AED'} onChange={(e) => setEditing({ ...editing, accent_color: e.target.value })}
                      className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:border-cyan-400/50 focus:outline-none" />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input type="checkbox" checked={editing.is_premium || false} onChange={(e) => setEditing({ ...editing, is_premium: e.target.checked })}
                    className="w-4 h-4 rounded accent-cyan-500" />
                  Premium tier
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input type="checkbox" checked={editing.is_featured || false} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded accent-cyan-500" />
                  Featured
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={saveDomain} className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> {editing.id ? 'Save Changes' : 'Register Domain'}
                </button>
                <button onClick={() => setEditing(null)} className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Editor Modal */}
      {editingSystem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setEditingSystem(null)}>
          <div onClick={(e) => e.stopPropagation()} className="glass-strong rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0A0E27]/95 backdrop-blur">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Ecosystem System</div>
                <div className="text-white font-semibold text-lg">{editingSystem.id ? 'Edit System' : 'New System'}</div>
              </div>
              <button onClick={() => setEditingSystem(null)} aria-label="Close" className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center"><X className="w-4 h-4 text-white/60" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Name *</label>
                  <input value={editingSystem.name || ''} onChange={(e) => setEditingSystem({ ...editingSystem, name: e.target.value })} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Slug * <span className="text-white/30">(/systems/…)</span></label>
                  <input value={editingSystem.slug || ''} onChange={(e) => setEditingSystem({ ...editingSystem, slug: e.target.value })} placeholder="veritas-os" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:border-cyan-400/50 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/50 font-medium mb-1.5 block">Category</label>
                <input value={editingSystem.category || ''} onChange={(e) => setEditingSystem({ ...editingSystem, category: e.target.value })} placeholder="Sovereign Government OS" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-white/50 font-medium mb-1.5 block">Tagline</label>
                <input value={editingSystem.tagline || ''} onChange={(e) => setEditingSystem({ ...editingSystem, tagline: e.target.value })} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-white/50 font-medium mb-1.5 block">Description</label>
                <textarea rows={2} value={editingSystem.description || ''} onChange={(e) => setEditingSystem({ ...editingSystem, description: e.target.value })} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block flex items-center gap-1.5"><ExternalLink className="w-3 h-3" /> Live URL</label>
                  <input value={editingSystem.url || ''} onChange={(e) => setEditingSystem({ ...editingSystem, url: e.target.value })} placeholder="https://…" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:border-cyan-400/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block flex items-center gap-1.5"><ImageIcon className="w-3 h-3" /> Cover image</label>
                  <div className="flex gap-2">
                    <input value={editingSystem.image_url || ''} onChange={(e) => setEditingSystem({ ...editingSystem, image_url: e.target.value })} placeholder="paste URL or upload →" className="flex-1 min-w-0 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:border-cyan-400/50 focus:outline-none" />
                    <label className={`shrink-0 px-3 py-2.5 rounded-lg border border-white/10 text-xs font-mono cursor-pointer flex items-center gap-1.5 ${uploadingImage ? 'opacity-50 pointer-events-none' : 'hover:bg-white/10 text-white/70'}`}>
                      {uploadingImage ? 'Working…' : 'Upload'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSystemImage(f); }} />
                    </label>
                    <button type="button" disabled={uploadingImage} onClick={generateSystemVisual} title="Generate cover art from this system's name & description" className="shrink-0 px-3 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50">
                      <Sparkles className="w-3.5 h-3.5" /> {uploadingImage ? '…' : 'Generate'}
                    </button>
                  </div>
                  {editingSystem.image_url && (
                    <img src={editingSystem.image_url} alt="" loading="lazy" decoding="async" className="mt-2 w-full h-20 object-cover rounded-lg border border-white/10" />
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs text-white/50 font-medium mb-1.5 block">Capabilities <span className="text-white/30">(one per line)</span></label>
                <textarea rows={4} value={(editingSystem as { capsText?: string }).capsText ?? (editingSystem.capabilities || []).join('\n')} onChange={(e) => setEditingSystem({ ...editingSystem, capsText: e.target.value } as Partial<EcosystemProduct>)} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none resize-none font-mono" />
              </div>
              <div>
                <label className="text-xs text-white/50 font-medium mb-1.5 block">Metrics <span className="text-white/30">(one per line · "Label = Value")</span></label>
                <textarea rows={3} value={(editingSystem as { metricsText?: string }).metricsText ?? (editingSystem.metrics || []).map((m) => `${m.label} = ${m.value}`).join('\n')} onChange={(e) => setEditingSystem({ ...editingSystem, metricsText: e.target.value } as Partial<EcosystemProduct>)} placeholder="Documents = 847.3M" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none resize-none font-mono" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Accent</label>
                  <div className="flex gap-2">
                    <input type="color" value={editingSystem.accent || '#00D9FF'} onChange={(e) => setEditingSystem({ ...editingSystem, accent: e.target.value })} className="w-12 h-10 rounded-lg border border-white/10 bg-transparent" />
                    <input value={editingSystem.accent || '#00D9FF'} onChange={(e) => setEditingSystem({ ...editingSystem, accent: e.target.value })} className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:border-cyan-400/50 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Status</label>
                  <select value={editingSystem.status || 'deployable'} onChange={(e) => setEditingSystem({ ...editingSystem, status: e.target.value })} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none">
                    <option value="deployable">Deployable</option>
                    <option value="preview">Preview</option>
                    <option value="planned">Planned</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Sort order</label>
                  <input type="number" value={editingSystem.sort_order ?? 100} onChange={(e) => setEditingSystem({ ...editingSystem, sort_order: Number(e.target.value) })} className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                <input type="checkbox" checked={editingSystem.is_featured || false} onChange={(e) => setEditingSystem({ ...editingSystem, is_featured: e.target.checked })} className="w-4 h-4 rounded accent-cyan-500" />
                Featured (large card)
              </label>
              <div className="flex gap-2 pt-2">
                <button onClick={saveSystem} className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {editingSystem.id ? 'Save Changes' : 'Add System'}</button>
                <button onClick={() => setEditingSystem(null)} className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Narrative editor */}
      {editNar && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setEditNar(null)} />
          <div className="relative w-full max-w-2xl my-10 glass-strong rounded-2xl p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl font-bold text-white">{editNar.id ? 'Edit dispatch' : 'New dispatch'}</h3>
              <button onClick={() => setEditNar(null)} aria-label="Close" className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select value={editNar.kind || 'dispatch'} onChange={(e) => setEditNar({ ...editNar, kind: e.target.value })} aria-label="Kind" className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white">
                  {['dispatch', 'manifesto', 'whitepaper', 'ad_script'].map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <select value={editNar.media_class || ''} onChange={(e) => setEditNar({ ...editNar, media_class: e.target.value || null })} aria-label="Class" className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white">
                  <option value="">— class —</option>{['cinematic', 'operational', 'strategic', 'crisis'].map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <input value={editNar.title || ''} onChange={(e) => setEditNar({ ...editNar, title: e.target.value })} placeholder="Title" className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30" />
              <input value={editNar.subtitle || ''} onChange={(e) => setEditNar({ ...editNar, subtitle: e.target.value })} placeholder="Subtitle" className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30" />
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-cyan-300/80"><Sparkles className="w-3.5 h-3.5" /> AI narrative engine</div>
                <textarea value={genBrief} onChange={(e) => setGenBrief(e.target.value)} placeholder="Brief the engine — subject, angle, tension, the point it must land…" rows={2} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 resize-none" />
                <button type="button" disabled={generating} onClick={() => generateContent(editNar.kind === 'ad_script' ? 'script' : 'dispatch', editNar.media_class || null, (t) => setEditNar((p) => ({ ...p, body: t })))} className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50">
                  <Sparkles className="w-3.5 h-3.5" /> {generating ? 'Drafting…' : 'Generate draft'}
                </button>
              </div>
              <textarea value={editNar.body || ''} onChange={(e) => setEditNar({ ...editNar, body: e.target.value })} placeholder="Body (line breaks preserved)" rows={10} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 font-mono leading-relaxed" />
              <div>
                <label className="text-xs text-white/50 font-medium mb-1.5 block flex items-center gap-1.5"><ImageIcon className="w-3 h-3" /> Cover image</label>
                <div className="flex gap-2">
                  <input value={editNar.cover_image_url || ''} onChange={(e) => setEditNar({ ...editNar, cover_image_url: e.target.value || null })} placeholder="paste URL or generate →" className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white font-mono placeholder:text-white/30" />
                  <button type="button" disabled={generating} onClick={generateNarrativeCover} title="Generate cover art from this dispatch's title" className="shrink-0 px-3 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50">
                    <Sparkles className="w-3.5 h-3.5" /> {generating ? '…' : 'Generate'}
                  </button>
                </div>
                {editNar.cover_image_url && <img src={editNar.cover_image_url} alt="" loading="lazy" decoding="async" className="mt-2 w-full h-24 object-cover rounded-lg border border-white/10" />}
              </div>
              <div className="flex items-center gap-4">
                <input value={editNar.read_time || ''} onChange={(e) => setEditNar({ ...editNar, read_time: e.target.value })} placeholder="Read time (e.g. 3 min)" className="flex-1 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30" />
                <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={editNar.published ?? true} onChange={(e) => setEditNar({ ...editNar, published: e.target.checked })} /> Published</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditNar(null)} className="px-4 py-2.5 rounded-lg glass text-white/70 text-sm">Cancel</button>
              <button onClick={saveNarrative} className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold inline-flex items-center gap-1.5"><Save className="w-4 h-4" /> Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign editor */}
      {editCamp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setEditCamp(null)} />
          <div className="relative w-full max-w-lg glass-strong rounded-2xl p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl font-bold text-white">{editCamp.id ? 'Edit campaign' : 'New campaign'}</h3>
              <button onClick={() => setEditCamp(null)} aria-label="Close" className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={editCamp.name || ''} onChange={(e) => setEditCamp({ ...editCamp, name: e.target.value })} placeholder="Campaign name" className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30" />
              <div className="grid grid-cols-2 gap-3">
                <select value={editCamp.channel || 'executive'} onChange={(e) => setEditCamp({ ...editCamp, channel: e.target.value })} aria-label="Channel" className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white">
                  {['executive', 'linkedin', 'youtube', 'public'].map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <select value={editCamp.status || 'draft'} onChange={(e) => setEditCamp({ ...editCamp, status: e.target.value })} aria-label="Status" className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white">
                  {['draft', 'scheduled', 'live', 'archived'].map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={editCamp.media_class || ''} onChange={(e) => setEditCamp({ ...editCamp, media_class: e.target.value || null })} aria-label="Class" className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white">
                  <option value="">— class —</option>{['cinematic', 'operational', 'strategic', 'crisis'].map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <input type="date" value={editCamp.scheduled_at ? editCamp.scheduled_at.slice(0, 10) : ''} onChange={(e) => setEditCamp({ ...editCamp, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null })} aria-label="Scheduled" className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white" />
              </div>
              <textarea value={editCamp.asset_ref || ''} onChange={(e) => setEditCamp({ ...editCamp, asset_ref: e.target.value })} placeholder="Asset reference / copy (film, dispatch, ad copy)" rows={3} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 resize-none" />
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-cyan-300/80"><Sparkles className="w-3.5 h-3.5" /> AI campaign copy</div>
                <textarea value={genBrief} onChange={(e) => setGenBrief(e.target.value)} placeholder="Brief the engine — offering, audience, the action you want…" rows={2} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 resize-none" />
                <button type="button" disabled={generating} onClick={() => generateContent('campaign', editCamp.media_class || null, (t) => setEditCamp((p) => ({ ...p, asset_ref: t })))} className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50">
                  <Sparkles className="w-3.5 h-3.5" /> {generating ? 'Drafting…' : 'Generate copy'}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditCamp(null)} className="px-4 py-2.5 rounded-lg glass text-white/70 text-sm">Cancel</button>
              <button onClick={saveCampaign} className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold inline-flex items-center gap-1.5"><Save className="w-4 h-4" /> Save</button>
            </div>
          </div>
        </div>
      )}

      <PlatformFooter />
    </div>
  );
};

export default AdminPage;
