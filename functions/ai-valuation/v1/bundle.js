export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Deterministic scoring kernel - the "AI Domain Intelligence Engine"
function analyzeDomain(domain: string) {
  const lower = domain.toLowerCase().trim();
  const [name, ...tldParts] = lower.split('.');
  const tld = '.' + tldParts.join('.');

  // Length scoring (sweet spot 5-9 chars)
  const len = name.length;
  let lengthScore = 100 - Math.abs(7 - len) * 8;
  lengthScore = Math.max(40, Math.min(100, lengthScore));

  // Vowel/consonant ratio for readability
  const vowels = (name.match(/[aeiou]/g) || []).length;
  const vowelRatio = vowels / Math.max(1, name.length);
  const readability = Math.round(60 + (1 - Math.abs(0.4 - vowelRatio)) * 40);

  // Hyphen/number penalty
  const hyphenPenalty = (name.match(/-/g) || []).length * 15;
  const numberPenalty = (name.match(/\d/g) || []).length * 10;

  // TLD strength
  const tldScores: Record<string, number> = {
    '.ai': 96, '.io': 88, '.com': 92, '.cloud': 86, '.app': 84,
    '.dev': 82, '.tech': 78, '.co': 80, '.xyz': 65, '.net': 72
  };
  const tldStrength = tldScores[tld] || 60;

  // AI/Tech keyword detection
  const aiKeywords = ['ai','neural','quantum','agent','mesh','grid','cloud','data','crypto','pay','bank','ledger','sovereign','intel','ops','forge','vault','axiom','cipher','orbital','zenith','core','hub','net'];
  const matchedKeywords = aiKeywords.filter(k => name.includes(k));
  const keywordPower = Math.min(100, 60 + matchedKeywords.length * 18);

  // Brand strength composite
  const brandStrength = Math.round(
    (lengthScore * 0.25 + readability * 0.25 + tldStrength * 0.3 + keywordPower * 0.2) - hyphenPenalty - numberPenalty
  );

  // Subscores
  const memorability = Math.max(40, Math.min(100, Math.round(lengthScore * 0.6 + readability * 0.4)));
  const seoPotential = Math.max(50, Math.min(100, Math.round(keywordPower * 0.7 + tldStrength * 0.3)));
  const aiRelevance = matchedKeywords.some(k => ['ai','neural','agent','quantum','intel'].includes(k)) || tld === '.ai' ? Math.min(100, 80 + matchedKeywords.length * 5) : 55 + matchedKeywords.length * 4;
  const marketAlignment = Math.min(100, Math.round(70 + keywordPower * 0.25));
  const startupViability = Math.round((brandStrength + memorability + seoPotential) / 3);
  const sovereignPotential = matchedKeywords.some(k => ['sovereign','gov','mesh','grid','ledger','infra','cloud'].includes(k)) ? 85 + Math.min(15, matchedKeywords.length * 3) : Math.round(brandStrength * 0.7);

  const overallScore = Math.round(
    brandStrength * 0.2 + memorability * 0.15 + seoPotential * 0.15 +
    aiRelevance * 0.15 + marketAlignment * 0.1 + startupViability * 0.15 + sovereignPotential * 0.1
  );

  // Valuation modeling (heuristic + market comparable)
  const tldMultiplier: Record<string, number> = {
    '.ai': 1.6, '.io': 1.2, '.com': 1.8, '.cloud': 1.4, '.app': 1.1,
    '.dev': 1.0, '.tech': 0.9, '.co': 1.0, '.xyz': 0.6, '.net': 0.8
  };
  const baseValue = Math.pow(overallScore / 50, 3.2) * 1500;
  const adjustedValue = baseValue * (tldMultiplier[tld] || 0.7);
  const estLow = Math.round(adjustedValue * 0.65 / 1000) * 1000;
  const estHigh = Math.round(adjustedValue * 1.45 / 1000) * 1000;

  // Industry classification
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
    estimated_value_low: estLow,
    estimated_value_high: estHigh,
    industry_category: industry,
    keywords: matchedKeywords,
    confidence_score: Math.min(95, 70 + matchedKeywords.length * 3),
    tld_strength: tldStrength,
    length_score: lengthScore
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { domain } = await req.json();
    if (!domain) throw new Error('domain is required');

    const analysis = analyzeDomain(domain);
    const gatewayApiKey = Deno.env.get("GATEWAY_API_KEY");

    let narrative = '';
    let slogan = '';
    let startup_concepts: any[] = [];

    if (gatewayApiKey) {
      try {
        const prompt = `You are an elite domain intelligence analyst. Analyze "${domain}" (overall score ${analysis.overall_score}/100, industry: ${analysis.industry_category}, est. value $${analysis.estimated_value_low.toLocaleString()}-$${analysis.estimated_value_high.toLocaleString()}).

Return STRICT JSON only (no markdown, no commentary):
{
  "narrative": "2-3 sentence elite valuation narrative emphasizing sovereign, AI-native, or institutional positioning",
  "slogan": "one premium tagline, max 6 words",
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
        }
      } catch (e) {
        console.log('AI narrative fallback:', e);
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

    return new Response(JSON.stringify({ ...analysis, narrative, slogan, startup_concepts, model_used: 'gemini-3-flash+kernel-v2' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
