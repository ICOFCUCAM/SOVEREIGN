// Capture a rendered DOM node to a PDF that matches it exactly (design, colours,
// photo), sliced across A4 pages. Image-based — the styled/visual export; text
// exports (.md/.docx) remain the machine-readable path. html2canvas + jsPDF are
// imported dynamically so they only load when an export actually happens.
// `trim` lets the caller export at a print trim size (in mm) for POD targets like
// KDP/IngramSpark; default is A4.
export async function elementToPdf(el: HTMLElement, filename: string, bg = "#ffffff", trim?: { w: number; h: number }): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  // Browsers cap canvas dimensions and total area; a long book at scale 2 blows
  // past them ("Canvas exceeds max size"). Pick the largest scale (≤2) that keeps
  // both dimensions and the total area within safe limits so long documents
  // export at reduced resolution instead of failing outright.
  const w = el.scrollWidth || el.offsetWidth || 800;
  const h = el.scrollHeight || el.offsetHeight || 1000;
  const MAX_DIM = 12000;        // conservative per-axis pixel cap
  const MAX_AREA = 96_000_000;  // conservative total-pixel cap
  const scale = Math.max(0.5, Math.min(2, MAX_DIM / w, MAX_DIM / h, Math.sqrt(MAX_AREA / (w * h))));
  const canvas = await html2canvas(el, { scale, backgroundColor: bg, useCORS: true, logging: false });
  const imgData = canvas.toDataURL("image/png");
  const pdf = trim ? new jsPDF({ orientation: trim.w > trim.h ? "l" : "p", unit: "mm", format: [trim.w, trim.h] }) : new jsPDF("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pageW) / canvas.width;

  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(imgData, "PNG", 0, position, pageW, imgH);
  heightLeft -= pageH;
  while (heightLeft > 0) {
    position = heightLeft - imgH;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, pageW, imgH);
    heightLeft -= pageH;
  }
  pdf.save(filename);
}
