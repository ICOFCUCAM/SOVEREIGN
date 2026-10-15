// Acquisition radar · refresh guard. Run after the datasets are rebuilt and before they are committed:
// compares the fresh files with the last committed ones and refuses (exit 1) when a source has partly
// failed — a sector index disappearing, or the recorded acquisitions or acquirers shrinking sharply.
// A refusal leaves yesterday's data in place; the next day's run tries again.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const DATA = "services/exit-engines/data";
const MAX_DROP = Number(process.env.RADAR_MAX_DROP ?? "0.10");   // at most a 10% fall in a day

const fresh = (f) => JSON.parse(readFileSync(`${DATA}/${f}`, "utf8"));
const committed = (f) => { try { return JSON.parse(execSync(`git show HEAD:${DATA}/${f}`, { maxBuffer: 1 << 30 }).toString()); } catch { return null; } };
const list = (x, key) => (Array.isArray(x) ? x : x?.[key] ?? []);

const problems = [];
const shrink = (file, key, label) => {
  const before = committed(file); if (!before) return;
  const a = list(before, key).length, b = list(fresh(file), key).length;
  console.log(`${label}: ${a} → ${b}`);
  if (a > 0 && b < a * (1 - MAX_DROP)) problems.push(`${label} fell from ${a} to ${b} (more than ${Math.round(MAX_DROP * 100)}%)`);
};
shrink("acquisition_events.json", "events", "recorded acquisitions");
shrink("acquisition_registry.json", "acquirers", "acquirers in the registry");

const before = committed("acquisition_indexes.json");
if (before) {
  const sectors = (x) => new Set(list(x, "indexes").map((i) => i.sector));
  const gone = [...sectors(before)].filter((s) => !sectors(fresh("acquisition_indexes.json")).has(s));
  console.log(`sector indexes removed: ${gone.length ? gone.join(", ") : "none"}`);
  if (gone.length) problems.push(`sector indexes disappeared: ${gone.join(", ")}`);
}

if (problems.length) {
  console.error(`::error::Refresh refused, nothing committed: ${problems.join("; ")}. A source has probably failed part-way; yesterday's data stays.`);
  process.exit(1);
}
console.log("refresh guard: the fresh data is consistent with the last committed data");
