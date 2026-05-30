import type { Sentiment } from '@sovereign/intel-core';

// Lexicon-based sentiment scorer. Deterministic, no network. Honest for
// a reference — production deployments swap in a model.
//
// Lexicon is a compact AFINN-flavoured English list: weights ∈ [-3, +3].
// Polarity is normalized to [-1, 1], magnitude reports raw |intensity|
// per token, confidence reflects how many lexicon tokens matched.

const LEX: Record<string, number> = {
  // strong negative
  attack: -3, crisis: -3, fraud: -3, scandal: -3, collapse: -3, terror: -3, kill: -3, killed: -3, war: -3, disaster: -3,
  // medium negative
  decline: -2, threat: -2, breach: -2, loss: -2, losses: -2, fail: -2, failed: -2, risk: -2, sanction: -2, sanctions: -2,
  hostile: -2, criticize: -2, criticized: -2, criticism: -2, weakness: -2, fall: -2, fell: -2, fired: -2, drop: -2, drops: -2,
  // mild negative
  concern: -1, concerned: -1, worry: -1, worried: -1, dispute: -1, delay: -1, delayed: -1, doubt: -1, weak: -1, fine: -1,
  warning: -1, downgraded: -1, layoff: -1, layoffs: -1, missed: -1, slowing: -1, slowdown: -1,
  // mild positive
  agree: 1, agreed: 1, deal: 1, growth: 1, gains: 1, gain: 1, improve: 1, improved: 1, partner: 1, partnership: 1,
  beat: 1, beats: 1, support: 1, supported: 1, win: 1, hire: 1, hires: 1, opportunity: 1, positive: 1, stable: 1,
  // medium positive
  rally: 2, surge: 2, surged: 2, strong: 2, soared: 2, soar: 2, exceed: 2, exceeded: 2, record: 2, milestone: 2,
  upgraded: 2, breakthrough: 2, expansion: 2, momentum: 2, recovery: 2, breakthroughs: 2,
  // strong positive
  triumph: 3, victory: 3, historic: 3, landmark: 3, breakthroughs_major: 3, peace: 3, treaty: 1, accord: 1,
};

const NEGATORS = new Set(['not', "n't", 'no', 'never', 'without', 'cannot']);
const INTENSIFIERS = new Set(['very', 'extremely', 'highly', 'deeply', 'sharply', 'strongly']);
const DOWNTONERS = new Set(['slightly', 'somewhat', 'marginally', 'mildly']);

const TOKEN_RE = /[A-Za-z]+(?:'[A-Za-z]+)?/g;

export function scoreSentiment(text: string): Sentiment {
  if (!text) return { polarity: 0, magnitude: 0, confidence: 0 };
  const tokens = (text.toLowerCase().match(TOKEN_RE) ?? []).slice(0, 2048);
  if (tokens.length === 0) return { polarity: 0, magnitude: 0, confidence: 0 };

  let signed = 0;
  let magnitude = 0;
  let matches = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === undefined) continue;
    const w = LEX[t];
    if (w === undefined) continue;
    matches++;
    let multiplier = 1;
    for (let j = Math.max(0, i - 3); j < i; j++) {
      const prev = tokens[j];
      if (prev === undefined) continue;
      if (NEGATORS.has(prev)) multiplier *= -1;
      else if (INTENSIFIERS.has(prev)) multiplier *= 1.5;
      else if (DOWNTONERS.has(prev)) multiplier *= 0.5;
    }
    const v = w * multiplier;
    signed += v;
    magnitude += Math.abs(v);
  }

  if (matches === 0) return { polarity: 0, magnitude: 0, confidence: 0.1 };

  // Normalize polarity to [-1, 1].
  const polarity = Math.max(-1, Math.min(1, signed / (matches * 3)));
  const confidence = Math.min(0.9, 0.2 + Math.min(1, matches / 10) * 0.7);
  return { polarity, magnitude, confidence };
}
