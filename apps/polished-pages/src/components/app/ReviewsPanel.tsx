import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { listReviews, submitReview, type Review } from "@/lib/reviews";

const Stars = ({ value, size = "h-4 w-4" }: { value: number; size?: string }) => (
  <span className="inline-flex items-center" aria-label={`${value.toFixed(1)} of 5`}>
    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`${size} ${i <= Math.round(value) ? "fill-gold text-gold" : "text-muted-foreground/40"}`} />)}
  </span>
);

// Public ratings & reviews for a marketplace item, with a submit form for
// signed-in readers (one review per reader; not your own work — enforced server-side).
const ReviewsPanel = ({ token }: { token: string }) => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => { listReviews(token).then(setReviews).catch(() => setReviews([])); };
  useEffect(() => { load(); supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session)); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    setBusy(true);
    try {
      await submitReview(token, rating, body);
      setBody("");
      load();
      toast({ title: "Thanks for your review" });
    } catch (e) {
      toast({ title: "Could not submit", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const avg = reviews && reviews.length > 0 ? Number(reviews[0].avg_rating ?? 0) : 0;
  const count = reviews && reviews.length > 0 ? reviews[0].review_count : 0;

  return (
    <div className="mt-10 border-t border-border pt-8">
      <div className="flex items-center gap-3">
        <h2 className="font-serif text-xl font-bold">Reviews</h2>
        {count > 0 && <div className="flex items-center gap-1.5"><Stars value={avg} /><span className="text-sm text-muted-foreground font-sans">{avg.toFixed(1)} · {count}</span></div>}
      </div>

      {/* Submit */}
      <div className="mt-4 rounded-xl border border-border bg-card/50 p-4">
        {signedIn ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm font-sans">Your rating:</span>
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} star`}>
                  <Star className={`h-5 w-5 ${i <= rating ? "fill-gold text-gold" : "text-muted-foreground/40"}`} />
                </button>
              ))}
            </div>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} maxLength={1000} placeholder="Share what you thought (optional)…" className="mt-3 resize-none" />
            <Button variant="hero" size="sm" className="mt-3" disabled={busy} onClick={submit}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Submit review
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground font-sans"><Link to="/dashboard" className="text-primary hover:underline">Sign in</Link> to rate and review this item.</p>
        )}
      </div>

      {/* List */}
      {reviews === null ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground font-sans"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : reviews.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground font-sans">No reviews yet — be the first.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reviews.map((r, i) => (
            <li key={i} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium font-sans">{r.reviewer}</span>
                <Stars value={r.rating} size="h-3.5 w-3.5" />
              </div>
              {r.body && <p className="mt-1 text-sm text-muted-foreground font-sans">{r.body}</p>}
              <div className="mt-1 text-[11px] text-muted-foreground font-sans">{new Date(r.created_at).toLocaleDateString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReviewsPanel;
