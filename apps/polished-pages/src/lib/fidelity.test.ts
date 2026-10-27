import { describe, expect, it } from "vitest";
import { compareFidelity } from "./fidelity";

const ORIGINAL = `Demonology

The names of the enemy are many. Jesus said that Satan desired to sift Peter as wheat, Luke 22:31. I suppose this speaks of individual Christians who are tested in their faith.

Peter wrote: "Be sober, be vigilant; because your adversary the devil, as a roaring lion, walketh about, seeking whom he may devour." That is 1 Peter 5:8.

Perhaps the demons were once the spirits of a former creation, though nobody can tell their full story.

In a dream I saw many people in chains, and many of them were Christians in church.`;

const REWRITE = `# Demonology I

## The names of the enemy

The adversary has many names. Yahusha said that Satan desired to sift Peter as wheat (Luke 22:31). This speaks of individual Christians who are tested in their faith.

Peter warns that the adversary, as a roaring lion, walks about seeking whom he may devour (1 Peter 5:8).

The demons were clearly the spirits of a former creation, as Origen argued in 230.

In a dream the author saw many people in chains, many of them Christians in church. Compare Ephesians 6:12.`;

describe("faithfulness to the original", () => {
  const r = compareFidelity(ORIGINAL, REWRITE, { rules: "Write Yahusha instead of Jesus" });
  const f = (id: string) => r.findings.find((x) => x.id === id);

  it("keeps the scripture references and reports new ones", () => {
    expect(f("refs-lost")).toBeUndefined();
    expect(f("refs-added")?.text).toContain("Ephesians 6:12");
    expect(r.stats).toMatchObject({ refsKept: 2, refsLost: 0, refsAdded: 1 });
  });

  it("blocks a quotation that was paraphrased", () => {
    expect(f("quotes-lost")).toMatchObject({ level: "blocker" });
    expect(f("quotes-lost")!.places[0].excerpt).toContain("Be sober, be vigilant");
  });

  it("finds qualifications removed and certainty added", () => {
    const h = f("hedges")!;
    expect(h.places.map((p) => p.excerpt)).toEqual(expect.arrayContaining([expect.stringContaining("I suppose this speaks"), expect.stringContaining("Perhaps the demons")]));
    expect(f("certainty")!.places[0].excerpt).toContain("clearly the spirits");
  });

  it("lists names and numbers only the rewrite contains, but not the book's required terms", () => {
    const d = f("new-details")!;
    expect(d.text).toContain("Origen");
    expect(d.text).toContain("230");
    expect(d.text).not.toContain("Yahusha");
  });

  it("is silent when the rewrite only applies the rules", () => {
    const same = compareFidelity("Jesus taught his disciples to pray in the morning, Matthew 6:9. I think this is the pattern.", "Yahusha taught his disciples to pray in the morning, Matthew 6:9. I think this is the pattern.", { rules: "Write Yahusha instead of Jesus" });
    expect(same.findings).toEqual([]);
  });

  it("accepts a qualification reworded professionally, and blocks a rewrite that only copies", () => {
    const reworded = compareFidelity("I suppose this speaks of individual Christians who are tested in their faith.", "This probably refers to individual Christians who are tested in their faith.");
    expect(reworded.findings.find((x) => x.id === "hedges")).toBeUndefined();
    const text = Array.from({ length: 12 }, (_, i) => `The believer in chapter ${i} must learn to stand firm against every scheme of the enemy.`).join(" ");
    const copy = compareFidelity(text, text);
    expect(copy.findings.find((x) => x.id === "copied")).toMatchObject({ level: "blocker" });
    expect(copy.stats.copiedShare).toBe(1);
  });

  it("warns when a rewrite is much shorter than the original", () => {
    const long = Array.from({ length: 60 }, (_, i) => `Paragraph ${i} teaches something about faith, prayer and the spirits of the air.`).join("\n\n");
    const short = compareFidelity(long, long.split("\n\n").slice(0, 20).join("\n\n"));
    expect(short.findings.find((x) => x.id === "shorter")).toMatchObject({ level: "blocker" });
  });
});
