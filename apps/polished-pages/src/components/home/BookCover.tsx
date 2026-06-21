// A hand-built book cover — no stock imagery. Each cover is drawn from a
// gradient, a spine highlight and editorial type, so a wall of them reads as a
// real, varied catalog rather than placeholder boxes. Used across the homepage
// visual-proof surfaces (catalog wall, showcase).

export interface BookSpec {
  title: string;
  author: string;
  from: string; // gradient start (any CSS color)
  to: string;   // gradient end
  lang?: string;
  tag?: string;
}

const BookCover = ({ spec, className = "" }: { spec: BookSpec; className?: string }) => {
  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-r-md rounded-l-[3px] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)] ring-1 ring-white/10 ${className}`}
      style={{ backgroundImage: `linear-gradient(150deg, ${spec.from}, ${spec.to})` }}
    >
      {/* Spine shadow + page edge for physicality */}
      <div className="absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/35 to-transparent" />
      <div className="absolute inset-y-0 left-[7%] w-[2px] bg-white/15" />
      {/* Sheen */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/25" />

      {/* Language chip */}
      {spec.lang && (
        <span className="absolute right-1.5 top-1.5 rounded bg-black/25 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm">
          {spec.lang}
        </span>
      )}

      {/* Editorial type block */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 pl-[12%]">
        {spec.tag && <div className="mb-1 text-[7.5px] font-semibold uppercase tracking-[0.18em] text-white/65">{spec.tag}</div>}
        <div className="font-serif text-[12px] font-bold leading-[1.05] text-white drop-shadow-sm line-clamp-3">{spec.title}</div>
        <div className="mt-1 text-[8px] font-medium uppercase tracking-wide text-white/70">{spec.author}</div>
      </div>
    </div>
  );
};

export default BookCover;
