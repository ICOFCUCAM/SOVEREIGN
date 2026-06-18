import React, { useMemo, useState } from "react";
import { Button, copyText, notify } from "../lib/ui";
import type { Listing } from "../lib/listings";
import { CHANNELS, buildListingPost, intentUrl, type SocialChannel, type SocialPost } from "../lib/social-publish";
import { dispatch, useEngineStatus, type DispatchResult } from "../lib/distribution-engine";

// One-button publish surface, powered by the ExitOS distribution engine. Honest:
// the engine posts to the real platform APIs and returns a per-channel result;
// the per-network composer buttons are a manual fallback. No post is faked.

export const PublishComposer: React.FC<{ listing?: Listing; post?: SocialPost; open: boolean; onClose: () => void }> = ({ listing, post: postProp, open, onClose }) => {
  const { connected, anyConnected, loading } = useEngineStatus();
  const basePost = useMemo<SocialPost | null>(() => postProp ?? (listing ? buildListingPost(listing) : null), [postProp, listing]);
  const [text, setText] = useState<string>("");
  const [sel, setSel] = useState<Set<SocialChannel>>(() => new Set(["linkedin", "x", "facebook", "telegram"]));
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<DispatchResult[] | null>(null);

  React.useEffect(() => { if (open && basePost) { setText(basePost.text); setResults(null); } }, [open, basePost]);
  if (!open || !basePost) return null;

  const post: SocialPost = { ...basePost, text, body: text };
  const toggle = (c: SocialChannel): void => setSel((s) => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n; });
  const chosen = CHANNELS.filter((c) => sel.has(c.id));

  const publish = async (): Promise<void> => {
    setBusy(true); setResults(null);
    const r = await dispatch(post, [...sel]);
    setBusy(false); setResults(r);
    const ok = r.filter((x) => x.status === "done").length;
    notify(ok > 0 ? `Published to ${ok} channel${ok === 1 ? "" : "s"}` : "Engine could not publish — see per-channel status");
  };

  const shareIntent = (c: SocialChannel): void => {
    const url = intentUrl(c, post);
    if (!url) { copyText(post.text); notify("Caption copied — paste into Instagram"); return; }
    window.open(url, "_blank", "noopener,noreferrer,width=640,height=720");
  };

  const resultFor = (c: SocialChannel): DispatchResult | undefined => results?.find((r) => r.channel === c);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-xl overflow-auto rounded-xl border border-white/10 bg-ink-800/95 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deal-300">Publish · ExitOS Distribution Engine</div>
            <div className="mt-0.5 text-lg font-bold text-white">{post.title}</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        <textarea value={text} onChange={(e) => setText(e.target.value)}
          className="mt-4 min-h-[150px] w-full resize-y rounded-md border border-white/10 bg-ink-900/70 p-3 text-[13px] leading-relaxed text-white/85 focus:border-deal-400/50 focus:outline-none" />

        <div className="mt-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Channels</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {CHANNELS.map((c) => {
              const isConn = connected[c.id];
              const res = resultFor(c.id);
              return (
                <button key={c.id} onClick={() => toggle(c.id)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-semibold ring-1 transition ${sel.has(c.id) ? "bg-deal-600/20 text-deal-200 ring-deal-400/40" : "text-white/55 ring-white/15 hover:text-white"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isConn ? "bg-deal-400" : "bg-white/25"}`} title={isConn ? "Connected" : "Not connected"} />
                  {c.label}
                  {res && <span className={res.status === "done" ? "text-deal-300" : "text-red-300"}>{res.status === "done" ? "✓" : "✗"}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`mt-4 rounded-lg border p-3 text-[12px] ${anyConnected ? "border-deal-400/30 bg-deal-600/[0.07] text-white/75" : "border-loi-400/30 bg-loi-500/[0.07] text-loi-100/90"}`}>
          {loading ? "Checking engine connection…"
            : anyConnected ? `ExitOS Distribution Engine is live — ${Object.values(connected).filter(Boolean).length} channel(s) connected. One click posts to the connected accounts.`
            : "No channels are connected yet. Add platform tokens in Admin → ExitOS Distribution Engine. Until then, use the per-network composer buttons below (real share dialogs)."}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={publish} disabled={busy || sel.size === 0}>{busy ? "Publishing…" : `Publish to ${sel.size} channel${sel.size === 1 ? "" : "s"} →`}</Button>
          <Button variant="ghost" onClick={() => copyText(post.text)}>Copy text</Button>
          <div className="ml-auto flex flex-wrap gap-1.5">
            {chosen.map((c) => (
              <button key={c.id} onClick={() => shareIntent(c.id)}
                className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-white/70 ring-1 ring-white/15 transition hover:bg-white/5 hover:text-white">{c.label} ↗</button>
            ))}
          </div>
        </div>

        {results && (
          <div className="mt-4 space-y-1.5">
            {results.map((r) => (
              <div key={r.channel} className="flex items-start gap-2 text-[12px]">
                <span className={r.status === "done" ? "text-deal-300" : "text-red-300"}>{r.status === "done" ? "✓" : "✗"}</span>
                <span className="font-semibold text-white/80 capitalize">{r.channel}</span>
                {r.status === "done"
                  ? (r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-deal-300 hover:underline">view post ↗</a> : <span className="text-white/50">posted</span>)
                  : <span className="text-white/50">{r.error}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishComposer;
