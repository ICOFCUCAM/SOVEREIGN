export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// ── Deterministic scoring kernel — the "AI Domain Intelligence Engine" ──
function analyzeDomain(domain: string) {
  const lower = domain.toLowerCase().trim();
  const [name, ...tldParts] = lower.split('.');
  const tld = '.' + tldParts.join('.');

  const len = name.length;
  let lengthScore = 100 - Math.abs(7 - len) * 8;
  lengthScore = Math.max(40, Math.min(100, lengthScore));

  const vowels = (name.match(/[aeiou]/g) || []).length;
  const vowelRatio = vowels / Math.max(1, name.length);
  const readability = Math.round(60 + (1 - Math.abs(0.4 - vowelRatio)) * 40);

  const hyphenPenalty = (name.match(/-/g) || []).length * 15;
  const numberPenalty = (name.match(/\d/g) || []).length * 10;

  const tldScores: Record<string, number> = {
    '.ai': 96, '.io': 88, '.com': 92, '.cloud': 86, '.app': 84,
    '.dev': 82, '.tech': 78, '.co': 80, '.xyz': 65, '.net': 72
  };
  const tldStrength = tldScores[tld] || 60;

  const aiKeywords = ['ai','neural','quantum','agent','mesh','grid','cloud','data','crypto','pay','bank','ledger','sovereign','intel','ops','forge','vault','axiom','cipher','orbital','zenith','core','hub','net'];
  const matchedKeywords = aiKeywords.filter(k => name.includes(k));
  const keywordPower = Math.min(100, 60 + matchedKeywords.length * 18);

  const brandStrength = Math.round(
    (lengthScore * 0.25 + readability * 0.25 + tldStrength * 0.3 + keywordPower * 0.2) - hyphenPenalty - numberPenalty
  );

  const memorability = Math.max(40, Math.min(100, Math.round(lengthScore * 0.6 + readability * 0.4)));
  const seoPotential = Math.max(50, Math.min(100, Math.round(keywordPower * 0.7 + tldStrength * 0.3)));
  const aiRelevance = matchedKeywords.some(k => ['ai','neural','agent','quantum','intel'].includes(k)) || tld === '.ai' ? Math.min(100, 80 + matchedKeywords.length * 5) : 55 + matchedKeywords.length * 4;
  const marketAlignment = Math.min(100, Math.round(70 + keywordPower * 0.25));
  const startupViability = Math.round((brandStrength + memorability + seoPotential) / 3);
  const sovereignPotential = matchedKeywords.some(k => ['sovereign','gov','mesh','grid','ledger','infra','cloud'].includes(k)) ? 85 + Math.min(15, matchedKeywords.length * 3) : Math.round(brandStrength * 0.7);

  // Phase 2 subscores.
  const trendKeywords = ['ai','neural','agent','quantum','sovereign','mesh','cloud','data','ledger'];
  const trendHits = matchedKeywords.filter(k => trendKeywords.includes(k)).length;
  const marketTrendAlignment = Math.min(100, Math.round(62 + trendHits * 9 + (tld === '.ai' ? 8 : 0)));
  const enterpriseKeywords = ['enterprise','infra','grid','mesh','core','ops','vault','ledger','sovereign','gov','bank'];
  const enterpriseHits = matchedKeywords.filter(k => enterpriseKeywords.includes(k)).length;
  const enterpriseSuitability = Math.min(100, Math.round(58 + enterpriseHits * 10 + (['.com', '.ai', '.io', '.cloud'].includes(tld) ? 12 : 0) - hyphenPenalty));

  const overallScore = Math.round(
    brandStrength * 0.18 + memorability * 0.13 + seoPotential * 0.13 +
    aiRelevance * 0.14 + marketAlignment * 0.1 + startupViability * 0.12 +
    sovereignPotential * 0.08 + marketTrendAlignment * 0.06 + enterpriseSuitability * 0.06
  );

  const tldMultiplier: Record<string, number> = {
    '.ai': 1.6, '.io': 1.2, '.com': 1.8, '.cloud': 1.4, '.app': 1.1,
    '.dev': 1.0, '.tech': 0.9, '.co': 1.0, '.xyz': 0.6, '.net': 0.8
  };
  const baseValue = Math.pow(overallScore / 50, 3.2) * 1500;
  const adjustedValue = baseValue * (tldMultiplier[tld] || 0.7);
  const estLow = Math.round(adjustedValue * 0.65 / 1000) * 1000;
  const estHigh = Math.round(adjustedValue * 1.45 / 1000) * 1000;

  let industry = 'General Technology';
  if (matchedKeywords.some(k => ['pay','bank','ledger','crypto','cipher'].includes(k))) industry = 'Fintech & Digital Banking';
  else if (matchedKeywords.some(k => ['ai','neural','agent','intel'].includes(k))) industry = 'Artificial Intelligence';
  else if (matchedKeywords.some(k => ['cloud','grid','mesh','infra','sovereign'].includes(k))) industry = 'Sovereign Infrastructure';
  else if (matchedKeywords.some(k => ['data','axiom','quantum'].includes(k))) industry = 'Data & Analytics';
  else if (matchedKeywords.some(k => ['orbital','ops','forge'].includes(k))) industry = 'Operations & Aerospace';

  return {
    overall_score: Math.min(100, Math.max(30, overallScore)),
    brand_strength: Math.min(100, Math.max(30, brandStrength)),
    memorability,
    seo_potential: seoPotential,
    ai_relevance: aiRelevance,
    market_alignment: marketAlignment,
    startup_viability: startupViability,
    sovereign_potential: sovereignPotential,
    market_trend_alignment: marketTrendAlignment,
    enterprise_suitability: enterpriseSuitability,
    estimated_value_low: estLow,
    estimated_value_high: estHigh,
    industry_category: industry,
    keywords: matchedKeywords,
    confidence_score: Math.min(95, 70 + matchedKeywords.length * 3),
    tld_strength: tldStrength,
    length_score: lengthScore
  };
}

