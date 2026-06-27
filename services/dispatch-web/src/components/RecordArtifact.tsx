import React, { useEffect, useState } from "react";
import { useUiLocale } from "../lib/locale";

// Concept A — THE RECORD. The hero is the artifact itself: a sealed, numbered
// official instrument on bone paper, struck with a gold foil seal, lit in the
// dark like a record pulled from a national archive. Behind it, the edges of
// further records imply an archive. Motion is near-still: a single minting
// reveal and a slow foil catch of light. No maps, networks, funnels or flows.
//
// The legible instrument copy is localized (the circular brand seal stays Latin —
// it is an emblem). Record number, hash and roman year are constants.

interface RecCopy { no: string; title: string; instrument: string; sealed: string; integrity: string; rows: [string, string][]; }
const REC: Record<string, RecCopy> = {
  en: { no: "RECORD No.", title: "Official Record", instrument: "INSTRUMENT OF PUBLICATION", sealed: "SEALED", integrity: "INTEGRITY (SHA-256)", rows: [["AUTHORITY", "Issuing institution"], ["JURISDICTION", "Sovereign · on-premise"], ["STATUS", "Governed · approved"], ["INTEGRITY", "Immutable · sealed"]] },
  fr: { no: "ACTE Nº", title: "Acte officiel", instrument: "INSTRUMENT DE PUBLICATION", sealed: "SCELLÉ", integrity: "INTÉGRITÉ (SHA-256)", rows: [["AUTORITÉ", "Institution émettrice"], ["JURIDICTION", "Souverain · sur site"], ["STATUT", "Gouverné · approuvé"], ["INTÉGRITÉ", "Immuable · scellé"]] },
  es: { no: "REGISTRO Nº", title: "Acta oficial", instrument: "INSTRUMENTO DE PUBLICACIÓN", sealed: "SELLADO", integrity: "INTEGRIDAD (SHA-256)", rows: [["AUTORIDAD", "Institución emisora"], ["JURISDICCIÓN", "Soberano · local"], ["ESTADO", "Gobernado · aprobado"], ["INTEGRIDAD", "Inmutable · sellado"]] },
  de: { no: "DATENSATZ Nr.", title: "Amtsakte", instrument: "VERÖFFENTLICHUNGSURKUNDE", sealed: "VERSIEGELT", integrity: "INTEGRITÄT (SHA-256)", rows: [["BEHÖRDE", "Ausstellende Institution"], ["ZUSTÄNDIGKEIT", "Souverän · vor Ort"], ["STATUS", "Geprüft · genehmigt"], ["INTEGRITÄT", "Unveränderlich · versiegelt"]] },
  no: { no: "OPPFØRING nr.", title: "Offisiell akt", instrument: "PUBLISERINGSINSTRUMENT", sealed: "FORSEGLET", integrity: "INTEGRITET (SHA-256)", rows: [["MYNDIGHET", "Utstedende institusjon"], ["JURISDIKSJON", "Suveren · lokal"], ["STATUS", "Styrt · godkjent"], ["INTEGRITET", "Uforanderlig · forseglet"]] },
  pt: { no: "REGISTO N.º", title: "Registo oficial", instrument: "INSTRUMENTO DE PUBLICAÇÃO", sealed: "SELADO", integrity: "INTEGRIDADE (SHA-256)", rows: [["AUTORIDADE", "Instituição emissora"], ["JURISDIÇÃO", "Soberano · local"], ["ESTADO", "Governado · aprovado"], ["INTEGRIDADE", "Imutável · selado"]] },
  it: { no: "REGISTRO N.", title: "Atto ufficiale", instrument: "STRUMENTO DI PUBBLICAZIONE", sealed: "SIGILLATO", integrity: "INTEGRITÀ (SHA-256)", rows: [["AUTORITÀ", "Istituzione emittente"], ["GIURISDIZIONE", "Sovrano · in sede"], ["STATO", "Governato · approvato"], ["INTEGRITÀ", "Immutabile · sigillato"]] },
  nl: { no: "RECORD nr.", title: "Officiële akte", instrument: "PUBLICATIE-INSTRUMENT", sealed: "VERZEGELD", integrity: "INTEGRITEIT (SHA-256)", rows: [["AUTORITEIT", "Uitgevende instelling"], ["JURISDICTIE", "Soeverein · lokaal"], ["STATUS", "Beheerd · goedgekeurd"], ["INTEGRITEIT", "Onveranderlijk · verzegeld"]] },
  ar: { no: "السجل رقم", title: "سجل رسمي", instrument: "أداة النشر", sealed: "مختوم", integrity: "السلامة (SHA-256)", rows: [["الجهة", "المؤسسة المُصدِرة"], ["الاختصاص", "سيادي · داخلي"], ["الحالة", "محوكم · معتمد"], ["السلامة", "غير قابل للتغيير"]] },
  ja: { no: "記録番号", title: "公式記録", instrument: "発行文書", sealed: "封印済み", integrity: "完全性 (SHA-256)", rows: [["発行主体", "発行機関"], ["管轄", "主権 · オンプレミス"], ["状態", "統制済み · 承認済み"], ["完全性", "改変不可 · 封印済み"]] },
  zh: { no: "记录编号", title: "正式记录", instrument: "发布文书", sealed: "已封存", integrity: "完整性 (SHA-256)", rows: [["签发机关", "签发机构"], ["管辖", "主权 · 本地部署"], ["状态", "受治理 · 已批准"], ["完整性", "不可篡改 · 已封存"]] },
};

