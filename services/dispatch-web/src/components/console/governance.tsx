import React from "react";
import type { ChainStep } from "../../lib/api";
import { cx } from "./ds";
import { Icon } from "./icons";

// ── Chain of Authority — a record's approval chain as a live procession ────────
// Every office the record must pass, in order, with its standing: cleared (and by
// whom), awaiting now, or still to come — then the publishing office. Server-
// computed (DocumentDetail.governanceChain); nothing here is inferred client-side.
// State is carried by a glyph AND a word, never by colour alone.
export const ChainOfAuthority: React.FC<{ steps: ChainStep[]; rejected?: boolean; compact?: boolean }> = ({ steps, rejected, compact }) => (
  <div>
    <ol className={compact ? "space-y-0" : ""} aria-label="Chain of authority">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const mark = s.state === "done"
          ? { ring: "border-sd-ok/60 bg-sd-ok/15 text-sd-ok", sym: <Icon.check className="h-3.5 w-3.5" />, word: "Cleared" }
          : s.state === "current"
            ? { ring: "border-sd-warn/70 bg-sd-warn/15 text-sd-warn", sym: <span className="h-2 w-2 rounded-full bg-sd-warn" />, word: s.publication ? "Ready for publication" : "Awaiting now" }
            : { ring: "border-sd-line bg-sd-sunken text-sd-text3", sym: <span className="font-mono text-[11px] font-bold">{i + 1}</span>, word: s.publication ? "Publication — after approval" : "Pending" };
        return (
          <li key={i} className={cx("relative flex gap-3", compact ? "pb-3 last:pb-0" : "pb-4 last:pb-0")}>
            {!last && <span aria-hidden className={cx("absolute left-[12px] top-7 h-[calc(100%-1.25rem)] w-px", s.state === "done" ? "bg-sd-ok/35" : "bg-sd-line")} />}
            <span className={cx("relative z-10 mt-0.5 grid h-[25px] w-[25px] shrink-0 place-items-center rounded-full border", mark.ring)}>{mark.sym}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className={cx("text-[13px] font-semibold", s.state === "pending" ? "text-sd-text2" : "text-sd-text")}>{s.label}</span>
                {s.quorum > 1 && <span className="rounded bg-sd-sunken px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-sd-text2">quorum {s.quorum}</span>}
                {s.publication && <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-sd-gold">Publication</span>}
              </div>
              <div className="mt-0.5 text-[12px]">
                <span className={s.state === "done" ? "text-sd-ok" : s.state === "current" ? "text-sd-warn" : "text-sd-text3"}>{mark.word}</span>
                {s.state === "done" && s.by.length > 0 && <span className="text-sd-text2"> · {s.by.join(", ")}</span>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
    {rejected && (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-sd-bad/40 bg-sd-bad/[0.07] px-3 py-2 text-[12px] text-sd-bad">
        <Icon.alert className="h-3.5 w-3.5" /> Rejected — off the publication path. Re-work creates a new version.
      </div>
    )}
  </div>
);
