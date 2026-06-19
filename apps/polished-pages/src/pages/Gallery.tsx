import PremiumCv from "@/components/PremiumCv";
import { PREMIUM_TEMPLATES } from "@/lib/premium-templates";
import { MOCK_CV } from "@/lib/cv-mock";

// Internal route for visual QA — renders every premium template with the mock
// candidate at A4 width so each can be screenshotted. Not linked in the app.
const Gallery = () => (
  <div style={{ background: "#dfe3e8", padding: 40, minHeight: "100vh" }}>
    {PREMIUM_TEMPLATES.map((t) => (
      <div key={t.id} style={{ width: 794, margin: "0 auto 56px" }}>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: "#475569", marginBottom: 8 }}>{t.collection} · {t.name} ({t.id})</div>
        <div data-template={t.id}>
          <PremiumCv data={MOCK_CV} template={t.id} />
        </div>
      </div>
    ))}
  </div>
);

export default Gallery;
