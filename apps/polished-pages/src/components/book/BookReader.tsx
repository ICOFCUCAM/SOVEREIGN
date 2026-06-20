import { useRef, useState } from "react";
import { Pencil, BookOpen, FileDown, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { elementToPdf } from "@/lib/export-pdf";
import { markdownToEpub } from "@/lib/export-epub";
import { BOOK_THEMES, getBookTheme } from "@/lib/book-themes";
import BookPaper from "@/components/book/BookPaper";

// Themed reader for a finished book, with an editable mode. The edit field is a
// plain textarea, so the Grammarly browser extension (and the OS spell/grammar
// tools) attach to it automatically; the chosen interior theme also exports to a
// designed PDF. When onContentChange is provided, edits flow back to the parent
// (used for export and saving the final copy).
const BookReader = ({
  content, title, onContentChange,
}: {
  content: string;
  title: string;
  onContentChange?: (s: string) => void;
}) => {
  const { toast } = useToast();
  const [themeId, setThemeId] = useState(BOOK_THEMES[0].id);
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [pdf, setPdf] = useState(false);
  const paperRef = useRef<HTMLDivElement>(null);
  const theme = getBookTheme(themeId);
  const editable = typeof onContentChange === "function";

  const themedPdf = async () => {
    if (!paperRef.current) return;
    setPdf(true);
    try {
      await elementToPdf(paperRef.current, `${title || "book"}.pdf`, theme.paper);
    } catch (e) {
      toast({ title: "PDF export failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setPdf(false);
    }
  };

  const [epub, setEpub] = useState(false);
  const exportEpub = async () => {
    setEpub(true);
    try {
      await markdownToEpub(content, { title }, title || "book");
    } catch (e) {
      toast({ title: "EPUB export failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setEpub(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground font-sans">Interior design</span>
        <select
          value={themeId}
          onChange={(e) => setThemeId(e.target.value)}
          className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm font-sans"
        >
          {BOOK_THEMES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <span className="hidden sm:inline text-xs text-muted-foreground font-sans">{theme.blurb}</span>

        <div className="ml-auto flex items-center gap-2">
          {editable && (
            <Button variant={mode === "edit" ? "hero" : "heroOutline"} size="sm" onClick={() => setMode(mode === "edit" ? "read" : "edit")}>
              {mode === "edit" ? <><Check className="w-4 h-4 mr-1" /> Done editing</> : <><Pencil className="w-4 h-4 mr-1" /> Edit</>}
            </Button>
          )}
          <Button variant="heroOutline" size="sm" disabled={pdf || mode === "edit"} onClick={themedPdf}>
            {pdf ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileDown className="w-4 h-4 mr-1" />} Themed PDF
          </Button>
          <Button variant="heroOutline" size="sm" disabled={epub} onClick={exportEpub}>
            {epub ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <BookOpen className="w-4 h-4 mr-1" />} EPUB
          </Button>
        </div>
      </div>

      {mode === "edit" ? (
        <div>
          <Textarea
            value={content}
            onChange={(e) => onContentChange?.(e.target.value)}
            rows={26}
            spellCheck
            className="font-mono text-sm leading-relaxed"
          />
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground font-sans">
            <BookOpen className="h-3.5 w-3.5" />
            Edit your final copy here — Grammarly and your browser’s spell-check work in this field. Prefer your own editor? Export to .docx, edit on your computer, then re-import as a new transform.
          </p>
        </div>
      ) : (
        <BookPaper content={content} themeId={themeId} innerRef={paperRef} />
      )}
    </div>
  );
};

export default BookReader;
