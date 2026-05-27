import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

// Per-owner enqueue throttle: max mutations queued per rolling minute.
const ENQUEUE_LIMIT_PER_MIN = 30;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Resolve the caller from their JWT.
  const authz = req.headers.get('Authorization') || '';
  const jwt = authz.replace(/^Bearer\s+/i, '');
  const { data: userData } = await admin.auth.getUser(jwt);
  const user = userData?.user;
  if (!user) return json({ error: 'Unauthorized' }, 401);
  const owner = user.id;

  const enqueue = async (action: string, payload: Record<string, unknown>) => {
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count } = await admin.from('dns_jobs').select('id', { count: 'exact', head: true }).eq('owner', owner).gte('created_at', since);
    if ((count ?? 0) >= ENQUEUE_LIMIT_PER_MIN) throw new Error('Rate limit exceeded — too many DNS operations queued. Try again shortly.');
    const { data, error } = await admin.from('dns_jobs').insert({ owner, action, payload }).select('id').single();
    if (error) throw error;
    return data.id as string;
  };

  try {
    // ── Reads (synchronous, owner-scoped) ──
    if (req.method === 'GET') {
      const action = new URL(req.url).searchParams.get('action');
      const zoneId = new URL(req.url).searchParams.get('zone_id');
      if (action === 'list-nameservers') return json({ nameservers: (await admin.from('nameservers').select('*').eq('owner', owner).order('created_at', { ascending: false })).data ?? [] });
      if (action === 'list-zones') return json({ zones: (await admin.from('dns_zones').select('*').eq('owner', owner).order('created_at', { ascending: false })).data ?? [] });
      if (action === 'list-records' && zoneId) return json({ records: (await admin.from('dns_records').select('*').eq('owner', owner).eq('zone_id', zoneId)).data ?? [] });
      if (action === 'jobs') return json({ jobs: (await admin.from('dns_jobs').select('id, action, status, attempts, error, created_at, updated_at').eq('owner', owner).order('created_at', { ascending: false }).limit(50)).data ?? [] });
      return json({ error: 'Unknown read action' }, 400);
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    switch (action) {
      case 'create-nameserver': {
        if (!body.name) return json({ error: 'name is required' }, 400);
        const { data: ns, error } = await admin.from('nameservers').insert({ owner, name: body.name, ip: body.ip ?? null, ip6: body.ip6 ?? null, status: 'pending' }).select('id').single();
        if (error) return json({ error: error.message }, 400);
        const job_id = await enqueue('nameserver.create', { ns_id: ns.id, name: body.name, ip: body.ip, ip6: body.ip6 });
        return json({ nameserver_id: ns.id, job_id });
      }
      case 'update-nameservers': {
        if (!body.id) return json({ error: 'nameserver id is required' }, 400);
        const { data: ns } = await admin.from('nameservers').select('*').eq('id', body.id).eq('owner', owner).maybeSingle();
        if (!ns) return json({ error: 'Nameserver not found' }, 404);
        await admin.from('nameservers').update({ ip: body.ip ?? ns.ip, ip6: body.ip6 ?? ns.ip6, status: 'pending', updated_at: new Date().toISOString() }).eq('id', ns.id);
        const job_id = await enqueue('nameserver.update', { ns_id: ns.id, op_id: ns.op_id, name: ns.name, ip: body.ip ?? ns.ip, ip6: body.ip6 ?? ns.ip6 });
        return json({ nameserver_id: ns.id, job_id });
      }
      case 'create-zone': {
        if (!body.name) return json({ error: 'zone name is required' }, 400);
        const { data: zone, error } = await admin.from('dns_zones').insert({ owner, name: body.name, type: body.type || 'master', status: 'pending' }).select('id').single();
        if (error) return json({ error: error.message }, 400);
        const job_id = await enqueue('zone.create', { zone_id: zone.id, name: body.name, type: body.type || 'master', records: body.records || [] });
        return json({ zone_id: zone.id, job_id });
      }
      case 'modify-records': {
        const zoneId = body.zone_id as string | undefined;
        if (!zoneId) return json({ error: 'zone_id is required' }, 400);
        const { data: zone } = await admin.from('dns_zones').select('*').eq('id', zoneId).eq('owner', owner).maybeSingle();
        if (!zone) return json({ error: 'Zone not found' }, 404);
        const job_id = await enqueue('records.modify', { zone_id: zone.id, name: zone.name, add: body.add || [], remove: body.remove || [], update: body.update || [] });
        return json({ zone_id: zone.id, job_id });
      }
      case 'delete-zone': {
        const zoneId = body.zone_id as string | undefined;
        if (!zoneId) return json({ error: 'zone_id is required' }, 400);
        const { data: zone } = await admin.from('dns_zones').select('*').eq('id', zoneId).eq('owner', owner).maybeSingle();
        if (!zone) return json({ error: 'Zone not found' }, 404);
        await admin.from('dns_zones').update({ status: 'deleting', updated_at: new Date().toISOString() }).eq('id', zone.id);
        const job_id = await enqueue('zone.delete', { zone_id: zone.id, name: zone.name });
        return json({ zone_id: zone.id, job_id });
      }
      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e) {
    const msg = (e as Error).message;
    return json({ error: msg }, msg.includes('Rate limit') ? 429 : 500);
  }
});
