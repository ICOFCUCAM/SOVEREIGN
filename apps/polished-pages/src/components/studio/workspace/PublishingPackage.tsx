import { useState } from "react";
import { AlertTriangle, Check, Download, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildPackage, packageChecks, type Check as PackageCheck, type PackageInput } from "@/lib/publishing-package";
import { saveFile } from "@/lib/book-export";

// Finish → Export (DESIGN-SPEC.md §21): the publishing package for KDP and IngramSpark in one download.
export default function PublishingPackage({ markdown, input }: { markdown: string; input: PackageInput }) {
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState<PackageCheck[]>(() => packageChecks(input, null));
  const [error, setError] = useState<string | null>(null);
  const blocked = checks.some((c) => !c.ok && c.level === "block");
  const make = async () => {
    setBusy(true); setError(null);
    try {
      const r = await buildPackage(markdown, input);
      setChecks(r.checks);
      if (r.checks.some((c) => !c.ok && c.level === "block") && !window.confirm("The package has problems the platforms will refuse (listed here). Download it anyway?")) return;
      saveFile(r.blob, `${input.title.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "book"}-publishing-package.zip`);
    } catch (e) { setError(e instanceof Error ? e.message : "The package couldn't be made."); }
    finally { setBusy(false); }
  };
  return (
    <section aria-label="Publishing package" className="mb-6 rounded-[14px] border border-[#E6E8ED] bg-white p-5 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#EEF2FF] text-[#4F46E5] dark:bg-[#312E81]/40"><Package className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold">Publishing package for KDP and IngramSpark</p>
          <p className="text-[13.5px] text-[#64748B]">One download: the print interior PDF (mirrored margins and gutter for its page count), the EPUB, the metadata sheet, and the cover's full size with its spine width{input.coverUrl ? ", with your front cover" : ""}.</p>
        </div>
        <Button className="rounded-full" disabled={busy} onClick={() => void make()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {busy ? "Making the package…" : "Download the package"}</Button>
      </div>
      <ul className="mt-4 grid gap-1.5 text-[13.5px] sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.text} className="flex gap-2">{c.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${c.level === "block" ? "text-[#B91C1C]" : "text-amber-600"}`} />}<span>{c.text}</span></li>
        ))}
      </ul>
      {blocked && <p className="mt-2 text-[12.5px] text-[#B91C1C]">Fix the items in red before uploading.</p>}
      {error && <p role="alert" className="mt-2 text-[13px] text-[#B91C1C]">{error}</p>}
    </section>
  );
}
