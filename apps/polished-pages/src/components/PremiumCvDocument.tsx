import type { Ref, CSSProperties } from "react";
import { getCvTheme } from "@/lib/cv-themes";
import { hexA } from "@/components/CvDocument";
import type { CvData } from "@/lib/cv-data";

// A genuinely designed CV rendered from STRUCTURED data (not parsed markdown):
// header band with name/role/photo, a categorized sidebar (contact, skills,
// languages, certifications, education), and a main column with a profile and
// real experience entries (company / title / dates / bullets). Every element is
// placed deliberately, so it looks like a professional template rather than
// styled prose. Themed by the selected premium variant (accent + light/dark).

interface Props {
  data: CvData;
  template?: string;
  innerRef?: Ref<HTMLDivElement>;
}

const PremiumCvDocument = ({ data, template, innerRef }: Props) => {
  const theme = getCvTheme(template);
  const accent = theme.accent;
  const dark = theme.dark;

  const pageBg = dark ? theme.pageBg : "#ffffff";
  const text = dark ? theme.pageText : "#1f2937";
  const muted = dark ? "#9ca3af" : "#6b7280";
  const bandBg = dark ? hexA(accent, 0.18) : "#eef2f7";
  const sideBg = dark ? hexA(accent, 0.09) : "#f1f5f9";
  const chipBg = dark ? hexA("#ffffff", 0.1) : "#e2e8f0";
  const chipText = dark ? "#e5e7eb" : "#334155";
  const headName = dark ? "#ffffff" : "#0f172a";

  const chip = (label: string, first = false): CSSProperties => ({
    background: chipBg, color: chipText, fontSize: ".66rem", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: ".09em", padding: ".28rem .55rem",
    borderRadius: 3, margin: `${first ? "0" : "1.05rem"} 0 .55rem`,
  });
  const mainHead: (first?: boolean) => CSSProperties = (first = false) => ({
    color: accent, fontSize: ".82rem", fontWeight: 800, textTransform: "uppercase",
    letterSpacing: ".1em", borderBottom: `2px solid ${accent}`, paddingBottom: ".22rem",
    margin: `${first ? "0" : "1.25rem"} 0 .6rem`,
  });

  const Bullet = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "flex", gap: ".45rem", margin: ".18rem 0" }}>
      <span style={{ color: accent, lineHeight: 1.5 }}>•</span>
      <span style={{ flex: 1, fontSize: ".86rem", lineHeight: 1.45 }}>{children}</span>
    </div>
  );

  const topSkills = data.skills.slice(0, 8);

  return (
    <div
      ref={innerRef}
      className={`rounded-xl border ${theme.fontClass} overflow-hidden shadow-premium`}
      style={{ background: pageBg, color: text, borderColor: hexA(accent, 0.25) }}
    >
      {/* header band */}
      <div style={{ background: bandBg, padding: "1.7rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "1.95rem", fontWeight: 800, lineHeight: 1.08, color: headName, letterSpacing: ".01em" }}>{data.name || "Your Name"}</div>
          {data.title && (
            <div style={{ marginTop: ".35rem", color: accent, fontWeight: 700, fontSize: ".8rem", textTransform: "uppercase", letterSpacing: ".09em" }}>{data.title}</div>
          )}
          {topSkills.length > 0 && (
            <div style={{ marginTop: ".5rem", color: accent, fontSize: ".7rem", fontWeight: 600 }}>{topSkills.join("  |  ")}</div>
          )}
        </div>
        {data.photo ? (
          <img src={data.photo} alt={data.name} className="shrink-0 object-cover" style={{ width: 86, height: 86, borderRadius: 9999, boxShadow: `0 0 0 4px ${hexA(accent, 0.25)}` }} />
        ) : (
          <div className="flex shrink-0 items-center justify-center" style={{ width: 82, height: 82, borderRadius: 9999, background: accent, color: "#fff", fontWeight: 700, fontSize: "1.6rem" }}>
            {data.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")}
          </div>
        )}
      </div>

      {/* body */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,0.92fr) minmax(0,2fr)" }}>
        {/* sidebar */}
        <div style={{ background: sideBg, padding: "1.3rem 1.4rem", fontSize: ".86rem", lineHeight: 1.5 }}>
          {(data.contact.email || data.contact.phone || data.contact.location || data.contact.linkedin || data.contact.website) && (
            <>
              <div style={chip("Contact", true)}>Contact</div>
              {data.contact.location && <div>{data.contact.location}</div>}
              {data.contact.email && <div>{data.contact.email}</div>}
              {data.contact.phone && <div>{data.contact.phone}</div>}
              {data.contact.linkedin && <div style={{ wordBreak: "break-word" }}>{data.contact.linkedin}</div>}
              {data.contact.website && <div style={{ wordBreak: "break-word" }}>{data.contact.website}</div>}
            </>
          )}

          {data.languages.length > 0 && (
            <>
              <div style={chip("Languages")}>Languages</div>
              {data.languages.map((l, i) => <div key={i}>{l}</div>)}
            </>
          )}

          {data.skills.length > 0 && (
            <>
              <div style={chip("Skills")}>Skills</div>
              {data.skills.map((s, i) => <Bullet key={i}>{s}</Bullet>)}
            </>
          )}

          {data.certifications.length > 0 && (
            <>
              <div style={chip("Certifications")}>Certifications</div>
              {data.certifications.map((c, i) => <div key={i} style={{ margin: ".25rem 0" }}>{c}</div>)}
            </>
          )}

          {data.education.length > 0 && (
            <>
              <div style={chip("Education")}>Education</div>
              {data.education.map((e, i) => (
                <div key={i} style={{ margin: ".3rem 0" }}>
                  <div style={{ fontWeight: 600 }}>{[e.degree, e.field].filter(Boolean).join(" in ")}</div>
                  <div style={{ color: muted, fontSize: ".82rem" }}>{[e.institution, e.year].filter(Boolean).join(" · ")}</div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* main */}
        <div style={{ padding: "1.3rem 1.6rem" }}>
          {data.summary && (
            <>
              <div style={mainHead(true)}>Profile</div>
              <p style={{ fontSize: ".88rem", lineHeight: 1.6, textAlign: "justify" }}>{data.summary}</p>
            </>
          )}

          {data.experiences.length > 0 && (
            <>
              <div style={mainHead()}>Experience</div>
              {data.experiences.map((x, i) => (
                <div key={i} style={{ marginBottom: ".9rem" }}>
                  {x.company && <div style={{ fontWeight: 700, fontSize: ".95rem" }}>{x.company}</div>}
                  <div style={{ display: "flex", justifyContent: "space-between", gap: ".5rem", flexWrap: "wrap" }}>
                    {x.title && <span style={{ fontStyle: "italic", color: accent, fontSize: ".88rem" }}>{x.title}</span>}
                    {(x.start || x.end) && <span style={{ color: muted, fontSize: ".82rem" }}>{[x.start, x.end].filter(Boolean).join(" – ")}</span>}
                  </div>
                  <div style={{ marginTop: ".25rem" }}>{x.bullets.map((b, j) => <Bullet key={j}>{b}</Bullet>)}</div>
                </div>
              ))}
            </>
          )}

          {data.references.length > 0 && (
            <>
              <div style={mainHead()}>References</div>
              {data.references.map((r, i) => (
                <div key={i} style={{ margin: ".3rem 0", fontSize: ".86rem" }}>
                  <span style={{ fontWeight: 600 }}>{r.name}</span>
                  {(r.title || r.company) && <span style={{ color: muted }}> — {[r.title, r.company && `at ${r.company}`].filter(Boolean).join(" ")}</span>}
                  {(r.email || r.phone) && <div style={{ color: muted, fontSize: ".82rem" }}>{[r.email, r.phone].filter(Boolean).join("  ·  ")}</div>}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumCvDocument;
