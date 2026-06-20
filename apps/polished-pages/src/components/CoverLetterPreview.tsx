import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { authHeader } from "@/lib/session";
import { ArrowLeft, Download, FileText, FileDown, Loader2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { elementToPdf } from "@/lib/export-pdf";

interface Props {
  markdown: string;
  fullName: string;
  email: string;
  phone?: string;
  onBack: () => void;
}

const ACCENT = "#1f3a5f";

const inline = (s: string): string =>
  s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");

// Render the letter body as justified paragraphs on a clean sheet. A leading
// "# Name" from the AI output is dropped — we render our own letterhead.
const letterBodyHtml = (md: string): string => {
  const body = md.replace(/^#\s+.*$/m, "").trim();
  const out: string[] = [];
  for (const raw of body.split("\n")) {
    const line = raw.trimEnd();
    if (/^#{1,3}\s+/.test(line)) out.push(`<p style="font-weight:700;margin:1rem 0 .3rem">${inline(line.replace(/^#{1,3}\s+/, ""))}</p>`);
    else if (line.trim() === "") out.push(`<div style="height:.7rem"></div>`);
    else out.push(`<p style="margin:.5rem 0;text-align:justify;line-height:1.75">${inline(line)}</p>`);
  }
  return out.join("");
};

const CoverLetterPreview = ({ markdown, fullName, email, phone, onBack }: Props) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  const downloadMd = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "cover-letter.md"; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadDocx = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: await authHeader() },
        body: JSON.stringify({ markdown }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Export failed" }));
        throw new Error(e.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "cover-letter.docx"; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: "Export Failed", description: e instanceof Error ? e.message : "Something went wrong", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPdf = async () => {
    if (!ref.current) return;
    setIsPdf(true);
    try {
      await elementToPdf(ref.current, "cover-letter.pdf", "#ffffff");
    } catch (e) {
      toast({ title: "PDF export failed", description: e instanceof Error ? e.message : "Something went wrong", variant: "destructive" });
    } finally {
      setIsPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-14 z-40 border-b border-border/50 bg-background/85 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-12 px-6">
          <span className="text-sm font-medium text-muted-foreground font-sans">Preview</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Edit
            </Button>
            <Button variant="heroOutline" size="sm" onClick={downloadMd}>
              <Download className="w-4 h-4 mr-1" /> .md
            </Button>
            <Button variant="heroOutline" size="sm" onClick={downloadDocx} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileText className="w-4 h-4 mr-1" />}
              .docx
            </Button>
            <Button variant="hero" size="sm" onClick={downloadPdf} disabled={isPdf}>
              {isPdf ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileDown className="w-4 h-4 mr-1" />}
              .pdf
            </Button>
          </div>
        </div>
      </nav>

      <div className="container max-w-3xl mx-auto px-6 pt-8 pb-16">
        <div
          ref={ref}
          className="rounded-xl border font-serif p-10 md:p-14 shadow-premium leading-relaxed"
          style={{ background: "#ffffff", color: "#1a1a1a", borderColor: "rgba(31,58,95,0.2)" }}
        >
          <div style={{ borderBottom: `2px solid ${ACCENT}`, paddingBottom: ".7rem", marginBottom: "1.4rem" }}>
            <div style={{ fontSize: "1.9rem", fontWeight: 700, color: ACCENT, letterSpacing: ".01em" }}>{fullName}</div>
            <div style={{ color: "#555", marginTop: ".2rem", fontSize: ".95rem" }}>
              {[email, phone].filter(Boolean).join("  ·  ")}
            </div>
          </div>
          <div style={{ color: "#666", fontSize: ".9rem", marginBottom: "1.4rem" }}>{today}</div>
          <div dangerouslySetInnerHTML={{ __html: letterBodyHtml(markdown) }} />
        </div>
      </div>
    </div>
  );
};

export default CoverLetterPreview;
