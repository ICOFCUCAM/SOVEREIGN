import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Domain, Lead, AnalyticsEvent, UserRoleRow } from '@/lib/types';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { logAudit, fetchRecentAuditLogs, AuditLogEntry } from '@/lib/audit';
import { toast } from 'sonner';
import type { LucideIcon } from 'lucide-react';
import {
  Plus, Edit2, Trash2, Eye, Globe, Users, DollarSign, TrendingUp, X, Save, Activity, Lock,
  ShieldAlert, LogIn, FileText, Pencil, PlusCircle, Trash, BarChart3, Monitor, Smartphone, Tablet,
  Radio, Search, Share2, Link2, Mail, Image as ImageIcon, MessageCircle, Crown, ShieldCheck, Fingerprint,
} from 'lucide-react';

type Tab = 'overview' | 'domains' | 'leads' | 'analytics' | 'team' | 'activity';
type LeadFilter = 'all' | 'inquiry' | 'offer' | 'buy_now';

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
  const { user, role, isAdmin, loading: authLoading } = useAuth();
  const [authModal, setAuthModal] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [users, setUsers] = useState<UserRoleRow[]>([]);
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
    setDomains((d.data || []) as Domain[]);
    setLeads((l.data || []) as Lead[]);
    setEvents((ev.data || []) as AnalyticsEvent[]);
    setUsers((u.data || []) as UserRoleRow[]);
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

  const actionMeta: Record<string, { icon: LucideIcon; color: string; label: string }> = {
    'domain.create': { icon: PlusCircle, color: '#10B981', label: 'Created domain' },
    'domain.update': { icon: Pencil, color: '#00D9FF', label: 'Updated domain' },
    'domain.delete': { icon: Trash, color: '#EF4444', label: 'Archived domain' },
    'lead.update': { icon: Users, color: '#7C3AED', label: 'Updated lead' },
    'role.update': { icon: ShieldAlert, color: '#F59E0B', label: 'Changed role' },
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
              <h1 className="text-4xl font-bold tracking-tight">Operational Console</h1>
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
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                            <select value={l.status} onChange={(e) => updateLeadStatus(l.id, e.target.value)}
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
              <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center">
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
                  <input value={editing.hero_image_url || ''} onChange={(e) => setEditing({ ...editing, hero_image_url: e.target.value })}
                    placeholder="https://…/hero.jpg" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:border-cyan-400/50 focus:outline-none" />
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

      <PlatformFooter />
    </div>
  );
};

export default AdminPage;