// ── Deterministic auto-branding kernel — Module 2 ──
// Generates a full brand package derived from the analysis. Works with zero
// external dependencies; the LLM path (below) enriches the prose when available.
function generateBrand(domain: string, a: ReturnType<typeof analyzeDomain>) {
  const root = domain.split('.')[0];
  const tld = '.' + domain.split('.').slice(1).join('.');
  const Name = root.charAt(0).toUpperCase() + root.slice(1);
  const initials = root.replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase();
  const industry = a.industry_category;

  const palettes: Record<string, { primary: string; accent: string; neutral: string }> = {
    'Artificial Intelligence': { primary: '#00D9FF', accent: '#7C3AED', neutral: '#0A0E27' },
    'Fintech & Digital Banking': { primary: '#10B981', accent: '#00D9FF', neutral: '#06101A' },
    'Sovereign Infrastructure': { primary: '#6366F1', accent: '#00D9FF', neutral: '#070A1F' },
    'Data & Analytics': { primary: '#F59E0B', accent: '#EF4444', neutral: '#120B06' },
    'Operations & Aerospace': { primary: '#EF4444', accent: '#F59E0B', neutral: '#160808' },
    'General Technology': { primary: '#00D9FF', accent: '#7C3AED', neutral: '#0A0E27' },
  };
  const palette = palettes[industry] || palettes['General Technology'];

  const tones: Record<string, string> = {
    'Artificial Intelligence': 'Visionary · Precise · Frontier',
    'Fintech & Digital Banking': 'Bold · Trustworthy · Velocity',
    'Sovereign Infrastructure': 'Authoritative · Institutional · Resilient',
    'Data & Analytics': 'Analytical · Sharp · Insightful',
    'Operations & Aerospace': 'Mission-grade · Decisive · Kinetic',
    'General Technology': 'Modern · Confident · Clean',
  };
  const brandTone = tones[industry] || tones['General Technology'];

  const motifs: Record<string, string> = {
    'Artificial Intelligence': `Monogram "${initials}" as a neural node radiating synaptic edges`,
    'Fintech & Digital Banking': `Monogram "${initials}" with an ascending chevron denoting yield`,
    'Sovereign Infrastructure': `Monogram "${initials}" set inside a hexagonal mesh shield`,
    'Data & Analytics': `Monogram "${initials}" refracted through a data prism`,
    'Operations & Aerospace': `Monogram "${initials}" orbited by a kinetic ring`,
    'General Technology': `Monogram "${initials}" within a rounded gradient sigil`,
  };
  const logoConcept = motifs[industry] || motifs['General Technology'];

  const typographyDirection = a.overall_score >= 88
    ? 'Geometric grotesk display (Space Grotesk) paired with monospace data labels (JetBrains Mono)'
    : 'Clean humanist sans (Inter) with tight tracking and mono numerals';

  const uiStyle = 'Dark sovereign glassmorphism — gradient mesh field, tabular telemetry, motion-driven intelligence panels';

  const monetizationByIndustry: Record<string, Array<{ model: string; description: string }>> = {
    'Artificial Intelligence': [
      { model: 'Usage-based API', description: 'Metered inference + per-token billing for the core model layer.' },
      { model: 'Enterprise licensing', description: 'Private deployments and SLA-backed seats for institutions.' },
      { model: 'Model marketplace', description: 'Take-rate on third-party models and agents listed on the network.' },
    ],
    'Fintech & Digital Banking': [
      { model: 'Interchange + spread', description: 'Revenue on payment rails and treasury float.' },
      { model: 'SaaS tiers', description: 'Seat-based dashboards for finance and ops teams.' },
      { model: 'Embedded finance', description: 'API fees for BaaS / payouts embedded by partners.' },
    ],
    'Sovereign Infrastructure': [
      { model: 'Infrastructure contracts', description: 'Multi-year capacity + coordination agreements with institutions.' },
      { model: 'Per-node licensing', description: 'Metered licensing across the deployed mesh.' },
      { model: 'Compliance & support', description: 'Sovereign-grade SLAs, residency, and audit tooling.' },
    ],
    'Data & Analytics': [
      { model: 'Consumption pricing', description: 'Billing on queries, pipelines, and stored intelligence.' },
      { model: 'Insight subscriptions', description: 'Premium dashboards and benchmark feeds.' },
      { model: 'Data partnerships', description: 'Revenue share on syndicated, privacy-safe datasets.' },
    ],
    'Operations & Aerospace': [
      { model: 'Platform licensing', description: 'Per-fleet / per-mission operational seats.' },
      { model: 'Telemetry tiers', description: 'Real-time monitoring and predictive maintenance plans.' },
      { model: 'Integration services', description: 'Onboarding and bespoke systems integration.' },
    ],
    'General Technology': [
      { model: 'SaaS subscriptions', description: 'Tiered monthly plans for teams and enterprises.' },
      { model: 'Usage add-ons', description: 'Metered premium capabilities on top of base tiers.' },
      { model: 'Marketplace', description: 'Take-rate on an ecosystem of integrations.' },
    ],
  };
  const monetization = monetizationByIndustry[industry] || monetizationByIndustry['General Technology'];

  const marketPositioning =
    `${Name} is positioned at the intersection of ${industry.toLowerCase()} and ${a.sovereign_potential >= 80 ? 'sovereign-grade infrastructure' : 'AI-native software'}. ` +
    `With premium ${tld.toUpperCase()} authority and a ${a.overall_score}/100 intelligence score, it claims a defensible, category-leading position for institutional and venture-scale buyers.`;

  const elevatorPitch =
    `${Name} is the ${industry.toLowerCase()} layer for the next decade of digital infrastructure. ` +
    `It turns a premium ${tld.toUpperCase()} asset into a deployable, monetizable platform — engineered for trust, scale, and AI-native operations from day one.`;

  const investorNarrative =
    `For investors, ${domain} represents ${a.overall_score >= 90 ? 'a category-defining' : a.overall_score >= 78 ? 'a high-conviction' : 'an opportunistic'} entry into the ${industry.toLowerCase()} market. ` +
    `Estimated brand value of $${(a.estimated_value_low / 1000).toFixed(0)}k–$${(a.estimated_value_high / 1000).toFixed(0)}k, ${a.confidence_score}% model confidence, and ${a.market_trend_alignment}/100 trend alignment make it a strategic acquisition with strong optionality across SaaS, licensing, and infrastructure plays.`;

  const landingCopy = {
    headline: `The ${industry.split(' ')[0]} layer, deployed.`,
    subhead: `${Name} gives institutions and founders a sovereign-grade ${industry.toLowerCase()} platform — intelligent, secure, and ready to scale.`,
    cta: `Acquire ${domain}`,
  };

  return {
    brand_tone: brandTone,
    typography_direction: typographyDirection,
    ui_style: uiStyle,
    logo_concept: logoConcept,
    brand_palette: palette,
    market_positioning: marketPositioning,
    monetization,
    investor_narrative: investorNarrative,
    elevator_pitch: elevatorPitch,
    landing_copy: landingCopy,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { domain } = await req.json();
    if (!domain) throw new Error('domain is required');

    const analysis = analyzeDomain(domain);
    const brand = generateBrand(domain, analysis);
    const gatewayApiKey = Deno.env.get("GATEWAY_API_KEY");

    let narrative = '';
    let slogan = '';
    let startup_concepts: any[] = [];
    // LLM-enrichable brand prose (falls back to deterministic generateBrand output).
    let market_positioning = brand.market_positioning;
    let investor_narrative = brand.investor_narrative;
    let elevator_pitch = brand.elevator_pitch;
    let landing_copy = brand.landing_copy;

    if (gatewayApiKey) {
      try {
        const prompt = `You are an elite domain intelligence + branding analyst. Analyze "${domain}" (overall score ${analysis.overall_score}/100, industry: ${analysis.industry_category}, est. value $${analysis.estimated_value_low.toLocaleString()}-$${analysis.estimated_value_high.toLocaleString()}, brand tone: ${brand.brand_tone}).

Return STRICT JSON only (no markdown, no commentary):
{
  "narrative": "2-3 sentence elite valuation narrative emphasizing sovereign, AI-native, or institutional positioning",
  "slogan": "one premium tagline, max 6 words",
  "market_positioning": "2 sentence strategic market-positioning statement",
  "investor_narrative": "2-3 sentence investor-grade narrative on attractiveness and optionality",
  "elevator_pitch": "2 sentence elevator pitch as if pitching the company",
  "landing_copy": { "headline": "max 6 words", "subhead": "1 sentence", "cta": "max 4 words" },
  "startup_concepts": [
    {"title":"...","description":"1 sentence","category":"SaaS|AI|Fintech|Infra|GovTech"},
    {"title":"...","description":"1 sentence","category":"..."},
    {"title":"...","description":"1 sentence","category":"..."}
  ]
}`;

        const aiResp = await fetch('https://ai.gateway.fastrouter.io/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': gatewayApiKey },
          body: JSON.stringify({
            model: 'google/gemini-3-flash',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8
          })
        });
        const aiData = await aiResp.json();
        const content = aiData?.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          narrative = parsed.narrative || '';
          slogan = parsed.slogan || '';
          startup_concepts = parsed.startup_concepts || [];
          if (parsed.market_positioning) market_positioning = parsed.market_positioning;
          if (parsed.investor_narrative) investor_narrative = parsed.investor_narrative;
          if (parsed.elevator_pitch) elevator_pitch = parsed.elevator_pitch;
          if (parsed.landing_copy?.headline) landing_copy = parsed.landing_copy;
        }
      } catch (e) {
        console.log('AI enrichment fallback:', e);
      }
    }

    if (!narrative) {
      narrative = `${domain} demonstrates exceptional positioning in ${analysis.industry_category.toLowerCase()} with a sovereign-grade brand profile. With an overall intelligence score of ${analysis.overall_score}/100 and premium ${domain.split('.').slice(-1)[0].toUpperCase()} extension authority, this asset is engineered for institutional-scale ventures and AI-native infrastructure plays.`;
    }
    if (!slogan) slogan = 'Sovereign intelligence, deployed.';
    if (startup_concepts.length === 0) {
      startup_concepts = [
        { title: `${domain.split('.')[0]} Cloud`, description: `Sovereign deployment infrastructure for ${analysis.industry_category}.`, category: 'Infra' },
        { title: `${domain.split('.')[0]} Intelligence`, description: `AI-native operational layer for institutional ${analysis.industry_category.toLowerCase()}.`, category: 'AI' },
        { title: `${domain.split('.')[0]} Network`, description: `Multi-tenant orchestration network for global ${analysis.industry_category.toLowerCase()} workloads.`, category: 'SaaS' }
      ];
    }

    return new Response(JSON.stringify({
      ...analysis,
      narrative,
      slogan,
      startup_concepts,
      // Brand package (Module 2)
      brand_tone: brand.brand_tone,
      typography_direction: brand.typography_direction,
      ui_style: brand.ui_style,
      logo_concept: brand.logo_concept,
      brand_palette: brand.brand_palette,
      monetization: brand.monetization,
      market_positioning,
      investor_narrative,
      elevator_pitch,
      landing_copy,
      model_used: gatewayApiKey ? 'gemini-3-flash+kernel-v3' : 'kernel-v3-deterministic'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
