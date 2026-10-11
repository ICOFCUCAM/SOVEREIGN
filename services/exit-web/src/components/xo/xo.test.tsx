import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Bar, Disclosure, Provenance, ScrollRegion, Section } from "./index.js";

// The design system's accessibility contract, asserted on rendered markup:
// bars carry their number, disclosures announce state, sections are labelled
// landmarks, scroll regions are focusable, provenance is spelled out in words.

const html = (el: React.ReactElement): string => renderToStaticMarkup(el);

describe("xo design system", () => {
  it("Bar renders its numeric label and hides the decorative fill", () => {
    const out = html(<Bar value={42} label="42%" />);
    expect(out).toContain("42%");
    expect(out).toContain('aria-hidden="true"');
    expect(out).toContain("width:42%");
  });

  it("Bar clamps out-of-range values", () => {
    expect(html(<Bar value={140} />)).toContain("width:100%");
    expect(html(<Bar value={-5} />)).toContain("width:0%");
  });

  it("Disclosure exposes aria-expanded and aria-controls", () => {
    expect(html(<Disclosure open={false} onToggle={() => {}} controls="x">Why</Disclosure>)).toContain('aria-expanded="false"');
    const open = html(<Disclosure open onToggle={() => {}} controls="x">Why</Disclosure>);
    expect(open).toContain('aria-expanded="true"');
    expect(open).toContain('aria-controls="x"');
  });

  it("Section is a landmark labelled by its heading", () => {
    const out = html(<Section title="Buyer intelligence"><p>body</p></Section>);
    const id = /aria-labelledby="([^"]+)"/.exec(out)?.[1];
    expect(id).toBeTruthy();
    expect(out).toContain(`<h2 id="${id}"`);
    expect(out).toContain("Buyer intelligence</h2>");
  });

  it("ScrollRegion is keyboard-focusable and named", () => {
    const out = html(<ScrollRegion label="Buyer table"><table /></ScrollRegion>);
    expect(out).toContain('tabindex="0"');
    expect(out).toContain('role="region"');
    expect(out).toContain('aria-label="Buyer table"');
  });

  it("Provenance states the data nature in words, never as live", () => {
    expect(html(<Provenance kind="prior" />)).toContain("Prior");
    expect(html(<Provenance kind="demo" />)).toContain("Demo data");
    expect(html(<Provenance kind="snapshot" />)).toContain("Snapshot");
    expect(html(<Provenance kind="model" />).toLowerCase()).not.toContain("live");
  });
});
