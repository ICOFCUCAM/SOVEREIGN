import { BadgeCheck, Globe, Eye, Download, Star, Link2, Check } from "lucide-react";
import { avatarColors, avatarInitials } from "@/lib/avatar";
import { coverArt } from "@/lib/cover-art";
import type { AuthorProfile } from "@/lib/profiles";

// A creator storefront header — turns an author byline into a brand: a gradient
// banner, large identity, verified status and valuable-looking stats. Works for
// author, series, publisher and educational-organization pages alike.
interface Props {
  author: string;
  profile: AuthorProfile;
  rating: { avg: number; count: number } | null;
  copied: boolean;
  onShare: () => void;
  admin?: boolean;
  onVerify?: () => void;
}

const Stat = ({ icon: Icon, value, label }: { icon?: typeof Eye; value: string | number; label: string }) => (
  <div className="rounded-xl border border-border bg-background px-3.5 py-2 text-center">
    <div className="inline-flex items-center gap-1 font-serif text-lg font-bold text-foreground">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}{value}
    </div>
    <div className="font-sans text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
  </div>
);

const CreatorStorefront = ({ author, profile, rating, copied, onShare, admin, onVerify }: Props) => {
  const g = coverArt(author);
  const av = avatarColors(author);
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-e2">
      <div className="relative h-28" style={{ backgroundImage: `linear-gradient(120deg, ${g.from}, ${g.to})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        {profile.verified && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-900 shadow">
            <BadgeCheck className="h-3.5 w-3.5 text-primary" /> Verified creator
          </span>
        )}
      </div>

      <div className="px-5 pb-5 sm:px-6">
        <div className="-mt-12 flex items-end gap-4">
          <div className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl font-serif text-3xl font-bold ring-4 ring-card ${av.bg} ${av.text}`}>
            {avatarInitials(author)}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <h1 className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tight">
              <span className="truncate">{author}</span>
            </h1>
            {profile.tagline && <p className="mt-0.5 text-sm font-medium text-foreground/80 font-sans">{profile.tagline}</p>}
          </div>
          <button
            onClick={onShare}
            className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-semibold transition-colors hover:border-primary/40 hover:text-primary sm:inline-flex"
          >
            {copied ? <><Check className="h-3.5 w-3.5 text-primary" /> Copied</> : <><Link2 className="h-3.5 w-3.5" /> Share</>}
          </button>
        </div>

        {profile.bio && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground font-sans">{profile.bio}</p>}
        {profile.website && (
          <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer nofollow"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline font-sans">
            <Globe className="h-3.5 w-3.5" /> {profile.website.replace(/^https?:\/\//, "")}
          </a>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat value={profile.works} label="Published" />
          <Stat icon={Eye} value={profile.views} label="Views" />
          <Stat icon={Download} value={profile.downloads} label="Downloads" />
          {rating ? <Stat icon={Star} value={rating.avg.toFixed(1)} label={`${rating.count} review${rating.count === 1 ? "" : "s"}`} /> : <Stat value="—" label="Reviews" />}
        </div>

        {admin && onVerify && (
          <button onClick={onVerify} className={`mt-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-sans ${profile.verified ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
            <BadgeCheck className="h-3.5 w-3.5" /> {profile.verified ? "Verified — click to remove" : "Mark verified"}
          </button>
        )}
      </div>
    </div>
  );
};

export default CreatorStorefront;
