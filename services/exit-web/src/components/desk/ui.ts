// ── LISTING DESK · shared styles ────────────────────────────────────
// Every control on the founder's listing journey takes its look from here, so a button, a field or a
// choice reads the same on all three stages. Colours are the `desk` tokens in tailwind.config.ts.

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-desk-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-desk-paper";

/** The one primary action on a screen. */
export const BTN_PRIMARY = `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] bg-desk-gold px-6 text-[13.5px] font-semibold text-desk-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors hover:bg-[#AA8443] active:bg-[#9E7A3D] ${FOCUS} disabled:cursor-not-allowed disabled:bg-desk-line disabled:text-desk-faint disabled:shadow-none`;
/** Back, Edit, Save draft: quiet, outlined. */
export const BTN_SECONDARY = `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] bg-desk-surface px-5 text-[13.5px] font-semibold text-desk-ink ring-1 ring-inset ring-desk-line transition hover:ring-desk-line-strong active:bg-desk-tint ${FOCUS} disabled:cursor-not-allowed disabled:text-desk-faint`;

export const LABEL = "mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-desk-muted";
export const HINT = "mt-1.5 block text-[12px] leading-snug text-desk-faint";
export const ERROR = "mt-1.5 block text-[12px] leading-snug text-desk-error";
export const FIELD = `w-full rounded-[10px] border border-desk-line bg-desk-surface px-4 py-3 text-[14.5px] text-desk-ink placeholder:text-desk-faint transition hover:border-desk-line-strong focus-visible:border-desk-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-desk-gold/25 aria-[invalid=true]:border-desk-error`;

/** A choice among several (stage, asking structure, what is for sale…): selected is ink, never gold. */
export const pill = (on: boolean): string => `min-h-[38px] rounded-full border px-4 text-[13px] transition ${FOCUS} ${on
  ? "border-desk-ink bg-desk-ink font-medium text-desk-surface"
  : "border-desk-line bg-desk-surface text-desk-text hover:border-desk-line-strong hover:text-desk-ink"}`;

export const CARD = "rounded-[18px] border border-desk-line bg-desk-surface shadow-[0_1px_2px_rgba(60,45,20,0.04)]";
export const EYEBROW = "text-[11px] font-semibold uppercase tracking-[0.24em] text-desk-gold-ink";
export const H1 = "font-display text-[42px] font-medium leading-[1.02] tracking-[-0.01em] text-desk-ink sm:text-[54px] lg:text-[62px]";
export const ACCENT_WORD = "italic text-desk-gold-ink";
export const LEDE = "text-[16px] leading-[1.7] text-desk-text";
