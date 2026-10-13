import type { MemorandumDocument, MemorandumKind } from "@exit/engines";
import { documentType } from "./registry";
import { CLASSIFICATION_LEVEL } from "./ddm";
import type { TransactionDoc } from "./transaction-docs";

// How a transaction or closing document is handed to the version store and downloaded:
// the memorandum shape the version component expects, and its Markdown.

export const asMemorandum = (kind: string, d: TransactionDoc): MemorandumDocument => ({
  kind: kind as unknown as MemorandumKind, title: d.title, anonymized: false, producedBy: d.producedBy, coverage: d.coverage,
  wordCount: d.sections.map((s) => [s.body ?? "", ...(s.bullets ?? [])].join(" ")).join(" ").split(/\s+/).filter(Boolean).length,
  sections: d.sections.map((s) => ({ heading: s.heading, body: s.body ?? "", ...(s.bullets ? { bullets: s.bullets } : {}), ...(s.table ? { tables: [s.table] } : {}) })),
});

export const toMarkdown = (typeId: string, d: TransactionDoc, basis: string): string => {
  const level = CLASSIFICATION_LEVEL[documentType(typeId).classification];
  const out = [`# ${d.title}`, "", `**${level}**${d.subtitle ? ` · ${d.subtitle}` : ""}`, "", `_${basis}_`, ""];
  for (const s of d.sections) {
    out.push(`## ${s.heading}`, "");
    if (s.body) out.push(s.body, "");
    for (const b of s.bullets ?? []) out.push(`- ${b}`);
    if (s.bullets?.length) out.push("");
    if (s.table) out.push(`| ${s.table.headers.join(" | ")} |`, `|${s.table.headers.map(() => "---").join("|")}|`, ...s.table.rows.map((r) => `| ${r.join(" | ")} |`), "");
  }
  return out.join("\n");
};
