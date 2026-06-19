import type { Ref, CSSProperties, ReactNode } from "react";
import type { CvData } from "@/lib/cv-data";
import { FONT_FAMILY } from "@/lib/fonts";
import { getPremiumTemplate, type PremiumTemplate } from "@/lib/premium-templates";

const hexA = (hex: string, a: number): string => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

interface Tokens {
  font: string; accent: string; dark: boolean;
  bg: string; ink: string; strong: string; muted: string; line: string; soft: string; chip: string; chipText: string;
}

const tokens = (t: PremiumTemplate): Tokens => {
  const dark = !!t.dark;
  return {
    font: FONT_FAMILY[t.font], accent: t.accent, dark,
    bg: dark ? "#0f172a" : "#ffffff",
    ink: dark ? "#cbd5e1" : "#374151",
    strong: dark ? "#ffffff" : "#0f172a",
    muted: dark ? "#94a3b8" : "#6b7280",
    line: dark ? "rgba(255,255,255,0.12)" : "#e8eaed",
    soft: dark ? "rgba(255,255,255,0.05)" : "#f7f9fb",
    chip: dark ? "rgba(255,255,255,0.08)" : "#eef2f7",
    chipText: dark ? "#cbd5e1" : t.accent,
  };
};

/* ─── building blocks ─── */
const SectionTitle = ({ children, k, mt = "1.5rem" }: { children: ReactNode; k: Tokens; mt?: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: ".6rem", margin: `${mt} 0 .7rem` }}>
    <span style={{ width: 16, height: 2.5, background: k.accent, borderRadius: 2, flexShrink: 0 }} />
    <span style={{ color: k.dark ? "#fff" : k.accent, fontSize: 11, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase" }}>{children}</span>
    <span style={{ flex: 1, height: 1, background: k.line }} />
  </div>
);

const Dot = ({ k }: { k: Tokens }) => (
  <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: 9999, background: k.accent, marginTop: 7, flexShrink: 0 }} />
);

