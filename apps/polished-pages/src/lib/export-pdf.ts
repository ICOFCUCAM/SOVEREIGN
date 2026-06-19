// Capture a rendered DOM node to a PDF that matches it exactly (design, colours,
// photo), sliced across A4 pages. Image-based — the styled/visual export; text
// exports (.md/.docx) remain the machine-readable path. html2canvas + jsPDF are
// imported dynamically so they only load when an export actually happens.
export async function elementToPdf(el: HTMLElement, filename: string, bg = "#ffffff"): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: bg, useCORS: true, logging: false });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
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
