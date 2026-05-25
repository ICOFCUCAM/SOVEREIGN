export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// ── Deterministic negotiation / pricing-strategy engine (Module 3) ──
// The reserve price and acceptance threshold are computed here, server-side,
// and NEVER returned to the client. The broker only ever exposes a public
// counter-offer + qualitative signals.
function computeMove(input: {
  asking: number;
  intent: string;
  offer: number;
  rounds: number;
  message: string;
}) {
  const { asking, intent, offer, rounds, message } = input;
  const reserve = Math.max(1, Math.round(asking * 0.62));
  const acceptAt = Math.round(asking * 0.85);
  const text = (message || '').toLowerCase();

  const urgencyWords = ['now', 'today', 'asap', 'urgent', 'immediately', 'this week', 'deadline', 'quickly', 'soon', 'ready to'];
  const seriousWords = ['budget', 'funded', 'company', 'enterprise', 'acquire', 'closing', 'wire', 'escrow', 'legal', 'contract', 'invest', 'launch'];
  const urgencyHits = urgencyWords.filter(w => text.includes(w)).length;
  const seriousHits = seriousWords.filter(w => text.includes(w)).length;

  const hasOffer = offer && offer > 0;
  const isLowball = hasOffer && offer < reserve;

  let buyerScore = 50 + seriousHits * 8 + (message.length > 80 ? 10 : 0);
  if (hasOffer && offer >= reserve) buyerScore += 15;
  if (isLowball) buyerScore -= 12;
  buyerScore = Math.max(30, Math.min(98, buyerScore));

  const urgencyScore = Math.min(100, 40 + urgencyHits * 15);

  let stage: string;
  let status: 'active' | 'accepted' | 'escalated' = 'active';
  let accepted = false;
  let escalate = false;
  let counter: number;

  const maxRounds = 6;

  if (!hasOffer) {
    // Opening / qualification — anchor at asking, invite a position.
    counter = asking;
    stage = rounds <= 1 ? 'opening' : 'probing';
  } else if (offer >= acceptAt) {
    accepted = true;
    status = 'accepted';
    stage = 'accepted';
    counter = offer;
  } else if (offer >= reserve) {
    // Credible — narrow toward asking, shrinking the gap each round.
    const gap = asking - offer;
    const decay = Math.max(0.25, 0.6 - rounds * 0.08);
    counter = Math.round(offer + gap * decay);
    counter = Math.min(asking, Math.max(counter, offer + 1));
    stage = (counter - offer) / asking < 0.05 ? 'closing' : 'countering';
  } else {
    // Below floor — hold firm near asking without revealing the reserve.
    counter = Math.round(asking * (rounds >= 3 ? 0.9 : 0.95));
    stage = 'countering';
  }

  if (!accepted && rounds >= maxRounds) {
    escalate = true;
    status = 'escalated';
    stage = 'escalated';
  }

  let confidence: number;
  if (accepted) confidence = 96;
  else if (hasOffer) confidence = Math.max(20, Math.min(92, Math.round((offer / asking) * 100)));
  else confidence = Math.min(80, 45 + rounds * 6);

  return { reserve, acceptAt, counter, stage, status, accepted, escalate, buyerScore, urgencyScore, confidence, isLowball, hasOffer };
}

function brokerLine(opts: {
  domain: string; industry: string; score: number; asking: number;
  offer: number; move: ReturnType<typeof computeMove>; email: string;
}) {
  const { domain, industry, score, asking, offer, move, email } = opts;
  const fmt = (n: number) => '$' + Math.round(n).toLocaleString();
  if (move.accepted) {
    return `At ${fmt(offer)} we have alignment. ${domain} commands this level given its ${score}/100 intelligence profile — I'm prepared to recommend acceptance and open the secure, escrow-ready transfer channel. Shall I initiate?`;
  }
  if (move.escalate) {
    return `You're clearly serious about ${domain}, and I want to get you to a close. I'm escalating directly to the principal owner to finalize terms — expect contact${email ? ` at ${email}` : ''} shortly. The position you've put forward will be represented faithfully.`;
  }
  if (!move.hasOffer) {
    return `${domain} is a premium ${industry.toLowerCase()} asset — ${score}/100 on our intelligence index, currently positioned at ${fmt(asking)}. I represent the principal and I'm authorized to negotiate. Tell me about your venture and the number you have in mind, and I'll work to get you to a close.`;
  }
  if (move.isLowball) {
    return `I appreciate the interest. Candidly, ${fmt(offer)} sits below the floor this asset commands in today's ${industry.toLowerCase()} market. I can justify ${fmt(move.counter)} — that's where serious conversations begin. If you can move toward it, I can move toward you.`;
  }
  if (move.stage === 'closing') {
    return `Your position at ${fmt(offer)} is credible and we're close. I can bring the principal to ${fmt(move.counter)} — meet me there and I'll recommend we close today.`;
  }
  return `${fmt(offer)} is a real opening — thank you for it. Given ${domain}'s ${score}/100 profile and ${industry.toLowerCase()} positioning, I can bring the principal to ${fmt(move.counter)}. Where can you take it from here?`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const asking = Number(body.asking_price) || 0;
    const offer = Number(body.offer) || 0;
    const rounds = Number(body.rounds) || 1;
    const intent = String(body.intent || 'inquiry');
    const message = String(body.message || '');
    const domain = String(body.domain || 'this domain');
    const industry = String(body.industry || 'technology');
    const score = Number(body.score) || 80;
    const email = String(body.email || '');

    if (!asking) throw new Error('asking_price is required');

    const move = computeMove({ asking, intent, offer, rounds, message });

    let brokerMessage = brokerLine({ domain, industry, score, asking, offer, move, email });
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (openaiApiKey) {
      try {
        const directive = move.accepted ? 'accept the deal warmly and move to close'
          : move.escalate ? 'escalate to the principal owner gracefully'
          : !move.hasOffer ? 'open the negotiation and invite an offer'
          : move.isLowball ? 'hold firm, the offer is below floor, counter at the given number'
          : 'counter constructively toward a close';
        const prompt = `You are an elite, calm, strategic domain acquisition broker (NOT a chatbot). Asset: ${domain} (${industry}, ${score}/100). Asking ${asking}. Buyer offer: ${offer || 'none yet'}. Your counter: ${move.counter}. Buyer said: "${message}". Directive: ${directive}. Write ONE reply (max 3 sentences), commercially sophisticated, never reveal any reserve price, reference the counter number ${move.counter} if countering. Plain text only.`;
        const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + openaiApiKey },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.7 })
        });
        const aiData = await aiResp.json();
        const content = aiData?.choices?.[0]?.message?.content?.trim();
        if (content) brokerMessage = content;
      } catch (e) {
        console.log('broker enrichment fallback:', e);
      }
    }

    // NOTE: reserve / acceptAt intentionally excluded from the response.
    return new Response(JSON.stringify({
      broker_message: brokerMessage,
      counter_offer: move.counter,
      stage: move.stage,
      status: move.status,
      accepted: move.accepted,
      escalate: move.escalate,
      buyer_score: move.buyerScore,
      urgency_score: move.urgencyScore,
      confidence: move.confidence,
      model_used: openaiApiKey ? 'gpt-4o-mini+broker-v1' : 'broker-v1-deterministic'
    }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
