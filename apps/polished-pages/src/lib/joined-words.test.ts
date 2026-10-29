import { describe, expect, it } from "vitest";
import { joinedWords, separate, vocabulary } from "./joined-words";

const book = "Yahusha is the Messiah. Yahusha taught the scriptures. The disciples of Yahusha followed. The Biblical Identity of Yahushaand the Doctrine of the Godhead. Within the scriptures, another witness. Nothing is hidden; the scriptures teach together.";
describe("words joined at import", () => {
  it("finds a name run into the next word, and leaves ordinary words alone", () => {
    const v = vocabulary(book);
    const hits = joinedWords(book, v);
    expect(hits.map((h) => [h.text, h.fix])).toEqual([["Yahushaand", "Yahusha and"]]);
    expect(separate(book, hits)).toMatch(/Identity of Yahusha and the Doctrine/);
  });
});
