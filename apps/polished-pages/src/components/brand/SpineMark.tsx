// The Polished Pages signature: a row of book spines in the four-pillar palette.
// It is the platform's recognizable device — used in the loading state, empty
// states and 404 — so the product reads as Polished Pages even without a logo.
// Pure CSS, so it stays crisp at any size and animates cheaply.

const SPINES = [
  { from: "hsl(221 83% 53%)", to: "hsl(221 83% 38%)", h: 0.78 }, // career
  { from: "hsl(262 83% 58%)", to: "hsl(262 83% 42%)", h: 1.0 },  // publishing
  { from: "hsl(160 84% 40%)", to: "hsl(160 84% 28%)", h: 0.86 }, // educational
  { from: "hsl(38 92% 52%)", to: "hsl(24 86% 44%)", h: 0.7 },    // marketplace
  { from: "hsl(221 83% 53%)", to: "hsl(262 83% 58%)", h: 0.92 }, // brand blend
];

const SIZES = {
  sm: { unit: 44, w: 9, gap: 4 },
  md: { unit: 72, w: 13, gap: 6 },
  lg: { unit: 104, w: 18, gap: 8 },
};

const SpineMark = ({ size = "md", animated = false, className = "" }: { size?: keyof typeof SIZES; animated?: boolean; className?: string }) => {
  const s = SIZES[size];
  return (
    <div className={`flex items-end ${className}`} style={{ gap: s.gap, height: s.unit }} aria-hidden>
      {SPINES.map((sp, i) => (
        <div
          key={i}
          className={`relative overflow-hidden rounded-t-[3px] rounded-b-sm shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)] ${animated ? "animate-book-breathe" : ""}`}
          style={{
            width: s.w,
            height: Math.round(s.unit * sp.h),
            backgroundImage: `linear-gradient(160deg, ${sp.from}, ${sp.to})`,
            transformOrigin: "bottom",
            animationDelay: animated ? `${i * 0.12}s` : undefined,
          }}
        >
          {/* binding highlight + head/tail caps */}
          <div className="absolute inset-y-0 left-[2px] w-px bg-white/25" />
          <div className="absolute inset-x-0 top-[14%] h-px bg-white/30" />
          <div className="absolute inset-x-0 bottom-[16%] h-px bg-black/20" />
        </div>
      ))}
    </div>
  );
};

export default SpineMark;
