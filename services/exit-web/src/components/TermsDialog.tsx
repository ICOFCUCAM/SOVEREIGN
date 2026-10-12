import React, { useId, useState } from "react";
import { Modal } from "../lib/ui";
import { searchGlossary } from "../lib/glossary";

// The plain-language terms panel, opened from the console sidebar.
const TermsDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [q, setQ] = useState("");
  const inputId = useId();
  const list = searchGlossary(q);
  return (
    <Modal open={open} onClose={onClose} title="Plain-language terms" subtitle="What the deal and finance words on these pages mean" size="md">
      <label htmlFor={inputId} className="mb-1 block text-[12px] font-medium text-white/70">Find a term</label>
      <input id={inputId} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. LOI, earn-out"
        className="mb-4 w-full rounded-md border border-white/15 bg-ink-900/70 px-3 py-2 text-sm text-white placeholder-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action" />
      {list.length === 0
        ? <p className="text-[13px] text-white/70">No term matches “{q}”.</p>
        : <dl className="space-y-3">
            {list.map((t) => (
              <div key={t.term}>
                <dt className="text-[13px] font-semibold text-white">{t.term}{t.aka && <span className="font-normal text-white/60"> · {t.aka}</span>}</dt>
                <dd className="text-[13px] leading-snug text-white/75">{t.meaning}</dd>
              </div>
            ))}
          </dl>}
    </Modal>
  );
};

export default TermsDialog;
