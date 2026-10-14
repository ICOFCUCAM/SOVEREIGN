import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import {
  campaignState, selectCampaigns, checkUrl, validateCampaign, checkImage, imagePath, sumStats, emptyDraft,
  loadSlides, saveCampaign, DEFAULT_SETTINGS, type Campaign,
} from "./ads";
import { AdPanel } from "../components/AdPanel";

const NOW = Date.parse("2026-10-14T12:00:00Z");
const c = (over: Partial<Campaign>): Campaign => ({ ...emptyDraft(), id: over.id ?? crypto.randomUUID(), name: "N", headline: "H", status: "published", ...over } as Campaign);
const iso = (h: number): string => new Date(NOW + h * 3_600_000).toISOString();

describe("campaign state and selection", () => {
  it("derives every state from status and schedule", () => {
    expect(campaignState(c({ status: "draft" }), NOW)).toBe("Draft");
    expect(campaignState(c({ status: "paused" }), NOW)).toBe("Paused");
    expect(campaignState(c({ status: "archived" }), NOW)).toBe("Archived");
    expect(campaignState(c({ starts_at: iso(1) }), NOW)).toBe("Scheduled");
    expect(campaignState(c({ ends_at: iso(-1) }), NOW)).toBe("Expired");
    expect(campaignState(c({ starts_at: iso(-1), ends_at: iso(1) }), NOW)).toBe("Published");
  });
  it("shows only live campaigns for the stage, by priority then the operator's order, and respects the phone setting", () => {
    const list = [
      c({ id: "a", position: 0 }), c({ id: "b", position: 1, priority: 5 }), c({ id: "c", position: 2, status: "draft" }),
      c({ id: "d", position: 3, stages: ["review"] }), c({ id: "e", position: 4, starts_at: iso(2) }), c({ id: "f", position: 5, mobile: false }),
    ];
    expect(selectCampaigns(list, "identity", { now: NOW }).map((x) => x.id)).toEqual(["b", "a", "f"]);
    expect(selectCampaigns(list, "identity", { now: NOW, mobile: true }).map((x) => x.id)).toEqual(["b", "a"]);
    expect(selectCampaigns(list, "review", { now: NOW }).map((x) => x.id)).toEqual(["b", "a", "d", "f"]);
  });
});

describe("what an operator enters is validated", () => {
  it("accepts only https destinations with a real host", () => {
    expect(checkUrl("https://dispatch.example.com/product?ref=exitos")).toBeNull();
    for (const bad of ["javascript:alert(1)", "http://example.com", "https://user:pw@example.com", "data:text/html,x", "https://localhost", "example.com", ""]) expect(checkUrl(bad)).not.toBeNull();
  });
  it("requires a name and headline, pairs a call to action with a destination, an alt text with an image, and an image to publish", () => {
    expect(Object.keys(validateCampaign(emptyDraft()))).toEqual(expect.arrayContaining(["name", "headline"]));
    const d = { ...emptyDraft(), name: "Dispatch", headline: "Records that stand up" };
    expect(validateCampaign(d)).toEqual({});
    expect(validateCampaign({ ...d, cta_label: "Explore" }).cta_url).toBeTruthy();
    expect(validateCampaign({ ...d, cta_url: "https://example.com" }).cta_label).toBeTruthy();
    expect(validateCampaign({ ...d, image_path: "x" }).image_alt).toBeTruthy();
    expect(validateCampaign(d, true).image_path).toBeTruthy();
    expect(validateCampaign(d, true).cta_url).toBeTruthy();
    expect(validateCampaign({ ...d, image_path: "p", image_alt: "a", cta_url: "https://example.com", cta_label: "Explore" }, true)).toEqual({});
    expect(validateCampaign({ ...d, stages: [] }).stages).toBeTruthy();
    expect(validateCampaign({ ...d, starts_at: iso(2), ends_at: iso(1) }).schedule).toBeTruthy();
  });
  it("accepts raster images up to 5 MB, never SVG, and names them in the pattern the server enforces", () => {
    expect(checkImage({ type: "image/webp", size: 1000 })).toBeNull();
    expect(checkImage({ type: "image/svg+xml", size: 1000 })).not.toBeNull();
    expect(checkImage({ type: "image/png", size: 6 * 1024 * 1024 })).not.toBeNull();
    expect(imagePath("image/jpeg")).toMatch(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg|jpeg|png|avif)$/);
  });
  it("adds up daily counts per campaign", () => {
    expect(sumStats([{ campaign_id: "a", impressions: 3, clicks: 1 }, { campaign_id: "a", impressions: 2, clicks: 0 }, { campaign_id: "b", impressions: 1, clicks: 1 }]))
      .toEqual({ a: { impressions: 5, clicks: 1 }, b: { impressions: 1, clicks: 1 } });
  });
});

