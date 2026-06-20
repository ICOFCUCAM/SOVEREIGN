import type { Ref } from "react";
import { FONT_FAMILY } from "@/lib/fonts";
import { getBookTheme, type BookTheme } from "@/lib/book-themes";
import { isRtlText } from "@/lib/languages";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s: string) =>
  esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");

// Render markdown book content into a themed page. Inline styles only, so the
// design is captured faithfully by the image-based PDF export.
function renderBook(content: string, t: BookTheme, rtl: boolean): string {
  const body = FONT_FAMILY[t.body];
  const disp = FONT_FAMILY[t.display];
  const align = rtl && t.align === "left" ? "right" : t.align;
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let chapterNo = 0;
  let chapterFirstPara = false;
  let inList = false;
  const closeList = () => { if (inList) { out.push("</ul>"); inList = false; } };

  const chapterHtml = (text: string): string => {
    chapterNo += 1;
    const label = inline(text);
    if (t.chapter === "centered-caps")
      return `<h2 style="font-family:${disp};color:${t.heading};text-align:center;text-transform:uppercase;letter-spacing:.14em;font-size:${t.size * 1.15}px;font-weight:700;margin:2.6em 0 1.3em">${label}</h2>`;
    if (t.chapter === "left-bold")
      return `<h2 style="font-family:${disp};color:${t.heading};font-size:${t.size * 1.55}px;font-weight:800;letter-spacing:-.01em;margin:2.4em 0 1em">${label}</h2>`;
    if (t.chapter === "numbered")
      return `<h2 style="font-family:${disp};color:${t.heading};font-size:${t.size * 1.3}px;font-weight:700;margin:2.4em 0 1em;border-bottom:2px solid ${t.heading};padding-bottom:.3em"><span style="opacity:.5">${chapterNo}.</span> ${label}</h2>`;
    // rule
    return `<h2 style="font-family:${disp};color:${t.heading};font-size:${t.size * 1.25}px;font-weight:700;margin:2.6em 0 1.1em;text-align:center"><span style="display:block;width:40px;height:2px;background:${t.heading};margin:0 auto .8em;opacity:.5"></span>${label}</h2>`;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const tr = line.trim();

    if (/^#\s+/.test(tr)) {
      closeList();
      out.push(`<h1 style="font-family:${disp};color:${t.heading};text-align:center;font-size:${t.size * 2}px;font-weight:800;margin:.2em 0 1.4em;letter-spacing:-.01em">${inline(tr.replace(/^#\s+/, ""))}</h1>`);
      continue;
    }
    if (/^##\s+/.test(tr)) {
      closeList();
      out.push(chapterHtml(tr.replace(/^##\s+/, "")));
      chapterFirstPara = true;
      continue;
    }
    if (/^###\s+/.test(tr)) {
      closeList();
      out.push(`<h3 style="font-family:${disp};color:${t.heading};font-size:${t.size * 1.1}px;font-weight:700;margin:1.6em 0 .6em">${inline(tr.replace(/^###\s+/, ""))}</h3>`);
      continue;
    }
    if (/^[-*]\s+/.test(tr)) {
      if (!inList) { out.push(`<ul style="margin:.4em 0 1em 1.4em;padding:0">`); inList = true; }
      out.push(`<li style="font-family:${body};color:${t.ink};font-size:${t.size}px;line-height:${t.leading};margin:.25em 0">${inline(tr.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (tr === "") { closeList(); continue; }

    closeList();
    let html = inline(tr);
    const first = chapterFirstPara;
    chapterFirstPara = false;

    if (first && t.dropCap && /\w/.test(tr[0] ?? "")) {
      const ch = tr[0];
      html = `<span style="float:left;font-family:${disp};font-size:${t.size * 3.2}px;line-height:.72;padding:.02em .08em 0 0;font-weight:700;color:${t.heading}">${esc(ch)}</span>${inline(tr.slice(1))}`;
    }
    const indent = !first && t.indent ? `text-indent:${t.size * 1.6}px;` : "";
    out.push(`<p style="font-family:${body};color:${t.ink};font-size:${t.size}px;line-height:${t.leading};text-align:${align};margin:0 0 ${first ? "1em" : ".2em"};${indent}">${html}</p>`);
  }
  closeList();
  return out.join("");
}

const BookPaper = ({ content, themeId, innerRef }: { content: string; themeId?: string; innerRef?: Ref<HTMLDivElement> }) => {
  const t = getBookTheme(themeId);
  const rtl = isRtlText(content);
  return (
    <div
      ref={innerRef}
      dir={rtl ? "rtl" : "ltr"}
      className="rounded-xl border shadow-premium overflow-hidden"
      style={{ background: t.paper, borderColor: "rgba(0,0,0,0.08)" }}
    >
      <div
        style={{ maxWidth: 640, margin: "0 auto", padding: "3.5rem 3rem" }}
        dangerouslySetInnerHTML={{ __html: renderBook(content, t, rtl) }}
      />
    </div>
  );
};

export default BookPaper;
