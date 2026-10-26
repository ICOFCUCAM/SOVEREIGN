// The owner's chosen interior design (style, typefaces, size), remembered in
// this browser and used by every interior PDF export (Book Creator, Library
// reader, Export center, Production).
import type { BookFaceId } from "@/lib/typeset/font-files";
import { BODY_FACES, HEADING_FACES } from "@/lib/typeset/font-files";
import { INTERIOR_STYLES, styleById, type InteriorStyleId } from "@/lib/typeset/styles";

export interface InteriorType { style: InteriorStyleId; body: BookFaceId; heading: BookFaceId; size: number }
const KEY = "pp.interiorType";
const classic = styleById("classic");
export const DEFAULT_INTERIOR: InteriorType = { style: "classic", body: classic.faces.body, heading: classic.faces.heading, size: classic.size };

export function getInteriorType(): InteriorType {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<InteriorType> | null;
    const style = v?.style && INTERIOR_STYLES.some((s) => s.id === v.style) ? v.style : DEFAULT_INTERIOR.style;
    const S = styleById(style);
    return {
      style,
      body: v?.body && BODY_FACES.includes(v.body) ? v.body : S.faces.body,
      heading: v?.heading && HEADING_FACES.includes(v.heading) ? v.heading : S.faces.heading,
      size: typeof v?.size === "number" && v.size >= 9 && v.size <= 16 ? v.size : S.size,
    };
  } catch { return DEFAULT_INTERIOR; }
}
export function setInteriorType(t: InteriorType) { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* private mode */ } }
/** Choosing a style brings its own typefaces and size, which can then be changed. */
export function withStyle(id: InteriorStyleId): InteriorType {
  const S = styleById(id);
  return { style: id, body: S.faces.body, heading: S.faces.heading, size: S.size };
}
