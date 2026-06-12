import { describe, expect, it } from "vitest";
import { translate, type Locale } from "./i18n.js";

// The catalog keys the homepage + chrome actually use. If a key is added to
// the page but missing from FR/ES, the fallback makes it resolve to English —
// these tests catch raw-key leaks and unfilled placeholders in every locale,
// and assert FR/ES are real translations rather than copies of English.

const KEYS = [
  "nav.platform", "nav.modules", "nav.pricing", "nav.login", "nav.access", "nav.language",
  "hero.eyebrow", "hero.h1", "hero.sub", "hero.body", "hero.deploy",
  "ribbon.deals", "ribbon.mandates", "ribbon.value", "ribbon.deploying",
  "trust.network.m", "trust.network.t", "trust.network.s", "trust.soc.t", "trust.soc.s",
  "trust.control.t", "trust.control.s", "trust.audit.m", "trust.audit.t", "trust.audit.s",
  "lifecycle.title", "lifecycle.live",
  "lc.signal", "lc.discovery", "lc.nda", "lc.cim", "lc.meetings", "lc.loi", "lc.diligence", "lc.closing",
  "ms.eyebrow", "ms.strategic", "ms.strategic.meta", "ms.pe", "ms.pe.meta", "ms.fo", "ms.fo.meta",
  "ms.advisors", "ms.advisors.meta", "ms.corpdev", "ms.corpdev.meta",
  "wf.eyebrow", "wf.h2",
  "bi.eyebrow", "bi.h2", "bi.link",
  "prov.eyebrow", "prov.h2", "prov.body",
  "dr.eyebrow", "dr.h2", "dr.body", "dr.link",
  "neg.eyebrow", "neg.h2", "neg.body", "neg.link",
  "mp.eyebrow", "mp.h2", "mp.body", "mp.link",
  "cov.eyebrow", "cov.h2", "cov.body",
  "loss.eyebrow", "loss.h2", "loss.body",
  "rec.eyebrow", "rec.h2", "rec.body", "rec.bridge", "rec.run",
  "gov.eyebrow", "gov.note", "gov.nda.t", "gov.nda.b", "gov.verify.t", "gov.verify.b",
  "gov.audit.t", "gov.audit.b", "gov.control.t", "gov.control.b", "gov.soc.t", "gov.soc.b",
  "cta.eyebrow", "cta.h2", "cta.body", "cta.open", "cta.brief", "cta.foot",
  "ft.tagline", "ft.exchange", "ft.founders", "ft.acquirers", "ft.list", "ft.valuation",
  "ft.plans", "ft.browse", "ft.buyeraccess", "ft.requestnda", "ft.soc", "ft.audit", "ft.ndagated", "ft.legal",
];

const VARS = { n: 1, g: 2, s: 3, p: "+10%", d: "30 days" };

describe("i18n catalogs", () => {
  for (const locale of ["en", "fr", "es"] as Locale[]) {
    it(`${locale}: every homepage key resolves and interpolates`, () => {
      for (const k of KEYS) {
        const v = translate(locale, k, VARS);
        expect(v, `${locale}:${k}`).not.toBe(k);                 // not a raw key
        expect(v, `${locale}:${k}`).not.toMatch(/\{[a-z]+\}/);   // no unfilled {placeholder}
        expect(v.length, `${locale}:${k}`).toBeGreaterThan(1);
      }
    });
  }

  it("fr and es differ from en on narrative keys (real translations, not copies)", () => {
    for (const k of ["hero.h1", "hero.body", "cta.h2", "ft.legal", "mp.body"]) {
      expect(translate("fr", k)).not.toBe(translate("en", k));
      expect(translate("es", k)).not.toBe(translate("en", k));
    }
  });

  it("unknown keys fall back to english, then the key itself", () => {
    expect(translate("fr", "hero.eyebrow")).toBe("La Bourse Mondiale des Acquisitions");
    expect(translate("fr", "nonexistent.key")).toBe("nonexistent.key");
  });
});