const Experience = ({ data, k }: { data: CvData; k: Tokens }) => (
  <div>
    {data.experiences.map((x, i) => (
      <div key={i} style={{ marginBottom: i === data.experiences.length - 1 ? 0 : "1.05rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline" }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: k.strong, lineHeight: 1.25 }}>{x.title}</div>
          {(x.start || x.end) && <div style={{ color: k.muted, fontSize: 11.5, whiteSpace: "nowrap", fontWeight: 500 }}>{[x.start, x.end].filter(Boolean).join(" – ")}</div>}
        </div>
        {x.company && <div style={{ color: k.accent, fontSize: 12.8, fontWeight: 600, marginTop: 1 }}>{x.company}</div>}
        <div style={{ marginTop: ".4rem" }}>
          {x.bullets.map((b, j) => (
            <div key={j} style={{ display: "flex", gap: ".55rem", margin: ".22rem 0" }}>
              <Dot k={k} />
              <span style={{ fontSize: 12.6, lineHeight: 1.5, color: k.ink }}>{b}</span>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const SkillChips = ({ items, k }: { items: string[]; k: Tokens }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: ".38rem" }}>
    {items.map((s, i) => (
      <span key={i} style={{ fontSize: 11.5, padding: ".24rem .55rem", borderRadius: 5, background: k.chip, color: k.dark ? k.ink : k.strong, fontWeight: 500 }}>{s}</span>
    ))}
  </div>
);

const Stack = ({ items, k }: { items: string[]; k: Tokens }) => (
  <div>{items.map((s, i) => <div key={i} style={{ fontSize: 12.6, color: k.ink, margin: ".2rem 0" }}>{s}</div>)}</div>
);

const Education = ({ data, k }: { data: CvData; k: Tokens }) => (
  <div>
    {data.education.map((e, i) => (
      <div key={i} style={{ margin: ".35rem 0" }}>
        <div style={{ fontWeight: 600, fontSize: 12.8, color: k.strong }}>{[e.degree, e.field].filter(Boolean).join(", ")}</div>
        <div style={{ color: k.muted, fontSize: 12 }}>{[e.institution, e.year].filter(Boolean).join(" · ")}</div>
      </div>
    ))}
  </div>
);

const Contact = ({ data, k, stacked = false }: { data: CvData; k: Tokens; stacked?: boolean }) => {
  const items = [data.contact.location, data.contact.email, data.contact.phone, data.contact.linkedin, data.contact.website].filter(Boolean) as string[];
  if (stacked) return <div>{items.map((c, i) => <div key={i} style={{ fontSize: 12.3, color: k.ink, margin: ".18rem 0", wordBreak: "break-word" }}>{c}</div>)}</div>;
  return <div style={{ fontSize: 12.3, color: k.muted, display: "flex", flexWrap: "wrap", gap: ".15rem .7rem" }}>{items.map((c, i) => <span key={i}>{c}</span>)}</div>;
};

const References = ({ data, k }: { data: CvData; k: Tokens }) => (
  <div>
    {data.references.map((r, i) => (
      <div key={i} style={{ fontSize: 12.5, margin: ".25rem 0" }}>
        <span style={{ fontWeight: 600, color: k.strong }}>{r.name}</span>
        {(r.title || r.company) && <span style={{ color: k.muted }}> — {[r.title, r.company && `at ${r.company}`].filter(Boolean).join(" ")}</span>}
        {(r.email || r.phone) && <div style={{ color: k.muted, fontSize: 11.8 }}>{[r.email, r.phone].filter(Boolean).join("  ·  ")}</div>}
      </div>
    ))}
  </div>
);

const Medallion = ({ data, k, size = 84 }: { data: CvData; k: Tokens; size?: number }) =>
  data.photo ? (
    <img src={data.photo} alt={data.name} style={{ width: size, height: size, borderRadius: 9999, objectFit: "cover", flexShrink: 0, boxShadow: `0 0 0 3px ${hexA(k.accent, 0.25)}` }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: 9999, background: k.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.34, flexShrink: 0 }}>
      {data.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")}
    </div>
  );

/* ─── layouts ─── */
const SingleLayout = ({ data, k, centered }: { data: CvData; k: Tokens; centered?: boolean }) => (
  <div style={{ padding: "2.6rem 2.8rem" }}>
    <div style={{ textAlign: centered ? "center" : "left", paddingBottom: "1.1rem", borderBottom: `2px solid ${k.accent}` }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: k.strong, letterSpacing: "-.01em", lineHeight: 1.1 }}>{data.name}</div>
      {data.title && <div style={{ color: k.accent, fontSize: 13, fontWeight: 600, letterSpacing: ".13em", textTransform: "uppercase", marginTop: ".4rem" }}>{data.title}</div>}
      <div style={{ marginTop: ".6rem", justifyContent: centered ? "center" : "flex-start", display: "flex" }}><Contact data={data} k={k} /></div>
    </div>
    {data.summary && (<><SectionTitle k={k} mt="1.4rem">Profile</SectionTitle><p style={{ fontSize: 13, lineHeight: 1.62, color: k.ink, textAlign: "justify" }}>{data.summary}</p></>)}
    {data.experiences.length > 0 && (<><SectionTitle k={k}>Experience</SectionTitle><Experience data={data} k={k} /></>)}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2.2rem" }}>
      <div>{data.education.length > 0 && (<><SectionTitle k={k}>Education</SectionTitle><Education data={data} k={k} /></>)}</div>
      <div>{data.certifications.length > 0 && (<><SectionTitle k={k}>Certifications</SectionTitle><Stack items={data.certifications} k={k} /></>)}</div>
    </div>
    {data.skills.length > 0 && (<><SectionTitle k={k}>Skills</SectionTitle><SkillChips items={data.skills} k={k} /></>)}
    {data.languages.length > 0 && (<><SectionTitle k={k}>Languages</SectionTitle><SkillChips items={data.languages} k={k} /></>)}
    {data.references.length > 0 && (<><SectionTitle k={k}>References</SectionTitle><References data={data} k={k} /></>)}
  </div>
);

const SidebarLayout = ({ data, k }: { data: CvData; k: Tokens }) => (
  <div>
    <div style={{ display: "flex", alignItems: "center", gap: "1.3rem", padding: "2rem 2.4rem", background: k.dark ? hexA(k.accent, 0.16) : k.soft, borderBottom: `1px solid ${k.line}` }}>
      <Medallion data={data} k={k} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 27, fontWeight: 800, color: k.strong, lineHeight: 1.1, letterSpacing: "-.01em" }}>{data.name}</div>
        {data.title && <div style={{ color: k.accent, fontSize: 12.5, fontWeight: 600, letterSpacing: ".13em", textTransform: "uppercase", marginTop: ".35rem" }}>{data.title}</div>}
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,0.86fr) minmax(0,2fr)" }}>
      <div style={{ background: k.dark ? hexA(k.accent, 0.08) : k.soft, padding: "1.6rem 1.6rem", borderRight: `1px solid ${k.line}` }}>
        <SectionTitle k={k} mt="0">Contact</SectionTitle><Contact data={data} k={k} stacked />
        {data.skills.length > 0 && (<><SectionTitle k={k}>Skills</SectionTitle><SkillChips items={data.skills} k={k} /></>)}
        {data.languages.length > 0 && (<><SectionTitle k={k}>Languages</SectionTitle><Stack items={data.languages} k={k} /></>)}
        {data.certifications.length > 0 && (<><SectionTitle k={k}>Certifications</SectionTitle><Stack items={data.certifications} k={k} /></>)}
        {data.education.length > 0 && (<><SectionTitle k={k}>Education</SectionTitle><Education data={data} k={k} /></>)}
      </div>
      <div style={{ padding: "1.6rem 1.9rem" }}>
        {data.summary && (<><SectionTitle k={k} mt="0">Profile</SectionTitle><p style={{ fontSize: 13, lineHeight: 1.62, color: k.ink, textAlign: "justify" }}>{data.summary}</p></>)}
        {data.experiences.length > 0 && (<><SectionTitle k={k}>Experience</SectionTitle><Experience data={data} k={k} /></>)}
        {data.references.length > 0 && (<><SectionTitle k={k}>References</SectionTitle><References data={data} k={k} /></>)}
      </div>
    </div>
  </div>
);

