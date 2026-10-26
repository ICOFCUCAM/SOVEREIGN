import { describe, expect, it } from "vitest";
import { allowedImageHost, fromOpenverse, fromPexels, fromPixabay, fromUnsplash, searchUrl, validId } from "../../supabase/functions/_shared/cover-images";

describe("free cover images", () => {
  it("asks Openverse only for licences a cover may use", () => {
    expect(searchUrl.openverse("old library", 1)).toContain("license=cc0,pdm,by&");
  });
  it("keeps CC BY with a printed credit, drops share-alike and non-commercial", () => {
    const base = { id: "3f1c2d4e-1111-4a2b-9c3d-123456789abc", title: "Dawn over the hills", creator: "A. Walker", thumbnail: "https://api.openverse.org/v1/images/x/thumb/", width: 2000, height: 3000, license_url: "https://creativecommons.org/licenses/by/4.0/", foreign_landing_url: "https://www.flickr.com/photos/x/1", source: "flickr" };
    const by = fromOpenverse({ ...base, license: "by", license_version: "4.0" })!;
    expect(by.creditRequired).toBe(true);
    expect(by.credit).toBe("“Dawn over the hills” by A. Walker (flickr), CC BY 4.0");
    expect(fromOpenverse({ ...base, license: "cc0" })!.creditRequired).toBe(false);
    expect(fromOpenverse({ ...base, license: "by-sa" })).toBeNull();
    expect(fromOpenverse({ ...base, license: "by-nc" })).toBeNull();
    expect(fromOpenverse({ ...base, license: "by-nd" })).toBeNull();
  });
  it("normalises Pexels, Unsplash and Pixabay results", () => {
    expect(fromPexels({ id: 123, width: 4000, height: 6000, url: "https://www.pexels.com/photo/123/", photographer: "Jo", alt: "Sea", src: { medium: "https://images.pexels.com/m.jpg" } })).toMatchObject({ source: "pexels", creditRequired: false, credit: "Photo by Jo on Pexels", thumb: "https://images.pexels.com/m.jpg" });
    expect(fromUnsplash({ id: "Ab12_cd-EF", width: 3000, height: 4500, alt_description: "forest", urls: { small: "https://images.unsplash.com/s" }, links: { html: "https://unsplash.com/photos/Ab12_cd-EF" }, user: { name: "Kim" } })).toMatchObject({ credit: "Photo by Kim on Unsplash", license: "Unsplash License" });
    expect(fromPixabay({ id: 99, imageWidth: 1280, imageHeight: 1920, user: "pix", tags: "road, dawn", webformatURL: "https://pixabay.com/get/w.jpg", pageURL: "https://pixabay.com/photos/99/" })).toMatchObject({ credit: "Image by pix from Pixabay", title: "road, dawn" });
  });
  it("downloads only by provider id, from known image hosts", () => {
    expect(validId("openverse", "3f1c2d4e-1111-4a2b-9c3d-123456789abc")).toBe(true);
    expect(validId("openverse", "../../etc")).toBe(false);
    expect(validId("pexels", "123")).toBe(true);
    expect(validId("pexels", "http://x")).toBe(false);
    expect(allowedImageHost("https://upload.wikimedia.org/a.jpg")).toBe(true);
    expect(allowedImageHost("https://live.staticflickr.com/1/2.jpg")).toBe(true);
    expect(allowedImageHost("http://upload.wikimedia.org/a.jpg")).toBe(false);
    expect(allowedImageHost("https://169.254.169.254/latest")).toBe(false);
    expect(allowedImageHost("https://evil-wikimedia.org.attacker.com/x")).toBe(false);
  });
});
