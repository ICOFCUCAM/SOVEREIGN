import { describe, expect, it } from "vitest";
import { decodeText } from "./claude-studio";

describe("decodeText", () => {
  it("reads UTF-8, with or without a byte-order mark", () => {
    expect(decodeText(new TextEncoder().encode("Yahuah — ἀρχή"))).toBe("Yahuah — ἀρχή");
    expect(decodeText(new Uint8Array([0xef, 0xbb, 0xbf, 0x41]))).toBe("A");
  });
  it("reads Windows-1252 files that are not valid UTF-8", () => {
    // “Demonology” – café, as saved by an old Windows editor
    expect(decodeText(new Uint8Array([0x93, 0x44, 0x65, 0x6d, 0x6f, 0x94, 0x20, 0x96, 0x20, 0x63, 0x61, 0x66, 0xe9]))).toBe("“Demo” – café");
  });
  it("reads UTF-16 with a byte-order mark", () => {
    expect(decodeText(new Uint8Array([0xff, 0xfe, 0x48, 0x00, 0x69, 0x00]))).toBe("Hi");
    expect(decodeText(new Uint8Array([0xfe, 0xff, 0x00, 0x48, 0x00, 0x69]))).toBe("Hi");
  });
});
