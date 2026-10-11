import type { IntakeInputs } from "./company-intake";

// ── INTAKE NUMBER FIELDS ────────────────────────────────────────────
// What the founder types is kept as text; only a valid number reaches the
// engines. Decimals and (where meaningful) negatives are accepted, thousands
// separators are ignored, and out-of-range values get a plain message.

export type NumericKey =
  | "ttmRevenueUsd" | "arrUsd" | "growthPct" | "grossMarginPct" | "ebitdaMarginPct"
  | "netRetentionPct" | "customerConcentrationPct" | "totalCustomers";

export interface FieldSpec {
  readonly key: NumericKey;
  readonly label: string;
  readonly unit: "$M" | "%" | "customers";
  readonly scale: number;          // stored value = typed number × scale
  readonly min: number;            // in typed units
  readonly max: number;
  readonly integer?: boolean;
  readonly hint: string;
}

export const NUMERIC_FIELDS: readonly FieldSpec[] = [
  { key: "ttmRevenueUsd", label: "TTM revenue", unit: "$M", scale: 1e6, min: 0, max: 100_000, hint: "Revenue over the last 12 months, in millions." },
  { key: "arrUsd", label: "ARR", unit: "$M", scale: 1e6, min: 0, max: 100_000, hint: "Annual recurring revenue, in millions. 0 if not recurring." },
  { key: "growthPct", label: "Growth YoY", unit: "%", scale: 0.01, min: -100, max: 1_000, hint: "Year-over-year revenue growth. Negative if shrinking." },
  { key: "grossMarginPct", label: "Gross margin", unit: "%", scale: 0.01, min: 0, max: 100, hint: "0 to 100." },
  { key: "ebitdaMarginPct", label: "EBITDA margin", unit: "%", scale: 0.01, min: -100, max: 100, hint: "Negative if loss-making." },
  { key: "netRetentionPct", label: "Net revenue retention", unit: "%", scale: 0.01, min: 0, max: 300, hint: "e.g. 115 means existing customers grew 15%." },
  { key: "customerConcentrationPct", label: "Top-10 customer share", unit: "%", scale: 0.01, min: 0, max: 100, hint: "Share of revenue from the 10 largest customers." },
  { key: "totalCustomers", label: "Customers", unit: "customers", scale: 1, min: 1, max: 100_000_000, integer: true, hint: "Total paying customers." },
];

export type ParseResult = { ok: true; value: number } | { ok: false; error: string };

/** Parse what the founder typed into the stored value, or explain why not. */
export function parseField(spec: FieldSpec, text: string): ParseResult {
  return parseNumber(text, spec);
}

/** The shared rule set for typed numbers anywhere in the console. */
export function parseNumber(text: string, spec: { min: number; max: number; scale?: number; integer?: boolean }): ParseResult {
  const t = text.trim().replace(/,/g, "");
  if (t === "") return { ok: false, error: "Enter a number." };
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return { ok: false, error: "Use digits only, e.g. 12.5." };
  const n = Number(t);
  if (spec.integer && !Number.isInteger(n)) return { ok: false, error: "Enter a whole number." };
  if (n < spec.min) return { ok: false, error: spec.min === 0 ? "Cannot be negative." : `Must be at least ${spec.min}.` };
  if (n > spec.max) return { ok: false, error: `Must be at most ${spec.max.toLocaleString("en-US")}.` };
  return { ok: true, value: n * (spec.scale ?? 1) };
}

/** The stored value as the founder would type it (no float noise). */
export function formatField(spec: FieldSpec, value: number): string {
  const n = value / spec.scale;
  return String(Math.round(n * 10_000) / 10_000);
}

export const textsFor = (inputs: IntakeInputs): Record<NumericKey, string> =>
  Object.fromEntries(NUMERIC_FIELDS.map((f) => [f.key, formatField(f, inputs[f.key])])) as Record<NumericKey, string>;
