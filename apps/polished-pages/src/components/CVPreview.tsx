import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { authHeader } from "@/lib/session";
import { ArrowLeft, Download, FileText, FileDown, Loader2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CV_TEMPLATES } from "@/types/cv";
import { getCvTheme, type CvTheme } from "@/lib/cv-themes";
import { elementToPdf } from "@/lib/export-pdf";

interface CVPreviewProps {
  markdown: string;
  onBack: () => void;
  template?: string;
  photo?: string | null;
}

/* ─── inline-style helpers (accents are runtime values, so not Tailwind) ─── */
const hexA = (hex: string, a: number): string => {
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

// Split markdown into a leading header chunk and the ## sections.
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

const CVPreview = ({ markdown, onBack, template, photo }: CVPreviewProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const cvRef = useRef<HTMLDivElement>(null);

  // Styled PDF: capture the rendered CV (exactly what's on screen, including the
  // photo and the premium layouts) and slice it across A4 pages. Image-based, so
  // it matches the design precisely; the .docx export remains the text/ATS path.
  const handleDownloadPdf = async () => {
    if (!cvRef.current) return;
    setIsPdf(true);
    try {
      await elementToPdf(cvRef.current, "cv.pdf", theme.pageBg);
    } catch (e) {
      toast({ title: "PDF export failed", description: e instanceof Error ? e.message : "Something went wrong", variant: "destructive" });
    } finally {
      setIsPdf(false);
    }
  };

  const templateInfo = CV_TEMPLATES.find((t) => t.id === template);
  const theme = getCvTheme(template);
  const { header, sections } = parseSections(markdown);

  // Designed templates: pull the name out for the header band + photo medallion,
  // and keep the remaining header lines (contact) for the top of the sidebar.
  const headerLines = header.split("\n");
  const nameIdx = headerLines.findIndex((l) => /^#\s+/.test(l));
  const cvName = nameIdx >= 0 ? headerLines[nameIdx].replace(/^#\s+/, "").trim() : "";
  const initials = cvName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const headerRest = headerLines.filter((_, i) => i !== nameIdx).join("\n").trim();

  const handleDownloadMd = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "cv.md"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDocx = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: await authHeader() },
        body: JSON.stringify({ markdown }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Export failed" }));
        throw new Error(err.error || "Export failed");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "cv.docx"; a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: "Export Failed", description: error instanceof Error ? error.message : "Something went wrong", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  // Sidebar layouts: header full width, then a real two-column grid. The first
  // couple of sections (contact/skills for these templates) sit in the tinted
  // sidebar, the rest in the main column.
  const isSidebar = theme.layout !== "single";
  const sidebarSections = isSidebar ? sections.slice(0, 2) : [];
  const mainSections = isSidebar ? sections.slice(2) : sections;

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            <span className="text-lg font-bold font-serif tracking-tight">DocuForge</span>
          </Link>
          <div className="flex items-center gap-3">
            {templateInfo && (
              <span className="hidden md:inline text-xs text-muted-foreground font-sans">
                Template: <strong className="text-foreground">{templateInfo.name}</strong>
              </span>
            )}
            <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Edit
            </Button>
            <Button variant="heroOutline" size="sm" onClick={handleDownloadMd}>
              <Download className="w-4 h-4 mr-1" /> .md
            </Button>
            <Button variant="heroOutline" size="sm" onClick={handleDownloadDocx} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileText className="w-4 h-4 mr-1" />}
              .docx
            </Button>
            <Button variant="hero" size="sm" onClick={handleDownloadPdf} disabled={isPdf}>
              {isPdf ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileDown className="w-4 h-4 mr-1" />}
              .pdf
            </Button>
          </div>
        </div>
      </nav>

      <div className={`container ${theme.container} mx-auto px-6 pt-28 pb-16`}>
        <div
          ref={cvRef}
          className={`rounded-xl border ${theme.fontClass} ${theme.designed ? "p-0 overflow-hidden" : "p-8 md:p-12"} shadow-premium leading-relaxed`}
          style={{ background: theme.pageBg, color: theme.pageText, borderColor: hexA(theme.accent, 0.25) }}
        >
          {theme.designed ? (
            <div>
              {/* header band with name + photo medallion */}
              <div
                className="flex items-center justify-between gap-4 px-8 py-7"
                style={{ background: theme.dark ? hexA(theme.accent, 0.16) : "#eef2f7" }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: ".02em", lineHeight: 1.1, color: theme.dark ? "#fff" : "#111827" }}>{cvName}</div>
                </div>
                {photo ? (
                  <img
                    src={photo}
                    alt={cvName}
                    className="shrink-0 object-cover"
                    style={{ width: 80, height: 80, borderRadius: 9999, boxShadow: `0 0 0 4px ${hexA(theme.accent, 0.25)}` }}
                  />
                ) : (
                  <div
                    className="flex shrink-0 items-center justify-center"
                    style={{ width: 76, height: 76, borderRadius: 9999, background: theme.accent, color: "#fff", fontWeight: 700, fontSize: "1.5rem", boxShadow: `0 0 0 4px ${hexA(theme.accent, 0.2)}` }}
                    aria-label="photo placeholder"
                  >
                    {initials}
                  </div>
                )}
              </div>

              {/* two-column body */}
              <div className="grid gap-0" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1.9fr)" }}>
                <div
                  className="px-7 py-6"
                  style={{ background: theme.dark ? hexA(theme.accent, 0.08) : "#f1f5f9", alignSelf: "stretch" }}
                >
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
            <div
              className="mt-5 grid gap-7"
              style={{ gridTemplateColumns: theme.layout === "sidebar-right" ? "minmax(0,2fr) minmax(0,1fr)" : "minmax(0,1fr) minmax(0,2fr)" }}
            >
              <div
                style={{
                  order: theme.layout === "sidebar-right" ? 2 : 1,
                  background: hexA(theme.accent, 0.07),
                  borderRadius: "0.5rem",
                  padding: "1rem 1.1rem",
                  alignSelf: "start",
                }}
                dangerouslySetInnerHTML={{ __html: sidebarSections.map((s) => sectionHtml(s, theme)).join("") }}
              />
              <div
                style={{ order: theme.layout === "sidebar-right" ? 1 : 2 }}
                dangerouslySetInnerHTML={{ __html: mainSections.map((s) => sectionHtml(s, theme)).join("") }}
              />
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: sections.map((s) => sectionHtml(s, theme)).join("") }} />
          )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CVPreview;
