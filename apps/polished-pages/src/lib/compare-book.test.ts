import { describe, expect, it } from "vitest";
import { compareBook, restoreParagraph } from "./compare-book";

const ORIGINAL = `Demonology

The names of the enemy are many and each one tells us something of his work among men. Jesus said that Satan desired to sift Peter as wheat, Luke 22:31.

I suppose this speaks of individual Christians who are tested in their faith by the enemy in every generation.

The adversary walks about as a roaring lion seeking whom he may devour, as Peter warns the church, 1 Peter 5:8.

Demons cannot stand the name of Yahusha and they flee when believers pray with faith and authority over them.`;

const REWRITE = `# Demonology I

## The names of the enemy

The enemy bears many names, and each reveals something of his work among people. Yahusha said that Satan desired to sift Peter as wheat (Luke 22:31).

This probably refers to individual Christians, tested in their faith by the enemy in every generation.

## The adversary

The adversary prowls like a roaring lion, seeking whom he may devour, as Peter warns the church in 1 Peter 5:8 and Ephesians 6:12.

The angels were created in 4004 BC, before the foundation of the world was laid.`;

describe("original against rewrite", () => {
  const c = compareBook(ORIGINAL, REWRITE, { rules: "Write Yahusha instead of Jesus" });
  const rows = c.chapters.flatMap((ch) => ch.rows);

  it("pairs each rewritten paragraph with the original it comes from, chapter by chapter", () => {
    expect(c.chapters.map((ch) => ch.title)).toEqual(["Demonology I", "The names of the enemy", "The adversary", "Not found in the rewrite"]);
    const first = c.chapters[1].rows[0];
    expect(first.kind).toBe("rewritten");
    expect(first.original).toContain("Yahusha said that Satan desired"); // the book's rule applied to the original
  });

  it("marks new paragraphs, paragraphs the rewrite dropped, and changed scripture or numbers", () => {
    expect(rows.find((r) => r.kind === "new" && r.rewrite?.text.includes("4004 BC"))).toBeTruthy();
    expect(rows.find((r) => r.kind === "not-in-rewrite")?.original).toContain("Demons cannot stand the name");
    expect(rows.find((r) => r.rewrite?.text.includes("roaring lion"))?.flags).toEqual(["Scripture added: EPH 6:12"]);
    expect(c.summary).toMatchObject({ rewritten: 3, added: 1, notInRewrite: 1, flagged: 1 });
  });

  it("restores the original wording of one paragraph and leaves the rest", () => {
    const row = c.chapters[1].rows[1];
    const back = restoreParagraph(REWRITE, row.rewrite!, row.original!);
    expect(back).toContain("I suppose this speaks of individual Christians");
    expect(back).not.toContain("This probably refers to");
    expect(back).toContain("The enemy bears many names");
  });
});
