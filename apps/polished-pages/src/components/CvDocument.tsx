import type { Ref } from "react";
import { getCvTheme, type CvTheme } from "@/lib/cv-themes";

// The CV "sheet" renderer — the page itself, with no nav or export controls.
// Shared by the full preview (CVPreview) and the live in-form preview, so what
// you see while choosing a template is exactly what you get.

export const hexA = (hex: string, a: number): string => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const inline = (s: string): string =>
  s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");

const h2Html = (title: string, t: CvTheme): string => {
  const base = "margin:1.5rem 0 .6rem;font-weight:700;";
  switch (t.headingKind) {
    case "band":
      return `<h2 style="${base}display:inline-block;background:${t.accent};color:#fff;padding:.2rem .65rem;text-transform:uppercase;letter-spacing:.1em;font-size:.78rem">${inline(title)}</h2>`;
    case "rule":
      return `<h2 style="${base}color:${t.accent};border-bottom:1px solid ${t.accent};padding-bottom:.25rem;text-transform:uppercase;letter-spacing:.14em;font-size:.92rem">${inline(title)}</h2>`;
    case "gradient":
      return `<h2 style="${base}background:linear-gradient(90deg,${t.gradientFrom},${t.gradientTo});-webkit-background-clip:text;background-clip:text;color:transparent;font-size:1.05rem">${inline(title)}</h2>`;
    case "hash":
      return `<h2 style="${base}color:${t.accent};font-family:monospace;font-size:.95rem">## ${inline(title)}</h2>`;
    default:
      return `<h2 style="${base}color:${t.accent};text-transform:uppercase;letter-spacing:.18em;font-size:.85rem">${inline(title)}</h2>`;
  }
};

const bodyHtml = (md: string, t: CvTheme): string => {
  const out: string[] = [];
  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    if (/^#\s+/.test(line)) {
      const name = line.replace(/^#\s+/, "");
      const fill = t.headingKind === "gradient"
        ? `background:linear-gradient(90deg,${t.gradientFrom},${t.gradientTo});-webkit-background-clip:text;background-clip:text;color:transparent`
        : `color:${t.dark ? t.accent : t.pageText}`;
      out.push(`<h1 style="font-size:2.1rem;font-weight:800;letter-spacing:.03em;margin:0 0 .35rem;${fill}">${inline(name)}</h1>`);
    } else if (/^###\s+/.test(line)) {
      out.push(`<h3 style="font-weight:600;margin:.7rem 0 .15rem;color:${t.pageText}">${inline(line.replace(/^###\s+/, ""))}</h3>`);
    } else if (/^[-*]\s+/.test(line)) {
      out.push(`<div style="display:flex;gap:.5rem;margin:.18rem 0 .18rem .15rem"><span style="color:${t.accent};line-height:1.5">•</span><span style="flex:1">${inline(line.replace(/^[-*]\s+/, ""))}</span></div>`);
    } else if (/^-{3,}$/.test(line)) {
      out.push(`<hr style="border:none;border-top:1px solid ${hexA(t.accent, 0.3)};margin:.7rem 0"/>`);
    } else if (line.trim() === "") {
      out.push(`<div style="height:.45rem"></div>`);
    } else {
      out.push(`<p style="margin:.3rem 0;color:${t.pageText}">${inline(line)}</p>`);
    }
  }
  return out.join("");
};

