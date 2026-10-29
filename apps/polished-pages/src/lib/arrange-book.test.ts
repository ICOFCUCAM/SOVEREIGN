import { describe, expect, it } from "vitest";
import { arrangeBook, arrangeFromContents, conventionalOrder, titleCase } from "./arrange-book";
import { applyOrganise } from "./organise";

const BOOK = `THE ONENESS OF YAHUAH
The Biblical Identity of Yahusha and the Doctrine of the Godhead
COMPLETE MANUSCRIPT
Contents
Introduction
The Aim of This Book
How the Book Is Organized
1. One Yahuah: The Faith of Both Testaments
What Monotheism Means
2. The Nature of Yahuah
Conclusion
References
Introduction
This book sets out what the scriptures teach about the one Yahuah and the identity of Yahusha.
The Aim of This Book
The aim is to let the scriptures speak for themselves, testament by testament, without a later creed.
How the Book Is Organized
The chapters move from the Old Testament witness to the New, and then to the history of the doctrine.
1. One Yahuah: The Faith of Both Testaments
Both testaments confess that Yahuah is one, and the Shema stands at the centre of that confession.
What Monotheism Means
Monotheism means more than counting: it confesses one who alone is Creator and Lord of all.
2. The Nature of Yahuah
Yahuah is spirit, eternal and holy; He does not change, and His word stands for ever and ever.
Conclusion
The scriptures speak with one voice about the one Yahuah revealed in Yahusha the Messiah.
References
Dyrness, W. Themes in Old Testament Theology. 1979.`;