const TwoColLayout = ({ data, k }: { data: CvData; k: Tokens }) => (
  <div style={{ padding: "2.4rem 2.6rem" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.2rem", paddingBottom: "1rem", borderBottom: `2px solid ${k.accent}` }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: k.strong, lineHeight: 1.08, letterSpacing: "-.01em" }}>{data.name}</div>
        {data.title && <div style={{ color: k.accent, fontSize: 13, fontWeight: 600, letterSpacing: ".13em", textTransform: "uppercase", marginTop: ".35rem" }}>{data.title}</div>}
        <div style={{ marginTop: ".5rem" }}><Contact data={data} k={k} /></div>
      </div>
      <Medallion data={data} k={k} size={76} />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.8fr) minmax(0,1fr)", gap: "0 2.2rem", marginTop: ".3rem" }}>
      <div>
        {data.summary && (<><SectionTitle k={k}>Profile</SectionTitle><p style={{ fontSize: 13, lineHeight: 1.62, color: k.ink, textAlign: "justify" }}>{data.summary}</p></>)}
        {data.experiences.length > 0 && (<><SectionTitle k={k}>Experience</SectionTitle><Experience data={data} k={k} /></>)}
        {data.references.length > 0 && (<><SectionTitle k={k}>References</SectionTitle><References data={data} k={k} /></>)}
      </div>
      <div>
        {data.skills.length > 0 && (<><SectionTitle k={k}>Skills</SectionTitle><SkillChips items={data.skills} k={k} /></>)}
        {data.education.length > 0 && (<><SectionTitle k={k}>Education</SectionTitle><Education data={data} k={k} /></>)}
        {data.certifications.length > 0 && (<><SectionTitle k={k}>Certifications</SectionTitle><Stack items={data.certifications} k={k} /></>)}
        {data.languages.length > 0 && (<><SectionTitle k={k}>Languages</SectionTitle><Stack items={data.languages} k={k} /></>)}
      </div>
    </div>
  </div>
);

interface Props {
  data: CvData;
  template?: string;
  innerRef?: Ref<HTMLDivElement>;
}

const PremiumCv = ({ data, template, innerRef }: Props) => {
  const t = getPremiumTemplate(template) ?? getPremiumTemplate("corporate-azure")!;
  const k = tokens(t);
  return (
    <div
      ref={innerRef}
      className="rounded-xl border overflow-hidden shadow-premium"
      style={{ background: k.bg, color: k.ink, borderColor: k.line, fontFamily: k.font }}
    >
      {t.layout === "sidebar" ? <SidebarLayout data={data} k={k} />
        : t.layout === "twocol" ? <TwoColLayout data={data} k={k} />
        : <SingleLayout data={data} k={k} centered={t.id === "executive-onyx"} />}
    </div>
  );
};

export default PremiumCv;
