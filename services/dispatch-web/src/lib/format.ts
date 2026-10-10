// Shared formatting for the Operations console. These were previously duplicated
// per page (Library, DocumentView, OfficeHome); one implementation keeps a record
// row, its file and its office queue in exact agreement.

// A stable, official-looking record number derived from the document id — the
// same derivation everywhere, so a register row and the record file agree.
export const recordNo = (id: string, createdAt?: string): string => {
  const n = parseInt(id.replace(/[^0-9a-f]/gi, "").slice(0, 8), 16) % 1_000_000;
  const yr = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
  return `SD-${yr}-${String(n).padStart(6, "0")}`;
};

// Precise institutional waiting time — "2h 13m", "3d 4h" — not a vague "3d ago".
// A record's time-in-authority is a governance fact an operator is accountable for.
export const waited = (iso?: string | null): string => {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "just now";
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m`;
  return "just now";
};

// Official dates are facts, not "3d ago" — absolute, unambiguous day-month-year.
export const fmtDate = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" }) : "—";

export const fmtDateTime = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleString("en-GB", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

export const fmtBytes = (n?: number | null): string => {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

// Strip the principal-type prefix the engine stores ("svc:", "user:") for display.
export const actorName = (s?: string | null): string => (s ? s.replace(/^svc:|^user:/, "") : "—");
