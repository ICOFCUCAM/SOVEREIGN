import { describe, it, expect } from "vitest";
import { TemplateMemorandumGenerator, runBuyerDiscovery, runInstitutionalValuation } from "@exit/engines";
import { DOCUMENT_TYPES, documentType, registryJson } from "./registry";
import { gateDocument, figureForms, confidentialTerms, disclosureFindings } from "./gate";
import { buildProfile, SAMPLE_INTAKE } from "../company-intake";
import { warmIntro } from "../warm-intro";
import { buyerIntroLetter, docToMarkdown } from "../deliverables";
import { listingFromCompany } from "../listings";
import { buildListingPost } from "../social-publish";
import { canonicalValuationFor } from "../canonical-valuation";
import { INTAKE_FIELDS } from "../active-company";

describe("document registry", () => {
  it("has one entry per stable id, in every one of the eight stages", () => {
    const ids = DOCUMENT_TYPES.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^exitos\.[a-z_]+$/);
    for (const s of [1, 2, 3, 4, 5, 6, 7, 8]) expect(DOCUMENT_TYPES.some((d) => d.stage === s), `stage ${s}`).toBe(true);
  });

  it("states only what exists: unbuilt types have no source and no formats; built ones name their source", () => {
    for (const d of DOCUMENT_TYPES) {
      if (d.status === "not_built") { expect(d.source, d.id).toBeNull(); expect(d.formats, d.id).toEqual([]); }
      else expect(d.source, d.id).toBeTruthy();
      expect(d.formats.includes("pdf" as never), d.id).toBe(false);   // no generated PDF exists yet
    }
  });

  it("lists the missing transaction spine as not built", () => {
    for (const id of ["exitos.spa", "exitos.disclosure_schedules", "exitos.escrow_agreement", "exitos.funds_flow", "exitos.post_closing_register"])
      expect(documentType(id).status).toBe("not_built");
  });

  it("depends only on known types and known intake fields", () => {
    for (const d of DOCUMENT_TYPES) {
      for (const dep of d.dependsOn ?? []) expect(() => documentType(dep), `${d.id} → ${dep}`).not.toThrow();
      for (const f of d.inputs) expect(INTAKE_FIELDS, `${d.id} input ${f}`).toContain(f);
    }
  });

  it("exports as JSON", () => {
    const j = JSON.parse(registryJson());
    expect(j.documents.length).toBe(DOCUMENT_TYPES.length);
    expect(j.schemaVersion).toBe("1.0.0");
  });
});

// A company whose name and figures are easy to spot if they leak.
const co = buildProfile({ ...SAMPLE_INTAKE, name: "Zephyrine Logistics", sector: "logistics_freight", ttmRevenueUsd: 37_400_000, arrUsd: 31_250_000, growthPct: 0.43 });
const mid = canonicalValuationFor(co, runInstitutionalValuation(co)).headline.mid;
const ctx = { company: co, unconfirmed: [] as never[], valuationMidUsd: mid };
const code = listingFromCompany(co).code;

describe("pre-NDA documents never carry the company's name or exact figures", () => {
  it("the gate recognises the name and every way a figure is written", () => {
    expect(figureForms(37_400_000)).toEqual(expect.arrayContaining(["$37,400,000", "37,400,000", "$37.4M"]));
    const leaky = "Subject: Introduction — Zephyrine Logistics ($37.4M revenue)";
    const f = disclosureFindings(leaky, confidentialTerms(co));
    expect(f.map((x) => x.kind).sort()).toEqual(["company_name", "exact_figure"]);
    expect(gateDocument("exitos.warm_intro", leaky, ctx).blocked).toBe(true);
  });

  it("warm introduction", () => {
    const c = runBuyerDiscovery(co, { limit: 3 }).candidates[0];
    expect(gateDocument("exitos.warm_intro", warmIntro(c, co), ctx).disclosure).toEqual([]);
  });

  it("introduction letter", () => {
    const c = runBuyerDiscovery(co, { limit: 3 }).candidates[0];
    const letter = buyerIntroLetter({ buyer: c, projectName: code, fromName: "Founder" });
    expect(gateDocument("exitos.intro_letter", letter, ctx).disclosure).toEqual([]);
  });

  it("teaser, under the company's own code name", async () => {
    const doc = await new TemplateMemorandumGenerator().generate("buyer_teaser", { company: co, valuation: canonicalValuationFor(co, runInstitutionalValuation(co)), anonymize: true, codeName: code });
    const md = docToMarkdown(doc);
    expect(gateDocument("exitos.teaser", md, ctx).disclosure).toEqual([]);
    expect(md).toContain(code);
    expect(md).not.toContain("Project Cipher");
  });

  it("listing post", () => {
    const post = buildListingPost(listingFromCompany(co), "https://exit.example");
    expect(gateDocument("exitos.listing_post", `${post.title}\n${post.text}`, ctx).disclosure).toEqual([]);
  });

  it("internal documents are not gated on disclosure, only on inputs", () => {
    const g = gateDocument("exitos.valuation_summary", "Zephyrine Logistics $37.4M", { ...ctx, unconfirmed: ["grossMarginPct"] });
    expect(g.disclosure).toEqual([]);
    expect(g.unconfirmed).toEqual(["grossMarginPct"]);
    expect(g.blocked).toBe(false);
  });
});
