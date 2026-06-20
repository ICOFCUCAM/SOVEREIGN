import type { Ref } from "react";
import { Sparkles, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PicturePage { text?: string; image?: string | null; illustrationPrompt?: string }
export interface PictureBookData {
  title: string;
  dedication?: string;
  coverImage?: string | null;
  pages: PicturePage[];
}

// Shared renderer for image-based children's books (illustrated storybooks and
// colouring books) used in the creators and in Library restore. The PDF export
// captures this exact element. When the illustrate handlers are omitted the book
// is read-only (e.g. restored from the Library).
const PictureBookView = ({
  book, innerRef, pageAspect = "16/9", showText = true, onIllustrateCover, onIllustratePage,
}: {
  book: PictureBookData;
  innerRef?: Ref<HTMLDivElement>;
  pageAspect?: string;
  showText?: boolean;
  onIllustrateCover?: () => void;
  onIllustratePage?: (i: number) => void;
}) => (
  <div ref={innerRef} className="space-y-6 rounded-xl bg-white p-4 sm:p-8">
    {/* Cover */}
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="relative flex aspect-[3/4] items-center justify-center bg-slate-100">
        {book.coverImage ? (
          <img src={book.coverImage} alt="Cover" crossOrigin="anonymous" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <ImageIcon className="h-10 w-10" />
            {onIllustrateCover && (
              <Button variant="heroOutline" size="sm" onClick={onIllustrateCover}><Sparkles className="w-4 h-4 mr-1" /> Illustrate cover</Button>
            )}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5">
          <div className="font-serif text-2xl font-bold text-white drop-shadow">{book.title}</div>
          {book.dedication && <div className="mt-1 text-sm text-white/85 font-sans">{book.dedication}</div>}
        </div>
      </div>
    </div>

    {/* Pages */}
    {book.pages.map((p, i) => (
      <div key={i} className="overflow-hidden rounded-xl border border-border">
        <div className="flex items-center justify-center bg-slate-100" style={{ aspectRatio: pageAspect }}>
          {p.image ? (
            <img src={p.image} alt={`Page ${i + 1}`} crossOrigin="anonymous" className="h-full w-full object-contain bg-white" />
          ) : (
            onIllustratePage && (
              <Button variant="heroOutline" size="sm" onClick={() => onIllustratePage(i)}><ImageIcon className="w-4 h-4 mr-1" /> Illustrate page {i + 1}</Button>
            )
          )}
        </div>
        {(showText && p.text) ? (
          <div className="p-5">
            <p className="font-serif text-lg leading-relaxed text-slate-900">{p.text}</p>
            <div className="mt-2 text-right text-xs text-slate-500 font-sans">{i + 1}</div>
          </div>
        ) : (
          <div className="px-5 py-2 text-right text-xs text-slate-500 font-sans">{i + 1}</div>
        )}
      </div>
    ))}
  </div>
);

export default PictureBookView;
