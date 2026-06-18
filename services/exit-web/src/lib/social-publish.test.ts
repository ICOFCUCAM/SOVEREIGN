import { describe, it, expect } from "vitest";
import { allListings } from "./listings";
import { buildListingPost, intentUrl } from "./social-publish";

describe("social publishing", () => {
  it("never leaks the company identity in a founder-listing post", () => {
    const helios = allListings().find((l) => l.id === "lst-demo-helios")!;
    const post = buildListingPost(helios, "https://exit.sovereigndo.com");
    expect(post.text).not.toContain(helios.profile.name);   // anonymized
    expect(post.title).toBe(helios.code);                   // code name only
    expect(post.text).toContain("ExitOS");
  });

  it("uses the real product name and published value for catalog listings", () => {
    const usa = allListings().find((l) => l.id === "lst-sov-usa-relocation")!;
    const post = buildListingPost(usa, "https://exit.sovereigndo.com");
    expect(post.title).toBe("USA Relocation & Logistics Marketplace");
    expect(post.text).toContain("$18M");
  });

  it("produces real share intents and no Instagram web prefill", () => {
    const l = allListings()[0];
    const post = buildListingPost(l, "https://exit.sovereigndo.com");
    expect(intentUrl("x", post)).toContain("twitter.com/intent/tweet");
    expect(intentUrl("linkedin", post)).toContain("linkedin.com/sharing");
    expect(intentUrl("whatsapp", post)).toContain("wa.me");
    expect(intentUrl("instagram", post)).toBeNull();
  });
});
