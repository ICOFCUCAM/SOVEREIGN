import { useState } from "react";
import { Save, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { saveDocument, type DocKind } from "@/lib/documents";

// One-tap "Save to library" used on every preview. Idempotent per click: once
// saved it shows a confirmed state so users don't pile up duplicates.
const SaveToLibrary = ({
  kind, title, template, payload, preview, size = "sm",
}: {
  kind: DocKind;
  title: string;
  template?: string | null;
  payload: unknown;
  preview?: string;
  size?: "sm" | "default";
}) => {
  const { toast } = useToast();
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  const onSave = async () => {
    setState("saving");
    try {
      await saveDocument({ kind, title, template, payload, preview });
      setState("saved");
      toast({ title: "Saved to library", description: "Find it any time under Library." });
    } catch (e) {
      setState("idle");
      toast({ title: "Could not save", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    }
  };

  return (
    <Button variant="heroOutline" size={size} onClick={onSave} disabled={state !== "idle"}>
      {state === "saving" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        : state === "saved" ? <Check className="w-4 h-4 mr-1 text-green-600" />
        : <Save className="w-4 h-4 mr-1" />}
      {state === "saved" ? "Saved" : "Save"}
    </Button>
  );
};

export default SaveToLibrary;
