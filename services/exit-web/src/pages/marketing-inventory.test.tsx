import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "../lib/i18n";
import Landing from "./Landing";
import Platform from "./Platform";
import Modules from "./Modules";
import Pricing from "./Pricing";

// Phase 4 (HOMEPAGE.md V6): every original homepage block, and the U1/U2
// upgrades, renders on exactly one marketing page after the repositioning
// (page content inside <main>; the shared header and footer are excluded).

const PAGES: Record<string, React.FC> = { "/": Landing, "/platform": Platform, "/modules": Modules, "/pricing": Pricing };
const text = (C: React.FC): string =>
  (renderToStaticMarkup(<MemoryRouter><I18nProvider><C /></I18nProvider></MemoryRouter>).match(/<main[^>]*>([\s\S]*)<\/main>/)?.[1] ?? "")
    .replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, " ");

const BLOCKS: Record<string, string> = {
  "hero headline": "The global acquisition exchange", // owner's index(2) hero (HOMEPAGE.md DD2)
  "command board": "ExitOS Acquisition Exchange",
  "proof ribbon": "Disclosed acquisitions indexed",
  "trust strip": "Curated Acquirer Network",
  "lifecycle": "The acquisition lifecycle",
  "market structure": "Market structure · who trades",
  "workflow": "Run your entire company sale",
  "buyer intelligence": "Real appetite.",
  "data provenance": "Sourced. Referenced.",
  "confidence register": "Confidence register",
  "ledger": "The ExitOS Ledger",
  "data rooms": "data rooms.",
  "negotiation desk": "Negotiate with clarity.",
  "example listings": "Example listings — illustrative",
  "global reach": "Global reach.",
  "losses matrix": "Why founders lose millions",
  "governance": "Governance & controls",
  "final call to action": "Bring your company to market.",
  "value your company": "What is your company worth?",
};

describe("marketing inventory", () => {
  const rendered = Object.fromEntries(Object.entries(PAGES).map(([r, C]) => [r, text(C)]));

  for (const [name, needle] of Object.entries(BLOCKS)) {
    it(`${name} renders on exactly one page`, () => {
      const on = Object.keys(rendered).filter((r) => rendered[r]!.toLowerCase().includes(needle.toLowerCase()));
      expect(on, `${name} found on ${on.join(", ") || "no page"}`).toHaveLength(1);
    });
  }

  it("keeps the homepage to its six moments", () => {
    const home = rendered["/"]!;
    for (const gone of ["Run your entire company sale", "Real appetite.", "Negotiate with clarity.", "Global reach.", "Governance & controls"]) {
      expect(home.includes(gone), gone).toBe(false);
    }
  });

  it("lists sources on every page that cites them", () => {
    for (const r of ["/", "/platform", "/modules"]) expect(rendered[r]).toContain("Sources & method");
  });
});
