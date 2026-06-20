import { useState } from "react";
import { Save, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { savePictureBook, type PictureBookSaveOpts } from "@/lib/picture-book-save";
import type { PictureBookData } from "@/components/children/PictureBookView";

// Saves an illustrated picture book to the Library (uploading its images to
// storage first). `build` is called on click so it captures the latest images.
const SavePictureBookButton = ({ build }: { build: () => { book: PictureBookData } & PictureBookSaveOpts }) => {
  const { toast } = useToast();
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  const onSave = async () => {
    setState("saving");
    try {
      const { book, ...opts } = build();
      await savePictureBook(book, opts);
      setState("saved");
      toast({ title: "Saved to library", description: "Find it any time under Library." });
    } catch (e) {
      setState("idle");
      toast({ title: "Could not save", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    }
  };

  return (
    <Button variant="heroOutline" size="sm" onClick={onSave} disabled={state !== "idle"}>
      {state === "saving" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        : state === "saved" ? <Check className="w-4 h-4 mr-1 text-green-600" />
        : <Save className="w-4 h-4 mr-1" />}
      {state === "saved" ? "Saved" : "Save"}
    </Button>
  );
};

export default SavePictureBookButton;
