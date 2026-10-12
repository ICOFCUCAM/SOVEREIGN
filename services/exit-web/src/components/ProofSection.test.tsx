import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "../lib/i18n";
import ProofSection from "./ProofSection";
import { PROOF } from "../lib/proof";

const html = (p?: Parameters<typeof ProofSection>[0]["proof"]): string =>
  renderToStaticMarkup(<I18nProvider><ProofSection proof={p} /></I18nProvider>);

describe("ProofSection (CC4)", () => {
  it("ships empty: no invented proof", () => {
    expect(PROOF.clients.length + PROOF.quotes.length + PROOF.press.length).toBe(0);
  });
  it("renders nothing while the registry is empty", () => {
    expect(html()).toBe("");
  });
  it("renders real entries once they exist", () => {
    const out = html({
      clients: [{ name: "Example Co", permission: "test" }],
      quotes: [{ quote: "A test quote", name: "A. Person", role: "Founder", permission: "test" }],
      press: [{ outlet: "Outlet", title: "Headline", url: "https://example.org/a", date: "2026-10-12" }],
    });
    expect(out).toContain("Example Co");
    expect(out).toContain("A test quote");
    expect(out).toContain("https://example.org/a");
  });
});