const parseSections = (markdown: string): { header: string; sections: { title: string; body: string }[] } => {
  const parts = markdown.split(/^##\s+/m);
  const header = parts[0] ?? "";
  const sections = parts.slice(1).map((p) => {
    const nl = p.indexOf("\n");
    return { title: (nl === -1 ? p : p.slice(0, nl)).trim(), body: nl === -1 ? "" : p.slice(nl + 1) };
  });
  return { header, sections };
};

const sectionHtml = (s: { title: string; body: string }, t: CvTheme): string => h2Html(s.title, t) + bodyHtml(s.body, t);

interface Props {
  markdown: string;
  template?: string;
  photo?: string | null;
  innerRef?: Ref<HTMLDivElement>;
}

const CvDocument = ({ markdown, template, photo, innerRef }: Props) => {
  const theme = getCvTheme(template);
  const { header, sections } = parseSections(markdown);

  const headerLines = header.split("\n");
  const nameIdx = headerLines.findIndex((l) => /^#\s+/.test(l));
  const cvName = nameIdx >= 0 ? headerLines[nameIdx].replace(/^#\s+/, "").trim() : "";
  const initials = cvName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const headerRest = headerLines.filter((_, i) => i !== nameIdx).join("\n").trim();

  const isSidebar = theme.layout !== "single";
  const sidebarSections = isSidebar ? sections.slice(0, 2) : [];
  const mainSections = isSidebar ? sections.slice(2) : sections;

  return (
    <div
      ref={innerRef}
      className={`rounded-xl border ${theme.fontClass} ${theme.designed ? "p-0 overflow-hidden" : "p-8 md:p-12"} shadow-premium leading-relaxed`}
      style={{ background: theme.pageBg, color: theme.pageText, borderColor: hexA(theme.accent, 0.25) }}
    >
      {theme.designed ? (
        <div>
          <div className="flex items-center justify-between gap-4 px-8 py-7" style={{ background: theme.dark ? hexA(theme.accent, 0.16) : "#eef2f7" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: ".02em", lineHeight: 1.1, color: theme.dark ? "#fff" : "#111827" }}>{cvName}</div>
            </div>
            {photo ? (
              <img src={photo} alt={cvName} className="shrink-0 object-cover" style={{ width: 80, height: 80, borderRadius: 9999, boxShadow: `0 0 0 4px ${hexA(theme.accent, 0.25)}` }} />
            ) : (
              <div className="flex shrink-0 items-center justify-center" style={{ width: 76, height: 76, borderRadius: 9999, background: theme.accent, color: "#fff", fontWeight: 700, fontSize: "1.5rem", boxShadow: `0 0 0 4px ${hexA(theme.accent, 0.2)}` }} aria-label="photo placeholder">
                {initials}
              </div>
            )}
          </div>
          <div className="grid gap-0" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1.9fr)" }}>
            <div className="px-7 py-6" style={{ background: theme.dark ? hexA(theme.accent, 0.08) : "#f1f5f9", alignSelf: "stretch" }}>
              {headerRest && <div dangerouslySetInnerHTML={{ __html: bodyHtml(headerRest, theme) }} />}
              <div dangerouslySetInnerHTML={{ __html: sections.slice(0, 3).map((s) => sectionHtml(s, theme)).join("") }} />
            </div>
            <div className="px-8 py-6" dangerouslySetInnerHTML={{ __html: sections.slice(3).map((s) => sectionHtml(s, theme)).join("") }} />
          </div>
        </div>
      ) : (
        <div className="contents">
          <div dangerouslySetInnerHTML={{ __html: bodyHtml(header, theme) }} />
          {isSidebar ? (
            <div className="mt-5 grid gap-7" style={{ gridTemplateColumns: theme.layout === "sidebar-right" ? "minmax(0,2fr) minmax(0,1fr)" : "minmax(0,1fr) minmax(0,2fr)" }}>
              <div
                style={{ order: theme.layout === "sidebar-right" ? 2 : 1, background: hexA(theme.accent, 0.07), borderRadius: "0.5rem", padding: "1rem 1.1rem", alignSelf: "start" }}
                dangerouslySetInnerHTML={{ __html: sidebarSections.map((s) => sectionHtml(s, theme)).join("") }}
              />
              <div style={{ order: theme.layout === "sidebar-right" ? 1 : 2 }} dangerouslySetInnerHTML={{ __html: mainSections.map((s) => sectionHtml(s, theme)).join("") }} />
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: sections.map((s) => sectionHtml(s, theme)).join("") }} />
          )}
        </div>
      )}
    </div>
  );
};

export default CvDocument;
