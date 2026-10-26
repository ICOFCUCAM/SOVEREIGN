import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CoverGenerator from "@/components/book/CoverGenerator";
import type { CoverCopyWriter } from "@/lib/cover-copy";

// Cover Studio for a book in Claude Studio (My books, or the manuscript's
// Finish step). The cover is saved with the book; the copy is written by
// whichever engine is in use, and the button says which.
export default function CoverDialog({ title, author, bookId, ensureSaved, bookText, copyWriter, onClose, onSaved }: {
  title: string; author?: string; bookId?: string | null; ensureSaved?: () => Promise<string | null | undefined>;
  bookText: () => Promise<string> | string; copyWriter?: CoverCopyWriter; onClose: () => void; onSaved?: (coverId: string) => void;
}) {
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Cover · {title}</DialogTitle>
          <DialogDescription>Front, spine and back, typeset over text-free artwork, with print-ready files. Artwork comes from OpenAI's image model (billed per use) or your own image; Claude writes the copy.</DialogDescription>
        </DialogHeader>
        <CoverGenerator title={title} author={author} bookId={bookId} ensureSaved={ensureSaved} bookText={bookText} copyWriter={copyWriter} onSaved={onSaved} />
      </DialogContent>
    </Dialog>
  );
}
