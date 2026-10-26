import { Fragment, type ReactNode } from "react";

// A small Markdown renderer that builds React elements, never HTML strings, so
// text Claude brings back from documents or the web can't inject markup or
// script. Covers what Claude Studio produces: headings, paragraphs, lists,
// quotes, tables, rules, code, bold, italic, inline code and links.

const SAFE_URL = /^(https?:|mailto:)/i;

function inline(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(\[[^\]]+\]\([^)\s]+\))|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g;
  let last = 0; let m: RegExpExecArray | null; let k = key;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (m[1]) out.push(<code key={k++} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{t.slice(1, -1)}</code>);
    else if (m[2]) out.push(<strong key={k++}>{inline(t.slice(2, -2), k * 100)}</strong>);
    else if (m[3]) out.push(<em key={k++}>{inline(t.slice(1, -1), k * 100)}</em>);
    else if (m[4]) {
      const [, label, href] = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(t) ?? [];
      out.push(SAFE_URL.test(href) ? <a key={k++} href={href} target="_blank" rel="noopener noreferrer nofollow" className="text-primary underline underline-offset-2">{label}</a> : label);
    } else out.push(<a key={k++} href={t} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-primary underline underline-offset-2">{t}</a>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const cells = (row: string) => row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

export function Markdown({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0; let k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (/^```/.test(line)) {
      const body: string[] = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) body.push(lines[i++]);
      i++;
      blocks.push(<pre key={k++} className="my-4 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-[13px]">{body.join("\n")}</pre>);
      continue;
    }
    const h = /^(#{1,4})\s+(.+)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const cls = ["", "mt-2 mb-4 font-serif text-3xl font-bold tracking-tight", "mt-8 mb-3 border-b border-border pb-1.5 font-serif text-2xl font-bold", "mt-6 mb-2 font-serif text-lg font-semibold", "mt-5 mb-2 text-base font-semibold"][level];
      const Tag = (`h${Math.min(level + 1, 6)}`) as "h2";
      blocks.push(<Tag key={k++} className={cls}>{inline(h[2])}</Tag>);
      i++; continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { blocks.push(<hr key={k++} className="my-6 border-border" />); i++; continue; }
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const head = cells(line); i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++]));
      blocks.push(
        <div key={k++} className="my-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60"><tr>{head.map((c, j) => <th key={j} className="px-3 py-2 font-semibold">{inline(c)}</th>)}</tr></thead>
            <tbody>{rows.map((r, ri) => <tr key={ri} className="border-t border-border">{r.map((c, j) => <td key={j} className="px-3 py-2 align-top">{inline(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^>\s?/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) body.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push(<blockquote key={k++} className="my-4 border-l-2 border-primary/40 pl-4 italic text-muted-foreground">{inline(body.join(" "))}</blockquote>);
      continue;
    }
    const li = /^\s*([-*+]|\d+[.)])\s+/;
    if (li.test(line)) {
      const ordered = /^\s*\d/.test(line);
      const items: string[] = [];
      while (i < lines.length && li.test(lines[i])) items.push(lines[i++].replace(li, ""));
      const L = ordered ? "ol" : "ul";
      blocks.push(<L key={k++} className={`my-3 space-y-1.5 pl-6 ${ordered ? "list-decimal" : "list-disc"}`}>{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</L>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>\s?|\s*([-*+]|\d+[.)])\s+|\s*\|.*\|\s*$)/.test(lines[i])) para.push(lines[i++]);
    if (!para.length) { para.push(lines[i++]); }
    blocks.push(<p key={k++} className="my-3 leading-relaxed">{para.map((p, j) => <Fragment key={j}>{j > 0 && " "}{inline(p)}</Fragment>)}</p>);
  }
  return <div className={`text-[15px] text-foreground ${className}`}>{blocks}</div>;
}

export default Markdown;