describe("talking to the server", () => {
  const remote = (handler: (url: string, init?: RequestInit) => unknown, status = 200) => ({
    url: "https://x.supabase.co", anonKey: "anon", accessToken: "tok",
    fetchImpl: (async (u: string, init?: RequestInit) => new Response(JSON.stringify(handler(u, init)), { status })) as typeof fetch,
  });
  it("loads live slides for the stage and signs only their images", async () => {
    const signed: string[][] = [];
    const r = remote((u, init) => {
      if (u.includes("exitos_ad_campaigns")) return [c({ id: "a", image_path: "p/a.webp" }), c({ id: "b", status: "draft", image_path: "p/b.webp" })];
      if (u.includes("exitos_ad_settings")) return [{ rotation_seconds: 9, mobile_enabled: false }];
      if (u.includes("/object/sign/exitos-ads")) { const b = JSON.parse(String(init?.body)) as { paths: string[] }; signed.push(b.paths); return b.paths.map((p) => ({ path: p, signedURL: `/object/sign/exitos-ads/${p}?token=t` })); }
      return [];
    });
    const { slides, settings } = await loadSlides(r, "identity");
    expect(slides.map((s) => s.campaign.id)).toEqual(["a"]);
    expect(slides[0]!.image).toBe("https://x.supabase.co/storage/v1/object/sign/exitos-ads/p/a.webp?token=t");
    expect(signed).toEqual([["p/a.webp"]]);
    expect(settings).toEqual({ rotation_seconds: 9, mobile_enabled: false });
  });
  it("a failing campaign service leaves the desk with no slides, not an error", async () => {
    expect(await loadSlides(remote(() => ({ message: "down" }), 500), "profile")).toEqual({ slides: [], settings: DEFAULT_SETTINGS });
  });
  it("sends only the table's own fields, and reports a refusal", async () => {
    let sent: Record<string, unknown> = {};
    const r = remote((_u, init) => { sent = JSON.parse(String(init?.body)) as Record<string, unknown>; return []; });
    await expect(saveCampaign(r, { id: "a", status: "published", ...({ created_by: "someone", html: "<b>x</b>" } as object) })).rejects.toThrow(/only an operator/);
    expect(Object.keys(sent)).toEqual(["status"]);
  });
});

describe("the promotions panel", () => {
  const slide = (over: Partial<Campaign>) => ({ campaign: c({ eyebrow: "Sovereign Dispatch", headline: "Official records, permanently verifiable", cta_label: "Explore Dispatch", cta_url: "https://example.com/dispatch", ...over }), image: null });
  it("with no live campaign shows the desk's own panel, without controls or a call to action", () => {
    const html = renderToStaticMarkup(createElement(AdPanel, { slides: [], settings: DEFAULT_SETTINGS, preview: true }));
    expect(html).toContain("Prepared in private");
    expect(html).not.toContain("Pause the slideshow");
    expect(html).not.toContain("<a ");
  });
  it("renders text as text, links out safely, and offers controls only for several slides", () => {
    const one = renderToStaticMarkup(createElement(AdPanel, { slides: [slide({ headline: "<img src=x onerror=alert(1)>" })], settings: DEFAULT_SETTINGS, preview: true }));
    expect(one).toContain("&lt;img src=x");
    expect(one).toContain('rel="noopener noreferrer sponsored"');
    // the whole slide is one link to the destination, with the headline as its name
    expect(one).toMatch(/<a [^>]*href="https:\/\/example.com\/dispatch"[^>]*aria-label="&lt;img[^"]*Explore Dispatch \(promotion, opens in a new tab\)"/);
    expect(one.match(/<a /g)?.length).toBe(1);
    expect(one).toContain("Promotion");
    expect(one).not.toContain("Pause the slideshow");
    const two = renderToStaticMarkup(createElement(AdPanel, { slides: [slide({ id: "a" }), slide({ id: "b" })], settings: DEFAULT_SETTINGS, preview: true }));
    expect(two).toContain("Pause the slideshow");
    expect(two).toContain("Show promotion 2 of 2");
  });
  it("the phone card shows nothing at all when there is no campaign", () => {
    expect(renderToStaticMarkup(createElement(AdPanel, { slides: [], settings: DEFAULT_SETTINGS, variant: "compact" }))).toBe("");
  });
});
