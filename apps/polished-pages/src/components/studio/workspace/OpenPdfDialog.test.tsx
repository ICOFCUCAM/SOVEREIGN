import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const m = vi.hoisted(() => ({
  bytes: vi.fn(async () => new ArrayBuffer(4)), saveText: vi.fn(async () => ({})), savePage: vi.fn(async () => ({})),
  open: vi.fn(), text: vi.fn(), images: vi.fn(async () => [new Blob(["a"]), new Blob(["b"])]),
}));
vi.mock("@/lib/claude-studio", () => ({ pdfInStudio: { bytes: m.bytes, saveText: m.saveText, savePage: m.savePage } }));
const P = vi.hoisted(() => class PdfPasswordError extends Error { wrong: boolean; constructor(wrong: boolean) { super("pw"); this.wrong = wrong; } });
vi.mock("@/lib/pdf-unlock", () => {
  return { PdfPasswordError: P, openPdf: m.open, pdfText: m.text, pdfPageImages: m.images, hasTextLayer: (t: string) => t.split(/\s+/).length >= 50, pageName: (s: string, n: number) => `${s.replace(/\.[^.]+$/, "")}-p${String(n).padStart(3, "0")}.jpg` };
});
import OpenPdfDialog from "./OpenPdfDialog";

const file = { name: "onenessofgod.pdf", storedAs: "onenessofgod.pdf", kind: "original" as const, bytes: 10, at: "" };

describe("opening a PDF the runner can't read", () => {
  it("asks for the password, then keeps the PDF's own text", async () => {
    m.open.mockReset().mockRejectedValueOnce(new P(false)).mockResolvedValueOnce({ numPages: 2 });
    m.text.mockReset().mockResolvedValue("word ".repeat(80));
    const onChanged = vi.fn(), onReadPages = vi.fn();
    render(<OpenPdfDialog threadId="t1" file={file} onClose={() => {}} onChanged={onChanged} onReadPages={onReadPages} />);
    fireEvent.change(await screen.findByLabelText(/password-protected/), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Open the PDF" }));
    expect(await screen.findByText(/has its own text/)).toBeTruthy();
    expect(m.open).toHaveBeenLastCalledWith(expect.any(ArrayBuffer), "secret");
    expect(m.saveText).toHaveBeenCalledWith("t1", "onenessofgod.pdf", expect.stringContaining("word"));
    expect(onReadPages).not.toHaveBeenCalled();
    expect(onChanged).toHaveBeenCalled();
  });

  it("sends a scan's pages to Claude Code as images and starts reading them", async () => {
    m.open.mockReset().mockResolvedValue({ numPages: 2 });
    m.text.mockReset().mockResolvedValue("");
    const onReadPages = vi.fn();
    render(<OpenPdfDialog threadId="t1" file={file} onClose={() => {}} onChanged={() => {}} onReadPages={onReadPages} />);
    await waitFor(() => expect(onReadPages).toHaveBeenCalled());
    expect(m.savePage.mock.calls.map((c) => c[1])).toEqual(["onenessofgod-p001.jpg", "onenessofgod-p002.jpg"]);
    expect(await screen.findByText(/All 2 pages are with Claude Code/)).toBeTruthy();
  });

  it("says when the password is wrong", async () => {
    m.open.mockReset().mockRejectedValueOnce(new P(false)).mockRejectedValueOnce(new P(true));
    render(<OpenPdfDialog threadId="t1" file={file} onClose={() => {}} onChanged={() => {}} onReadPages={() => {}} />);
    fireEvent.change(await screen.findByLabelText(/password-protected/), { target: { value: "nope" } });
    fireEvent.click(screen.getByRole("button", { name: "Open the PDF" }));
    expect(await screen.findByText(/That password is not right/)).toBeTruthy();
  });
});
