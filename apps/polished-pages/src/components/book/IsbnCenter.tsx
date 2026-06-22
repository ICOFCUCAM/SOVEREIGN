import { BookKey, Check, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

// ISBN Center — guidance only. We don't sell ISBNs; we remove the confusion
// about how to get one and which path fits the author's goals.
const PATHS = [
  {
    title: "Free KDP / Amazon ISBN",
    best: "Best for: publishing on Amazon first, fastest path.",
    points: [
      "Amazon assigns a free ISBN to your paperback/hardcover at publish.",
      "Amazon (KDP) is listed as the publisher of record.",
      "It can’t be reused on IngramSpark or under your own imprint.",
    ],
  },
  {
    title: "Bring your own ISBN",
    best: "Best for: a professional imprint and wide distribution.",
    points: [
      "Buy from your national ISBN agency — you are the publisher of record.",
      "Lets you publish under your own imprint, consistently across Amazon, IngramSpark and bookstores.",
      "You need one ISBN per format (paperback, hardcover, ebook) and per edition.",
    ],
  },
  {
    title: "No ISBN",
    best: "Best for: ebooks and audiobooks, digital-only.",
    points: [
      "Kindle, Apple Books and audiobook stores assign their own IDs (ASIN/SKU).",
      "An ISBN isn’t required to sell a digital edition.",
      "Add one later if you move into print or wide distribution.",
    ],
  },
];

const IsbnCenter = ({ trigger }: { trigger: React.ReactNode }) => (
  <Dialog>
    <DialogTrigger asChild>{trigger}</DialogTrigger>
    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 font-serif"><BookKey className="h-5 w-5 text-primary" /> ISBN Center</DialogTitle>
        <DialogDescription>An ISBN identifies your book to retailers and libraries. Here’s how to get one — and which path fits your goals.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        {PATHS.map((p) => (
          <div key={p.title} className="rounded-lg border border-border bg-card/50 p-3">
            <div className="font-sans text-sm font-semibold">{p.title}</div>
            <div className="text-[11px] text-primary font-sans">{p.best}</div>
            <ul className="mt-2 space-y-1">
              {p.points.map((pt) => (
                <li key={pt} className="flex items-start gap-2 text-xs text-muted-foreground font-sans"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> {pt}</li>
              ))}
            </ul>
          </div>
        ))}
        <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3 text-xs font-sans">
          <div className="font-semibold text-foreground">Get your own ISBN</div>
          <p className="mt-1 text-muted-foreground">ISBNs are issued by a national agency (e.g. Bowker in the US, Nielsen in the UK). Find yours at the official directory:</p>
          <a href="https://www.isbn-international.org/converter/agencies" target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 font-medium text-primary hover:underline">
            ISBN agency finder <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <p className="text-[11px] text-muted-foreground font-sans">
          Once you have an ISBN, enter it under <span className="font-medium">Publishing details</span> and set its status to <span className="font-medium">Assigned</span> (then <span className="font-medium">Registered</span> once it’s filed with your retailer).
        </p>
      </div>
    </DialogContent>
  </Dialog>
);

export default IsbnCenter;
