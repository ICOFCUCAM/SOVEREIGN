import { describe, it, expect } from "vitest";
import { COUNTRIES, searchCountries, findCountry, flagUrl } from "./countries";

describe("countries and territories", () => {
  it("covers every ISO 3166-1 country and territory, not a short list", () => {
    expect(COUNTRIES.length).toBeGreaterThanOrEqual(245);
    for (const c of ["NO", "SE", "US", "GB", "CM", "NG", "JP", "BR", "AQ", "XK", "PR", "GL"]) expect(COUNTRIES.some((x) => x.code === c), c).toBe(true);
    expect(COUNTRIES.some((x) => x.code === "EU")).toBe(false);
    expect(new Set(COUNTRIES.map((c) => c.code)).size).toBe(COUNTRIES.length);
  });
  it("searches by name, word, alias, accents and code", () => {
    expect(searchCountries("nor")[0]?.code).toBe("NO");
    expect(searchCountries("uk")[0]?.code).toBe("GB");
    expect(searchCountries("cote").map((c) => c.code)).toContain("CI");
    expect(searchCountries("zealand")[0]?.code).toBe("NZ");
    expect(searchCountries("cm").map((c) => c.code)).toContain("CM");
    expect(searchCountries("zzzz")).toEqual([]);
    expect(searchCountries("").length).toBe(COUNTRIES.length);
  });
  it("reads stored values (names, aliases, codes)", () => {
    expect(findCountry("Norway")?.code).toBe("NO");
    expect(findCountry("norge")?.code).toBe("NO");
    expect(findCountry("de")?.code).toBe("DE");
    expect(findCountry("Atlantis")).toBeUndefined();
  });
  it("has a flag for every entry", () => {
    expect(COUNTRIES.every((c) => !!flagUrl(c.code))).toBe(true);
  });
});
