import { describe, it, expect } from "vitest";
import { render, cleanup } from "@testing-library/react";
import PremiumCv from "@/components/PremiumCv";
import { PREMIUM_TEMPLATES } from "@/lib/premium-templates";
import { MOCK_CV } from "@/lib/cv-mock";

describe("PremiumCv", () => {
  it("renders every premium template without crashing and shows the candidate", () => {
    for (const t of PREMIUM_TEMPLATES) {
      const { container } = render(<PremiumCv data={MOCK_CV} template={t.id} />);
      // The candidate name must appear for every template (dispatch + renderer ran).
      expect(container.textContent).toContain(MOCK_CV.name);
      cleanup();
    }
  });

  it("falls back gracefully for an unknown template id", () => {
    const { container } = render(<PremiumCv data={MOCK_CV} template="does-not-exist" />);
    expect(container.textContent).toContain(MOCK_CV.name);
  });
});
