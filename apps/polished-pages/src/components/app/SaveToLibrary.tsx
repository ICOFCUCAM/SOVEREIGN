import { useState } from "react";
import { Save, Check, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { saveDocument, type DocKind, type DocSummary } from "@/lib/documents";
import PublishDialog from "@/components/app/PublishDialog";

const KIND_NOUN: Record<DocKind, string> = {
  cv: "CV", "cover-letter": "cover letter", book: "book", tailored: "CV",
  cover: "cover", storybook: "storybook", illustration: "illustration", audiobook: "audiobook",
};

// One-tap "Save to library" used on every preview. Idempotent per click: once
// saved it shows a confirmed state so users don't pile up duplicates — and then
// it immediately offers Publish-at-Creation, so finished work flows straight to
// the marketplace / a storefront instead of stalling as a draft.
const SaveToLibrary = ({
  kind, title, template, payload, preview, size = "sm", onSaved, savedExternally, externalId,
}: {
  kind: DocKind;
  title: string;
  template?: string | null;
  payload: unknown;
  preview?: string;
  size?: "sm" | "default";
  onSaved?: (id: string) => void;
  // The parent already persisted this document elsewhere (e.g. an on-demand save
  // to create a language edition); reflect that and don't insert a duplicate.
  savedExternally?: boolean;
  externalId?: string | null;
}) => {
  const { toast } = useToast();
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [savedId, setSavedId] = useState<string | null>(null);
  const effectiveId = savedId ?? externalId ?? null;
  const isSaved = state === "saved" || (!!savedExternally && !!effectiveId);

  const onSave = async () => {
    setState("saving");
    try {
      const id = await saveDocument({ kind, title, template, payload, preview });
      setSavedId(id);
      onSaved?.(id);
      setState("saved");
      const firstSave = !localStorage.getItem("pp_first_save");
      if (firstSave) {
        try { localStorage.setItem("pp_first_save", "1"); } catch { /* ignore */ }
        toast({ title: "🎉 Your first creation is saved!", description: "Publish it now to reach readers, schools and your storefront." });
      } else {
        toast({ title: "Saved to library", description: "Your work is ready — publish it now or find it under Library." });
      }
    } catch (e) {
      setState("idle");
      toast({ title: "Could not save", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    }
  };

  // Minimal document shape the publish dialog needs.
  const docForPublish: DocSummary = {
    id: effectiveId ?? "", kind, title, template: template ?? null, preview: preview ?? null,
    listed: false, category: null, price_cents: 0, created_at: new Date().toISOString(),
  };

  if (isSaved && effectiveId) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600 font-sans"><Check className="h-4 w-4" /> Saved</span>
        <PublishDialog
          doc={docForPublish}
          trigger={<Button variant="hero" size={size}><Store className="mr-1 h-4 w-4" /> Publish your {KIND_NOUN[kind]}</Button>}
        />
      </div>
    );
  }

  return (
    <Button variant="heroOutline" size={size} onClick={onSave} disabled={state !== "idle"}>
      {state === "saving" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
      {state === "saving" ? "Saving" : "Save"}
    </Button>
  );
};

export default SaveToLibrary;
