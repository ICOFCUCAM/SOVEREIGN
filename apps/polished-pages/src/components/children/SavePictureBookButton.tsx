import { useState } from "react";
import { Save, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { savePictureBook, type PictureBookSaveOpts } from "@/lib/picture-book-save";
import type { PictureBookData } from "@/components/children/PictureBookView";

// Saves an illustrated picture book to the Library (uploading its images to
// storage first). `build` is called on click so it captures the latest images.
// `savedExternally` lets the parent mark the book already persisted (e.g. it was
// saved on demand to create a language edition), so this button reflects that
// and won't insert a duplicate.
const SavePictureBookButton = ({ build, onSaved, savedExternally }: { build: () => { book: PictureBookData } & PictureBookSaveOpts; onSaved?: (id: string) => void; savedExternally?: boolean }) => {
  const { toast } = useToast();
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const saved = state === "saved" || !!savedExternally;

  const onSave = async () => {
    setState("saving");
    try {
      const { book, ...opts } = build();
      const id = await savePictureBook(book, opts);
      onSaved?.(id);
      setState("saved");
      toast({ title: "Saved to library", description: "Find it any time under Library." });
    } catch (e) {
      setState("idle");
      toast({ title: "Could not save", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    }
  };

  return (
    <Button variant="heroOutline" size="sm" onClick={onSave} disabled={state === "saving" || saved}>
      {state === "saving" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        : saved ? <Check className="w-4 h-4 mr-1 text-green-600" />
        : <Save className="w-4 h-4 mr-1" />}
      {saved ? "Saved" : "Save"}
    </Button>
  );
};

export default SavePictureBookButton;