describe("arrange a book from its own contents", () => {
  it("takes the title block, uses the contents list as the map, and splits the book without changing a word", () => {
    const a = arrangeFromContents(BOOK)!;
    expect(a.title).toBe("The Oneness of Yahuah");
    expect(a.subtitle).toBe("The Biblical Identity of Yahusha and the Doctrine of the Godhead");
    expect(a.workingLabel).toBe("COMPLETE MANUSCRIPT");
    expect(a.plan.sections.map((s) => [s.kind, s.title, s.headings.map((h) => h.title)])).toEqual([
      ["introduction", "Introduction", ["The Aim of This Book", "How the Book Is Organized"]],
      ["chapter", "One Yahuah: The Faith of Both Testaments", ["What Monotheism Means"]],
      ["chapter", "The Nature of Yahuah", []],
      ["conclusion", "Conclusion", []],
      ["bibliography", "References", []],
    ]);
    const o = applyOrganise(a.body, a.plan);
    expect(o.missed).toEqual([]);
    expect(o.sections.map((s) => s.title)).toEqual(["Introduction", "One Yahuah: The Faith of Both Testaments", "The Nature of Yahuah", "Conclusion", "References"]);
    expect(o.sections[0].body).toMatch(/^This book sets out[\s\S]*### The Aim of This Book\n\nThe aim is[\s\S]*### How the Book Is Organized/);
    expect(o.keptWords).toBe(o.totalWords - o.removedHeadingWords);
  });
  it("says so when the text has no contents list, and title-cases only an all-capitals title", () => {
    expect(arrangeFromContents("Just a chapter of text.\n\nAnd more.")).toBeNull();
    expect(titleCase("THE ONENESS OF YAHUAH")).toBe("The Oneness of Yahuah");
    expect(titleCase("Demonology: The Battle of Angels")).toBe("Demonology: The Battle of Angels");
  });
});

describe("conventional order", () => {
  it("puts front matter, chapters and back matter in their places, keeping the chapters' order", () => {
    const secs = [
      { kind: "chapter", title: "One" }, { kind: "bibliography", title: "References" }, { kind: "introduction", title: "Introduction" },
      { kind: "chapter", title: "Two" }, { kind: "about-author", title: "About the Author" }, { kind: "glossary", title: "Glossary" },
      { kind: "conclusion", title: "Conclusion" }, { kind: "acknowledgments", title: "Acknowledgements" }, { kind: "appendix", title: "Appendix A" },
    ];
    const { sections, moved } = conventionalOrder(secs);
    expect(sections.map((s) => s.title)).toEqual(["Introduction", "One", "Two", "Conclusion", "Acknowledgements", "Appendix A", "Glossary", "References", "About the Author"]);
    expect(moved.length).toBeGreaterThan(0);
    expect(conventionalOrder(sections).moved).toEqual([]);
  });
  it("recognises back matter headings in the book's own list", () => {
    const text = `A Book\nContents\n1. First Things\nAppendix A: Hebrew Names\nGlossary of Terms\nScripture Index\nAbout the Author\n1. First Things\nThe opening words of the first chapter are here and they run on for a while.\nAppendix A: Hebrew Names\nThe names in Hebrew with their meanings are set out in the table below this line.\nGlossary of Terms\nAtonement: the reconciliation of the people with Yahuah through the offering made.\nScripture Index\nGenesis 1:1 appears in the first chapter and again in the second one of this book.\nAbout the Author\nThe author has taught the scriptures for many years in the church and beyond it.`;
    const a = arrangeFromContents(text)!;
    expect(a.plan.sections.map((s) => s.kind)).toEqual(["chapter", "appendix", "glossary", "scripture-index", "about-author"]);
  });
});

describe("arrangeBook", () => {
  it("returns the organised book with title, subtitle and what was set aside", () => {
    const o = arrangeBook(BOOK)!;
    expect([o.title, o.subtitle]).toEqual(["The Oneness of Yahuah", "The Biblical Identity of Yahusha and the Doctrine of the Godhead"]);
    expect(o.sections.map((s) => s.kind)).toEqual(["introduction", "chapter", "chapter", "conclusion", "bibliography"]);
    expect(o.setAside!.join(" ")).toMatch(/COMPLETE MANUSCRIPT/);
    expect(o.sections[1].body).not.toMatch(/COMPLETE MANUSCRIPT|^Contents/m);
  });
});

describe("a contents list where a section has its chapter's name", () => {
  // The Oneness of Yahuah: chapter 5 "Theophanies" opens with a section also called "Theophanies".
  const P = (s: string) => `${s} is set out here at length, with the scriptures that bear on it, so the reader can follow it closely.`;
  const book = [
    "THE ONENESS OF YAHUAH", "The Biblical Identity of Yahusha and the Doctrine of the Godhead", "COMPLETE MANUSCRIPT", "Contents",
    "Introduction", "The Aim of This Book",
    "1. One Yahuah: The Faith of Both Testaments", "What Monotheism Means",
    "2. Theophanies", "Theophanies", "Theophanies: The Appearance to Abraham", "The Angel of Yahuah",
    "3. Reading the Gospels Rightly", "Four Aids to Understanding",
    "Conclusion",
    "Introduction", P("This book"), "The Aim of This Book", P("The aim"),
    "1. One Yahuah: The Faith of Both Testaments", P("Both testaments"), "What Monotheism Means", P("Monotheism"),
    "2. Theophanies", P("A theophany"), "Theophanies", P("The appearances"), "Theophanies: The Appearance to Abraham", P("Abraham"), "The Angel of Yahuah", P("The angel"),
    "3. Reading the Gospels Rightly", P("The gospels"), "Four Aids to Understanding", P("Four aids"),
    "Conclusion", P("In conclusion"),
  ].join("\n");
  it("reads the whole list, so every chapter is split out and nothing is left over as 'Opening pages'", () => {
    const o = arrangeBook(book)!;
    expect(o.sections.map((s) => s.title)).toEqual(["Introduction", "One Yahuah: The Faith of Both Testaments", "Theophanies", "Reading the Gospels Rightly", "Conclusion"]);
    expect(o.sections.find((s) => s.title === "Theophanies")!.body).toMatch(/^A theophany[\s\S]*### Theophanies\n\nThe appearances[\s\S]*### Theophanies: The Appearance to Abraham[\s\S]*### The Angel of Yahuah/);
    expect(o.sections.some((s) => s.title === "Opening pages")).toBe(false);
    expect(o.missed).toEqual([]);
  });
});
