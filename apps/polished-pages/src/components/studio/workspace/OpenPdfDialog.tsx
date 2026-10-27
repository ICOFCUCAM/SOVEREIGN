import { useEffect, useRef, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { pdfInStudio, type StudioFile } from "@/lib/claude-studio";
import { PdfPasswordError, hasTextLayer, openPdf, pageName, pdfPageImages, pdfText } from "@/lib/pdf-unlock";

// Read a PDF the runner can't open (DESIGN-SPEC.md §18b): the owner's browser opens it,
// with its password when it has one. A PDF with real text gives its text at once; a scan
// is sent to Claude Code page by page as images, which it reads without poppler.
type Step = { kind: "opening" } | { kind: "password"; wrong: boolean } | { kind: "working"; line: string } | { kind: "done"; line: string } | { kind: "error"; line: string };

export default function OpenPdfDialog({ threadId, file, onClose, onChanged, onReadPages }: {
  threadId: string; file: StudioFile; onClose: () => void;
  /** The project changed (a text copy or page images were added). */
  onChanged: () => void;
  /** Starts Read scanned pages on the page images. */
  onReadPages: () => void;
}) {
  const [step, setStep] = useState<Step>({ kind: "opening" });
  const [password, setPassword] = useState("");
  const bytes = useRef<ArrayBuffer | null>(null);

  const run = async (pw?: string) => {
    try {
      setStep({ kind: "working", line: "Opening the PDF in your browser…" });
      bytes.current ??= await pdfInStudio.bytes(threadId, file.storedAs);
      const pdf = await openPdf(bytes.current, pw);
      const text = await pdfText(pdf, (n, of) => setStep({ kind: "working", line: `Looking for text: page ${n} of ${of}` }));
      if (hasTextLayer(text, pdf.numPages)) {
        setStep({ kind: "working", line: "Saving the text…" });
        await pdfInStudio.saveText(threadId, file.name, text);
        onChanged();
        setStep({ kind: "done", line: `The PDF has its own text: ${text.split(/\s+/).length.toLocaleString()} words from ${pdf.numPages} pages. It is ready for Claude; nothing had to be scanned.` });
        return;
      }
      // A scan: every page as an image, in order, then Claude Code reads them. An earlier (wrong) text copy goes first.
      await pdfInStudio.removeText(threadId, file.storedAs).catch(() => {});
      const pages = await pdfPageImages(pdf, (n, of) => setStep({ kind: "working", line: `It is a scan. Preparing page ${n} of ${of} for Claude…` }));
      for (let i = 0; i < pages.length; i++) {
        setStep({ kind: "working", line: `Sending page ${i + 1} of ${pages.length} to your Claude Code…` });
        await pdfInStudio.savePage(threadId, pageName(file.storedAs, i + 1), pages[i]);
      }
      onChanged();
      onReadPages();
      setStep({ kind: "done", line: `All ${pages.length} pages are with Claude Code, which is now reading them (follow it under Ask Claude · Results). When it finishes, the PDF shows "Text ready".` });
    } catch (e) {
      if (e instanceof PdfPasswordError) { setStep({ kind: "password", wrong: e.wrong }); return; }
      setStep({ kind: "error", line: e instanceof Error ? e.message : "The PDF couldn't be opened." });
    }
  };
  useEffect(() => { void run(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const busy = step.kind === "working" || step.kind === "opening";
  return (
    <Dialog open onOpenChange={(v) => { if (!v && !busy) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">{step.kind === "password" && <Lock className="h-4 w-4" />} Read “{file.name}”</DialogTitle>
          <DialogDescription>Your browser opens the PDF. A password stays in your browser; only the text or the page images go to your Claude Code.</DialogDescription>
        </DialogHeader>
        {step.kind === "password" ? (
          <form onSubmit={(e) => { e.preventDefault(); if (password) void run(password); }} className="space-y-2">
            <Label htmlFor="pdf-pw">{step.wrong ? "That password is not right. Try again." : "This PDF is password-protected. Its password:"}</Label>
            <Input id="pdf-pw" type="password" autoFocus autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
          </form>
        ) : (
          <p role="status" className={`text-sm ${step.kind === "error" ? "text-destructive" : ""}`}>
            {busy && <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />}{step.kind === "opening" ? "Opening…" : step.line}
          </p>
        )}
        <DialogFooter>
          {step.kind === "password" ? <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={!password} onClick={() => void run(password)}>Open the PDF</Button></>
            : <Button variant={busy ? "ghost" : "default"} disabled={busy} onClick={onClose}>{busy ? "Working…" : "Close"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