const INK = "#1d1810";
const MUTED = "#6f6453";
// short engraved corner tick at each inner-frame corner (sx,sy = corner)
const Tick: React.FC<{ x: number; y: number; dx: number; dy: number }> = ({ x, y, dx, dy }) => (
  <path d={`M${x + dx * 12},${y} L${x},${y} L${x},${y + dy * 12}`} fill="none" stroke={INK} strokeOpacity="0.32" strokeWidth="1" />
);

export const RecordArtifact: React.FC<{ className?: string }> = ({ className }) => {
  const r = REC[useUiLocale()] || REC.en;
  const [shown, setShown] = useState(false);
  // Honour reduced-motion: skip the mount reveal entirely for those users.
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => { if (reduce) { setShown(true); return; } const t = requestAnimationFrame(() => setShown(true)); return () => cancelAnimationFrame(t); }, [reduce]);

  return (
    <div
      className={className}
      style={reduce ? undefined : {
        transition: "opacity 1100ms cubic-bezier(.16,1,.3,1), transform 1100ms cubic-bezier(.16,1,.3,1)",
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(18px) scale(.985)",
      }}
    >
      <svg viewBox="0 0 600 720" className="h-full w-full" role="img" aria-label="A sealed official record issued by Sovereign Dispatch">
        <defs>
          <linearGradient id="ra-paper" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#f6f1e6" />
            <stop offset="1" stopColor="#e7decb" />
          </linearGradient>
          {/* matte struck-foil — no glassy white, a single warm catch of light */}
          <linearGradient id="ra-foil" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9c6e2b" />
            <stop offset="0.45" stopColor="#d8ac56" />
            <stop offset="0.55" stopColor="#e9c878" />
            <stop offset="1" stopColor="#825a22" />
            <animateTransform attributeName="gradientTransform" type="translate" values="-0.3 0;0.3 0;-0.3 0" dur="10s" repeatCount="indefinite" />
          </linearGradient>
          <radialGradient id="ra-light" cx="0.5" cy="0.42" r="0.62">
            <stop offset="0" stopColor="#e9c878" stopOpacity="0.16" />
            <stop offset="0.5" stopColor="#e9c878" stopOpacity="0.04" />
            <stop offset="1" stopColor="#e9c878" stopOpacity="0" />
          </radialGradient>
          <filter id="ra-shadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="24" stdDeviation="32" floodColor="#000000" floodOpacity="0.62" />
          </filter>
          <radialGradient id="ra-vig" cx="0.5" cy="0.46" r="0.72">
            <stop offset="0.55" stopColor="#241d0c" stopOpacity="0" />
            <stop offset="1" stopColor="#241d0c" stopOpacity="0.13" />
          </radialGradient>
          <filter id="ra-emboss" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#3a2207" floodOpacity="0.45" />
          </filter>
          {/* paper grain, kept ≤3% per audit */}
          <filter id="ra-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.11  0 0 0 0 0.09  0 0 0 0 0.06  0 0 0 0.028 0" />
          </filter>
          <clipPath id="ra-clip"><rect x="88" y="92" width="424" height="568" rx="2" /></clipPath>
          <path id="ra-rim" d="M300,470 m-54,0 a54,54 0 1,1 108,0 a54,54 0 1,1 -108,0" />
        </defs>

        {/* archival depth — edges of further records behind the instrument (square-filed) */}
        <rect x="118" y="58" width="372" height="588" rx="2" fill="#cdc4b0" opacity="0.28" />
        <rect x="104" y="74" width="392" height="588" rx="2" fill="#ddd4c0" opacity="0.5" />

        {/* environmental light the record sits in */}
        <ellipse cx="300" cy="320" rx="320" ry="360" fill="url(#ra-light)" />

        {/* the instrument — square corners (a document, not a UI card) */}
        <g filter="url(#ra-shadow)">
          <rect x="88" y="92" width="424" height="568" rx="2" fill="url(#ra-paper)" stroke="#1d1810" strokeOpacity="0.12" strokeWidth="1" />
          <rect x="88" y="92" width="424" height="568" rx="2" filter="url(#ra-grain)" clipPath="url(#ra-clip)" />
          {/* paper vignette — edges fall into shadow (physical stock under light) */}
          <rect x="88" y="92" width="424" height="568" rx="2" fill="url(#ra-vig)" clipPath="url(#ra-clip)" />
          {/* engraved double frame + corner ticks */}
          <rect x="100" y="104" width="400" height="544" rx="1" fill="none" stroke={INK} strokeOpacity="0.18" strokeWidth="1" />
          <rect x="106" y="110" width="388" height="532" rx="1" fill="none" stroke={INK} strokeOpacity="0.08" strokeWidth="1" />
          <Tick x={100} y={104} dx={1} dy={1} /><Tick x={500} y={104} dx={-1} dy={1} />
          <Tick x={100} y={648} dx={1} dy={-1} /><Tick x={500} y={648} dx={-1} dy={-1} />

          {/* header */}
          <text x="124" y="146" fontFamily="ui-monospace, monospace" fontSize="11.5" letterSpacing="1.5" fill={MUTED}>{r.no} SD-2036-000001</text>
          <g transform="translate(476 138)" textAnchor="end">
            <circle cx="-66" cy="-4" r="3" fill="#b6873a" />
            <text x="0" y="0" fontFamily="ui-monospace, monospace" fontSize="11.5" letterSpacing="2.5" fill="#9a6a22">{r.sealed}</text>
          </g>
          <line x1="124" y1="162" x2="476" y2="162" stroke={INK} strokeOpacity="0.2" strokeWidth="1" />

          <text x="124" y="216" fontFamily="Georgia, 'Times New Roman', serif" fontSize="40" fontWeight="700" letterSpacing="0.5" fill={INK}>{r.title}</text>
          <text x="126" y="242" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="3" fill={MUTED}>{r.instrument}</text>

          {/* struck ink stamp — in the clear right margin, below the title (keeps it legible) */}
          <g transform="rotate(-7 414 250)" opacity="0.48">
            <rect x="360" y="231" width="108" height="38" fill="none" stroke="#8a5e22" strokeWidth="1.5" />
            <rect x="364" y="235" width="100" height="30" fill="none" stroke="#8a5e22" strokeWidth="0.6" />
            <text x="414" y="251" textAnchor="middle" fontFamily="Georgia, serif" fontSize="12" fontWeight="700" letterSpacing="2.5" fill="#8a5e22">{r.sealed}</text>
            <text x="414" y="261" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="6.5" letterSpacing="2" fill="#8a5e22">· MMXXXVI ·</text>
          </g>

          {/* metadata ledger */}
          {r.rows.map(([k, v], i) => {
            const y = 286 + i * 38;
            return (
              <g key={k}>
                <text x="124" y={y} fontFamily="ui-monospace, monospace" fontSize="10.5" letterSpacing="2" fill={MUTED}>{k}</text>
                <text x="476" y={y} textAnchor="end" fontFamily="Georgia, serif" fontSize="14.5" fill={INK}>{v}</text>
                <line x1="124" y1={y + 13} x2="476" y2={y + 13} stroke={INK} strokeOpacity="0.1" strokeWidth="1" />
              </g>
            );
          })}

          {/* the struck gold seal — the most authoritative object */}
          <g filter="url(#ra-emboss)">
            <circle cx="300" cy="472" r="74" fill="#a89472" opacity="0.22" />
            <circle cx="300" cy="470" r="72" fill="url(#ra-foil)" stroke="#6e4a18" strokeWidth="1.2" />
            <circle cx="300" cy="470" r="62" fill="none" stroke="#6e4a18" strokeOpacity="0.5" strokeWidth="1" />
            <circle cx="300" cy="470" r="44" fill="none" stroke="#5e3f15" strokeOpacity="0.35" strokeWidth="0.8" />
            {/* struck metal catches light, top-left */}
            <path d="M256 440 a62 62 0 0 1 64 -14" fill="none" stroke="#fff1cf" strokeOpacity="0.5" strokeWidth="1.4" strokeLinecap="round" />
            {/* shield + check, embossed into the foil */}
            <g transform="translate(300 470) scale(1.65)" fill="none" stroke="#5e3f15" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M0 -12l9 3.2V0c0 6-4 10.4-9 12.4C-5 10.4 -9 6 -9 0V-8.8L0 -12z" />
              <path d="M-4.2 0l3 3 5.4-6" />
            </g>
            <text fontFamily="Georgia, serif" fontSize="9" letterSpacing="3.2" fill="#5e3f15" fillOpacity="0.9">
              <textPath href="#ra-rim" startOffset="1%">·&nbsp;SOVEREIGN&nbsp;DISPATCH&nbsp;·&nbsp;SEAL&nbsp;OF&nbsp;RECORD&nbsp;</textPath>
            </text>
          </g>

          {/* integrity footer — honest format, visibly truncated */}
          <line x1="124" y1="600" x2="476" y2="600" stroke={INK} strokeOpacity="0.2" strokeWidth="1" />
          <text x="124" y="624" fontFamily="ui-monospace, monospace" fontSize="10" letterSpacing="1" fill={MUTED}>{r.integrity}  9f1a…5b6f</text>
          <text x="476" y="624" textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="10" letterSpacing="2" fill={MUTED}>{r.sealed} MMXXXVI</text>
        </g>
      </svg>
    </div>
  );
};
