import { useCallback, useRef, useState } from "react";
import { Cpu, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { EngineId } from "@/lib/studio-backend";

const ACK = "studio.apiAck";
const acknowledged = () => { try { return sessionStorage.getItem(ACK) === "1"; } catch { return false; } };

export interface BilledRun { what: string; words?: number }

// Before any run billed to the API (design spec §6): say which engine runs it,
// that it is billed per use, and roughly how much of the book is sent. The
// owner can stop asking for the rest of this browser session. Runs on Claude
// Code (the owner's plan) never ask.
export function useApiCostNotice(engine: EngineId | null) {
  const [ask, setAsk] = useState<BilledRun | null>(null);
  const [quiet, setQuiet] = useState(false);
  const answer = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback((run: BilledRun, force?: EngineId): Promise<boolean> => {
    if ((force ?? engine) !== "api" || acknowledged()) return Promise.resolve(true);
    answer.current?.(false);
    setQuiet(false);
    setAsk(run);
    return new Promise((resolve) => { answer.current = resolve; });
  }, [engine]);

  const close = (ok: boolean) => {
    if (ok && quiet) { try { sessionStorage.setItem(ACK, "1"); } catch { /* blocked */ } }
    answer.current?.(ok); answer.current = null; setAsk(null);
  };

  const dialog = (
    <Dialog open={ask !== null} onOpenChange={(v) => { if (!v) close(false); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-sans text-[18px]"><Receipt className="h-5 w-5 text-[#B45309]" /> This run is billed to the API</DialogTitle>
          <DialogDescription className="text-[14px] leading-relaxed">
            <strong className="font-medium text-foreground">{ask?.what}</strong> runs on the Anthropic API, billed per use to the API account, not on your Claude plan.
            {ask?.words ? <> About {ask.words.toLocaleString()} words of your book are sent with it; the cost grows with the length of the text read and written.</> : null}
          </DialogDescription>
        </DialogHeader>
        <label className="flex items-center gap-2 text-[13px] text-[#475569] dark:text-[#CBD5E1]">
          <Checkbox checked={quiet} onCheckedChange={(v) => setQuiet(v === true)} /> Don't ask again in this session
        </label>
        <DialogFooter>
          <Button variant="ghost" onClick={() => close(false)}>Cancel</Button>
          <Button onClick={() => close(true)} autoFocus><Cpu className="h-4 w-4" /> Run on the API</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { confirm, dialog };
}
