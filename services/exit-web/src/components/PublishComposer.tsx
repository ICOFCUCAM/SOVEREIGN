import React, { useMemo, useState } from "react";
import { Button, copyText, notify } from "../lib/ui";
import type { Listing } from "../lib/listings";
import {
  CHANNELS, buildListingPost, intentUrl, publishViaWebhook, useSocialConfig, isAutoConnected,
  type SocialChannel, type SocialPost,
} from "../lib/social-publish";

// A reusable one-button publish surface. Honest: posts for real via the
// connected aggregator, or opens each network's official composer. Never
// claims a post that did not happen.

export const PublishComposer: React.FC<{ listing?: Listing; post?: SocialPost; open: boolean; onClose: () => void }> = ({ listing, post: postProp, open, onClose }) => {
  const [cfg] = useSocialConfig();
  const basePost = useMemo<SocialPost | null>(() => postProp ?? (listing ? buildListingPost(listing) : null), [postProp, listing]);
  const [text, setText] = useState<string>("");
  const [sel, setSel] = useState<Set<SocialChannel>>(() => new Set(cfg.channels));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  React.useEffect(() => { if (open && basePost) { setText(basePost.text); setSel(new Set(cfg.channels)); setResult(null); } }, [open, basePost, cfg.channels]);
  if (!open || !basePost) return null;

  const post: SocialPost = { ...basePost, text };
  const connected = isAutoConnected(cfg);
  const toggle = (c: SocialChannel): void => setSel((s) => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n; });
  const chosen = CHANNELS.filter((c) => sel.has(c.id));

  const broadcast = async (): Promise<void> => {
    setBusy(true); setResult(null);
    const r = await publishViaWebhook(post, [...sel]);
    setBusy(false);
    if (r.ok) { setResult(`Published to ${r.posted.length} channel${r.posted.length === 1 ? "" : "s"}.`); notify("Published to ExitOS social channels"); }
    else { setResult(`Could not auto-publish — ${r.error}. Use the per-network buttons below.`); }
  };

  const shareIntent = (c: SocialChannel): void => {
    const url = intentUrl(c, post);
    if (!url) { copyText(post.text); notify("Caption copied — paste into Instagram"); return; }
    window.open(url, "_blank", "noopener,noreferrer,width=640,height=720");
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-xl overflow-auto rounded-xl border border-white/10 bg-ink-800/95 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deal-300">Publish to ExitOS social</div>
            <div className="mt-0.5 text-lg font-bold text-white">{post.title}</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        <textarea value={text} onChange={(e) => setText(e.target.value)}
          className="mt-4 min-h-[150px] w-full resize-y rounded-md border border-white/10 bg-ink-900/70 p-3 text-[13px] leading-relaxed text-white/85 focus:border-deal-400/50 focus:outline-none" />

        <div className="mt-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Channels</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {CHANNELS.map((c) => (
              <button key={c.id} onClick={() => toggle(c.id)}
                className={`rounded-md px-2.5 py-1 text-[12px] font-semibold ring-1 transition ${sel.has(c.id) ? "bg-deal-600/20 text-deal-200 ring-deal-400/40" : "text-white/55 ring-white/15 hover:text-white"}`}>
                {c.label}{!c.hasWebIntent && <span className="ml-1 text-[9px] text-white/35">·aggregator</span>}
              </button>
            ))}
          </div>
        </div>

        {/* status — honest about whether auto-broadcast is wired */}
        <div className={`mt-4 rounded-lg border p-3 text-[12px] ${connected ? "border-deal-400/30 bg-deal-600/[0.07] text-white/75" : "border-loi-400/30 bg-loi-500/[0.07] text-loi-100/90"}`}>
          {connected
            ? "Auto-broadcast is connected — one click posts to every selected ExitOS account via your aggregator."
            : "Auto-broadcast is not connected. Connect an aggregator webhook in Admin → Social distribution for true one-click posting. Until then, use the per-network buttons (real share composers)."}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={broadcast} disabled={!connected || busy || sel.size === 0}>{busy ? "Publishing…" : `Publish to ${sel.size} channel${sel.size === 1 ? "" : "s"} →`}</Button>
          <Button variant="ghost" onClick={() => copyText(post.text)}>Copy text</Button>
          <div className="ml-auto flex flex-wrap gap-1.5">
            {chosen.map((c) => (
              <button key={c.id} onClick={() => shareIntent(c.id)}
                className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-white/70 ring-1 ring-white/15 transition hover:bg-white/5 hover:text-white">{c.label} ↗</button>
            ))}
          </div>
        </div>

        {result && <div className="mt-3 text-[12px] text-white/70">{result}</div>}
      </div>
    </div>
  );
};

export default PublishComposer;
