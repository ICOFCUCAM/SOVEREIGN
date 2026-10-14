import React, { useMemo, useState } from "react";
import { Button, CloseIcon, copyText, notify } from "../lib/ui";
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
  const toggle = (c: SocialChannel): void => setSel((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; });
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
      <div className="max-h-[88vh] w-full max-w-xl overflow-auto rounded-xl border border-xo-line bg-xo-panel p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-xo-verified">Publish · ExitOS Distribution Engine</div>
            <div className="mt-0.5 text-lg font-bold text-xo-text">{post.title}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action"><CloseIcon /></button>
        </div>

        <textarea value={text} onChange={(e) => setText(e.target.value)}
          className="mt-4 min-h-[150px] w-full resize-y rounded-md border border-xo-line bg-xo-panel p-3 text-[13px] leading-relaxed text-xo-text focus:border-xo-verified/50 focus:outline-none" />

        <div className="mt-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-xo-faint">Channels</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {CHANNELS.map((c) => {
              const isConn = connected[c.id];
              const res = resultFor(c.id);
              return (
                <button key={c.id} onClick={() => toggle(c.id)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-semibold ring-1 transition ${sel.has(c.id) ? "bg-xo-verified/20 text-xo-verified ring-xo-action/40" : "text-xo-muted ring-xo-line hover:text-xo-text"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isConn ? "bg-deal-400" : "bg-xo-raise"}`} title={isConn ? "Connected" : "Not connected"} />
                  {c.label}
                  {res && <span className={res.status === "done" ? "text-xo-verified" : "text-xo-risk"}>{res.status === "done" ? "✓" : "✗"}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`mt-4 rounded-lg border p-3 text-[12px] ${anyConnected ? "border-xo-verified/30 bg-deal-600/[0.07] text-xo-muted" : "border-xo-caution/30 bg-loi-500/[0.07] text-xo-caution/90"}`}>
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
                className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-xo-muted ring-1 ring-xo-line transition hover:bg-xo-raise hover:text-xo-text">{c.label} ↗</button>
            ))}
          </div>
        </div>

        {results && (
          <div className="mt-4 space-y-1.5">
            {results.map((r) => (
              <div key={r.channel} className="flex items-start gap-2 text-[12px]">
                <span className={r.status === "done" ? "text-xo-verified" : "text-xo-risk"}>{r.status === "done" ? "✓" : "✗"}</span>
                <span className="font-semibold text-xo-text capitalize">{r.channel}</span>
                {r.status === "done"
                  ? (r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xo-verified hover:underline">view post ↗</a> : <span className="text-xo-faint">posted</span>)
                  : <span className="text-xo-faint">{r.error}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishComposer;
