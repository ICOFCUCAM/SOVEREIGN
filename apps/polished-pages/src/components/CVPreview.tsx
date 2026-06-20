import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { authHeader } from "@/lib/session";
import { ArrowLeft, Download, FileText, FileDown, Loader2, Target, PenTool } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CV_TEMPLATES } from "@/types/cv";
import { getCvTheme } from "@/lib/cv-themes";
import { elementToPdf } from "@/lib/export-pdf";
import CvDocument from "@/components/CvDocument";
import PremiumCv from "@/components/PremiumCv";
import { getPremiumTemplate } from "@/lib/premium-templates";
import { cvDataToMarkdown, type CvData } from "@/lib/cv-data";

interface CVPreviewProps {
  markdown?: string;
  data?: CvData;
  onBack: () => void;
  template?: string;
  photo?: string | null;
}

const CVPreview = ({ markdown, data, onBack, template, photo }: CVPreviewProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const cvRef = useRef<HTMLDivElement>(null);
  const theme = getCvTheme(template);
  const premium = getPremiumTemplate(template);
  const templateName = premium?.name ?? CV_TEMPLATES.find((t) => t.id === template)?.name;
  const exportMd = data ? cvDataToMarkdown(data) : (markdown ?? "");

  const handleDownloadMd = () => {
    const blob = new Blob([exportMd], { type: "text/markdown" });
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
        body: JSON.stringify({ markdown: exportMd }),
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

  const handleDownloadPdf = async () => {
    if (!cvRef.current) return;
    setIsPdf(true);
    try {
      const bg = data ? (premium?.dark ? "#0f172a" : "#ffffff") : theme.pageBg;
      await elementToPdf(cvRef.current, "cv.pdf", bg);
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
            {templateName && (
              <span className="hidden md:inline text-xs text-muted-foreground font-sans">
                Template: <strong className="text-foreground">{templateName}</strong>
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

      <div className={`container ${theme.container} mx-auto px-6 pt-8 pb-10`}>
        {data ? (
          <PremiumCv data={data} template={template} innerRef={cvRef} />
        ) : (
          <CvDocument markdown={markdown ?? ""} template={template} photo={photo} innerRef={cvRef} />
        )}
      </div>

      {/* Next steps — keep momentum from a finished CV into a job application. */}
      <div className="container max-w-3xl mx-auto px-6 pb-16">
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <div className="text-sm font-semibold font-sans">Next steps</div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="heroOutline" className="flex-1 justify-start">
              <Link to="/tailor"><Target className="mr-2 h-4 w-4" /> Tailor this CV to a job</Link>
            </Button>
            <Button asChild variant="heroOutline" className="flex-1 justify-start">
              <Link to="/cover-letter"><PenTool className="mr-2 h-4 w-4" /> Write a matching cover letter</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVPreview;
