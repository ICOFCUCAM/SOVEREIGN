import type { Ref, ReactNode } from "react";
import type { CvData } from "@/lib/cv-data";
import { FONT_FAMILY } from "@/lib/fonts";
import { getPremiumTemplate, type PremiumTemplate } from "@/lib/premium-templates";

const hexA = (hex: string, a: number): string => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

interface K {
  font: string; disp: string; accent: string; dark: boolean;
  bg: string; ink: string; strong: string; muted: string; line: string; soft: string; chip: string;
}
const toK = (t: PremiumTemplate): K => {
  const dark = !!t.dark;
  return {
    font: FONT_FAMILY[t.font], disp: FONT_FAMILY[t.display ?? t.font], accent: t.accent, dark,
    bg: dark ? "#0d1117" : "#ffffff",
    ink: dark ? "#9da7b3" : "#374151",
    strong: dark ? "#f1f5f9" : "#0f172a",
    muted: dark ? "#6b7686" : "#6b7280",
    line: dark ? "rgba(255,255,255,0.1)" : "#e8eaed",
    soft: dark ? "rgba(255,255,255,0.04)" : "#f6f8fa",
    chip: dark ? "rgba(255,255,255,0.08)" : "#eef2f7",
  };
};

/* ── atoms (all take `d`) ── */
const Bullet = ({ children, k }: { children: ReactNode; k: K }) => (
  <div style={{ display: "flex", gap: ".55rem", margin: ".2rem 0" }}>
    <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: 9999, background: k.accent, marginTop: 7, flexShrink: 0 }} />
    <span style={{ fontSize: 12.6, lineHeight: 1.5, color: k.ink }}>{children}</span>
  </div>
);
const Chips = ({ items, k }: { items: string[]; k: K }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: ".38rem" }}>
    {items.map((s, i) => <span key={i} style={{ fontSize: 11.5, padding: ".24rem .55rem", borderRadius: 5, background: k.chip, color: k.dark ? k.ink : k.strong, fontWeight: 500 }}>{s}</span>)}
  </div>
);
const Tick = ({ children, k, mt = "1.5rem" }: { children: ReactNode; k: K; mt?: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: ".6rem", margin: `${mt} 0 .7rem` }}>
    <span style={{ width: 16, height: 2.5, background: k.accent, borderRadius: 2 }} />
    <span style={{ color: k.dark ? "#fff" : k.accent, fontSize: 11, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase" }}>{children}</span>
    <span style={{ flex: 1, height: 1, background: k.line }} />
  </div>
);
const Plain = ({ children, k, mt = "1.4rem" }: { children: ReactNode; k: K; mt?: string }) => (
  <div style={{ color: k.accent, fontSize: 11, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", margin: `${mt} 0 .55rem` }}>{children}</div>
);
const Underline = ({ children, k, mt = "1.4rem" }: { children: ReactNode; k: K; mt?: string }) => (
  <div style={{ color: k.strong, fontSize: 13, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", borderBottom: `2px solid ${k.accent}`, paddingBottom: ".25rem", margin: `${mt} 0 .6rem` }}>{children}</div>
);
const Quiet = ({ children, k, mt = "1.5rem" }: { children: ReactNode; k: K; mt?: string }) => (
  <div style={{ color: k.muted, fontSize: 10.5, fontWeight: 600, letterSpacing: ".26em", textTransform: "uppercase", margin: `${mt} 0 .7rem` }}>{children}</div>
);

const Experience = ({ d, k, compact }: { d: CvData; k: K; compact?: boolean }) => (
  <div>{d.experiences.map((x, i) => (
    <div key={i} style={{ marginBottom: i === d.experiences.length - 1 ? 0 : compact ? ".8rem" : "1.05rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline" }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: k.strong, lineHeight: 1.25 }}>{x.title}</div>
        {(x.start || x.end) && <div style={{ color: k.muted, fontSize: 11.5, whiteSpace: "nowrap", fontWeight: 500 }}>{[x.start, x.end].filter(Boolean).join(" – ")}</div>}
      </div>
      {x.company && <div style={{ color: k.accent, fontSize: 12.8, fontWeight: 600, marginTop: 1 }}>{x.company}</div>}
      <div style={{ marginTop: ".4rem" }}>{x.bullets.map((b, j) => <Bullet key={j} k={k}>{b}</Bullet>)}</div>
    </div>
  ))}</div>
);
const Education = ({ d, k }: { d: CvData; k: K }) => (
  <div>{d.education.map((e, i) => (
    <div key={i} style={{ margin: ".35rem 0" }}>
      <div style={{ fontWeight: 600, fontSize: 12.8, color: k.strong }}>{[e.degree, e.field].filter(Boolean).join(", ")}</div>
      <div style={{ color: k.muted, fontSize: 12 }}>{[e.institution, e.year].filter(Boolean).join(" · ")}</div>
    </div>
  ))}</div>
);
const Stack = ({ items, k }: { items: string[]; k: K }) => <div>{items.map((s, i) => <div key={i} style={{ fontSize: 12.6, color: k.ink, margin: ".22rem 0" }}>{s}</div>)}</div>;
const Summary = ({ d, k }: { d: CvData; k: K }) => d.summary ? <p style={{ fontSize: 13, lineHeight: 1.62, color: k.ink, textAlign: "justify" }}>{d.summary}</p> : null;
const Contact = ({ d, k, sep = "  ·  " }: { d: CvData; k: K; sep?: string }) => {
  const items = [d.contact.location, d.contact.email, d.contact.phone, d.contact.linkedin].filter(Boolean) as string[];
  return <span style={{ color: k.muted, fontSize: 12.3 }}>{items.join(sep)}</span>;
};
const Initials = ({ d }: { d: CvData }) => <>{d.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")}</>;
const Projects = ({ d, k }: { d: CvData; k: K }) => !d.projects?.length ? null : (
  <div>{d.projects.map((p, i) => (
    <div key={i} style={{ marginBottom: ".7rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: k.strong }}>{p.name}</span>
        {p.tech && <span style={{ fontSize: 11, color: k.accent, fontWeight: 600, whiteSpace: "nowrap" }}>{p.tech}</span>}
      </div>
      {p.description && <div style={{ fontSize: 12.4, color: k.ink, marginTop: ".15rem" }}>{p.description}</div>}
    </div>
  ))}</div>
);
const Publications = ({ d, k }: { d: CvData; k: K }) => !d.publications?.length ? null : (
  <ol style={{ margin: 0, paddingLeft: "1.1rem" }}>{d.publications.map((p, i) => <li key={i} style={{ fontSize: 12.3, color: k.ink, margin: ".3rem 0", lineHeight: 1.5 }}>{p}</li>)}</ol>
);
const LanguagePanel = ({ d, k }: { d: CvData; k: K }) => {
  const levels = d.languageLevels?.length ? d.languageLevels : d.languages.map((l) => ({ language: l, level: "" }));
  return <div>{levels.map((l, i) => (
    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.4, margin: ".3rem 0" }}>
      <span style={{ color: k.strong, fontWeight: 600 }}>{l.language}</span><span style={{ color: k.muted }}>{l.level}</span>
    </div>
  ))}</div>;
};

const Page = ({ k, children, innerRef, pad = true }: { k: K; children: ReactNode; innerRef?: Ref<HTMLDivElement>; pad?: boolean }) => (
  <div ref={innerRef} className="rounded-xl border overflow-hidden shadow-premium" style={{ background: k.bg, color: k.ink, borderColor: k.line, fontFamily: k.font }}>
    <div style={pad ? { padding: "2.5rem 2.7rem" } : undefined}>{children}</div>
  </div>
);

/* ════ 12 distinct architectures ════ */

// 1 · EXECUTIVE — editorial serif, oversized name, achievements-first, airy.
const Boardroom = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef}>
    <div style={{ fontFamily: k.disp, fontSize: 52, fontWeight: 700, color: k.strong, lineHeight: 1.02, letterSpacing: "-.01em" }}>{d.name}</div>
    {d.title && <div style={{ fontSize: 13, letterSpacing: ".26em", textTransform: "uppercase", color: k.accent, marginTop: ".75rem" }}>{d.title}</div>}
    <div style={{ marginTop: ".75rem", paddingBottom: "1.3rem", borderBottom: `1px solid ${k.line}` }}><Contact d={d} k={k} sep="       " /></div>
    {d.summary && <p style={{ fontFamily: k.disp, fontSize: 17, lineHeight: 1.55, color: k.strong, fontWeight: 400, margin: "1.5rem 0 .3rem" }}>{d.summary}</p>}
    {d.achievements?.length ? (
      <div style={{ margin: "1.7rem 0" }}>
        <Quiet k={k} mt="0">Selected Achievements</Quiet>
        {d.achievements.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: "1.1rem", padding: ".6rem 0", borderTop: i ? `1px solid ${k.line}` : "none" }}>
            <span style={{ fontFamily: k.disp, fontSize: 20, color: k.accent, fontWeight: 700, width: 30, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
            <span style={{ fontSize: 13.5, lineHeight: 1.5, color: k.strong }}>{a}</span>
          </div>
        ))}
      </div>
    ) : null}
    <Quiet k={k}>Experience</Quiet><Experience d={d} k={k} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2.4rem", marginTop: "1.5rem" }}>
      <div><Quiet k={k} mt="0">Education</Quiet><Education d={d} k={k} /></div>
      <div><Quiet k={k} mt="0">Expertise</Quiet><div style={{ fontSize: 12.6, color: k.ink, lineHeight: 1.85 }}>{d.skills.join("  ·  ")}</div></div>
    </div>
  </Page>
);

// 2 · ATS ULTRA — elite centered single-column, maximum parse-safety.
const Monarch = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef}>
    <div style={{ textAlign: "center", paddingBottom: "1rem", borderBottom: `1px solid ${k.line}` }}>
      <div style={{ fontSize: 31, fontWeight: 700, letterSpacing: ".02em", color: k.strong }}>{d.name}</div>
      {d.title && <div style={{ marginTop: ".4rem", fontSize: 12.5, letterSpacing: ".2em", textTransform: "uppercase", color: k.accent }}>{d.title}</div>}
      <div style={{ marginTop: ".6rem", display: "flex", justifyContent: "center" }}><Contact d={d} k={k} /></div>
    </div>
    {d.summary && (<><Plain k={k} mt="1.3rem">Profile</Plain><Summary d={d} k={k} /></>)}
    <Plain k={k}>Experience</Plain><Experience d={d} k={k} />
    <Plain k={k}>Education</Plain><Education d={d} k={k} />
    <Plain k={k}>Skills</Plain><div style={{ fontSize: 12.8, color: k.ink, lineHeight: 1.7 }}>{d.skills.join("  ·  ")}</div>
    {d.certifications.length > 0 && (<><Plain k={k}>Certifications</Plain><div style={{ fontSize: 12.8, color: k.ink }}>{d.certifications.join("  ·  ")}</div></>)}
  </Page>
);

// 3 · TECHNOLOGY — dark, code-inspired, terminal paths, tech-stack matrix.
const Terminal = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => {
  const Path = ({ children }: { children: ReactNode }) => <div style={{ color: k.accent, fontSize: 12, fontWeight: 700, margin: "1.4rem 0 .6rem" }}>{children}</div>;
  const groups = d.skillGroups?.length ? d.skillGroups : [{ label: "skills", items: d.skills }];
  return (
    <Page k={k} innerRef={innerRef}>
      <div style={{ borderBottom: `1px solid ${k.line}`, paddingBottom: "1rem" }}>
        <div style={{ color: k.muted, fontSize: 12 }}>{"// curriculum vitae"}</div>
        <div style={{ fontSize: 27, fontWeight: 700, color: k.strong, marginTop: ".35rem" }}>{d.name}</div>
        {d.title && <div style={{ color: k.accent, fontSize: 13, marginTop: ".25rem" }}>{d.title}</div>}
        <div style={{ marginTop: ".7rem", fontSize: 11.5, color: k.ink, display: "flex", flexWrap: "wrap", gap: ".25rem 1.4rem" }}>
          {[d.contact.email, d.contact.location, d.github, d.contact.linkedin].filter(Boolean).map((c, i) => <span key={i}><span style={{ color: k.accent }}>{["@", "loc", "git", "in"][i]}:</span> {c}</span>)}
        </div>
      </div>
      <Path>~/tech-stack</Path>
      <div style={{ border: `1px solid ${k.line}`, borderRadius: 6, overflow: "hidden" }}>
        {groups.map((g, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(0,140px) 1fr", borderTop: i ? `1px solid ${k.line}` : "none" }}>
            <div style={{ padding: ".55rem .8rem", color: k.accent, fontSize: 12, background: hexA(k.accent, 0.06) }}>{g.label}</div>
            <div style={{ padding: ".55rem .8rem", color: k.ink, fontSize: 12 }}>{g.items.join("  ·  ")}</div>
          </div>
        ))}
      </div>
      {d.projects?.length ? (<><Path>~/projects</Path><Projects d={d} k={k} /></>) : null}
      <Path>~/experience</Path><Experience d={d} k={k} compact />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2rem" }}>
        <div><Path>~/certifications</Path><Stack items={d.certifications} k={k} /></div>
        <div><Path>~/education</Path><Education d={d} k={k} /></div>
      </div>
    </Page>
  );
};

// 4 · CONSULTING — left metrics rail + case-study engagements.
const Meridian = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef}>
    <div style={{ borderBottom: `2px solid ${k.accent}`, paddingBottom: ".8rem" }}>
      <div style={{ fontSize: 29, fontWeight: 800, color: k.strong, letterSpacing: "-.01em" }}>{d.name}</div>
      {d.title && <div style={{ color: k.accent, fontSize: 12.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", marginTop: ".25rem" }}>{d.title}</div>}
      <div style={{ marginTop: ".4rem" }}><Contact d={d} k={k} /></div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,2.15fr)", gap: "0 1.8rem", marginTop: ".3rem" }}>
      <div style={{ borderRight: `1px solid ${k.line}`, paddingRight: "1.4rem" }}>
        {d.metrics?.length ? (<><Underline k={k} mt="1.3rem">Impact</Underline>{d.metrics.map((m, i) => (
          <div key={i} style={{ marginBottom: ".75rem" }}>
            <div style={{ fontSize: 25, fontWeight: 800, color: k.accent, lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 10.5, color: k.muted, textTransform: "uppercase", letterSpacing: ".05em", marginTop: ".15rem" }}>{m.label}</div>
          </div>
        ))}</>) : null}
        <Underline k={k}>Expertise</Underline><Stack items={d.skills} k={k} />
        <Underline k={k}>Education</Underline><Education d={d} k={k} />
        <Underline k={k}>Languages</Underline><Stack items={d.languages} k={k} />
      </div>
      <div>
        {d.summary && (<><Underline k={k} mt="1.3rem">Profile</Underline><Summary d={d} k={k} /></>)}
        <Underline k={k}>Selected Engagements</Underline>
        {d.experiences.map((x, i) => (
          <div key={i} style={{ borderLeft: `2px solid ${hexA(k.accent, 0.45)}`, paddingLeft: ".95rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: k.strong }}>{x.company}</span>
              {(x.start || x.end) && <span style={{ color: k.muted, fontSize: 11.5 }}>{[x.start, x.end].filter(Boolean).join(" – ")}</span>}
            </div>
            <div style={{ color: k.accent, fontSize: 12.5, fontWeight: 600, fontStyle: "italic", marginTop: 1 }}>{x.title}</div>
            <div style={{ marginTop: ".35rem" }}>{x.bullets.map((b, j) => <Bullet key={j} k={k}>{b}</Bullet>)}</div>
          </div>
        ))}
      </div>
    </div>
  </Page>
);

// 5 · MODERN CORPORATE — accent top-bar enterprise, strong hierarchy.
const Vanguard = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef} pad={false}>
    <div style={{ height: 6, background: k.accent }} />
    <div style={{ padding: "2.1rem 2.7rem 2.4rem" }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: k.strong, letterSpacing: "-.01em" }}>{d.name}</div>
      {d.title && <div style={{ color: k.accent, fontSize: 13, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", marginTop: ".3rem" }}>{d.title}</div>}
      <div style={{ marginTop: ".5rem", paddingBottom: ".9rem", borderBottom: `1px solid ${k.line}` }}><Contact d={d} k={k} /></div>
      {d.summary && (<><Tick k={k} mt="1.2rem">Profile</Tick><Summary d={d} k={k} /></>)}
      <Tick k={k}>Experience</Tick><Experience d={d} k={k} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2.2rem" }}>
        <div><Tick k={k}>Education</Tick><Education d={d} k={k} /></div>
        <div><Tick k={k}>Certifications</Tick><Stack items={d.certifications} k={k} /></div>
      </div>
      <Tick k={k}>Skills</Tick><Chips items={d.skills} k={k} />
    </div>
  </Page>
);

// 6 · PREMIUM TWO-COLUMN — full-height dark side rail with photo.
const RailHead = ({ children }: { children: ReactNode }) => (
  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", margin: "1.4rem 0 .55rem", borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: ".75rem" }}>{children}</div>
);
const Vertex = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => {
  const rail = k.accent;
  const MainHead = ({ children }: { children: ReactNode }) => <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: rail, margin: "1.4rem 0 .6rem" }}>{children}</div>;
  return (
    <div ref={innerRef} className="rounded-xl border overflow-hidden shadow-premium" style={{ background: "#fff", color: k.ink, borderColor: k.line, fontFamily: k.font, display: "grid", gridTemplateColumns: "minmax(0,0.8fr) minmax(0,2fr)" }}>
      <div style={{ background: rail, color: "#e5e7eb", padding: "2rem 1.5rem" }}>
        <div style={{ width: 92, height: 92, borderRadius: 9999, background: "rgba(255,255,255,0.12)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700, margin: "0 auto 1rem" }}><Initials d={d} /></div>
        <RailHead>Contact</RailHead>
        <div style={{ fontSize: 11.8, lineHeight: 1.7 }}>{[d.contact.location, d.contact.email, d.contact.phone, d.contact.linkedin].filter(Boolean).map((c, i) => <div key={i} style={{ wordBreak: "break-word", margin: ".1rem 0" }}>{c}</div>)}</div>
        <RailHead>Skills</RailHead>
        <div>{d.skills.map((s, i) => <div key={i} style={{ fontSize: 11.8, margin: ".22rem 0", display: "flex", gap: ".45rem" }}><span style={{ color: "#fff", opacity: 0.45 }}>—</span>{s}</div>)}</div>
        <RailHead>Languages</RailHead>
        <div style={{ fontSize: 11.8, lineHeight: 1.7 }}>{d.languages.map((l, i) => <div key={i}>{l}</div>)}</div>
        {d.certifications.length > 0 && (<><RailHead>Certifications</RailHead><div style={{ fontSize: 11.3, lineHeight: 1.55 }}>{d.certifications.map((c, i) => <div key={i} style={{ margin: ".2rem 0" }}>{c}</div>)}</div></>)}
      </div>
      <div style={{ padding: "2rem 2rem" }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: k.strong, lineHeight: 1.05 }}>{d.name}</div>
        {d.title && <div style={{ color: rail, fontSize: 13, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", marginTop: ".35rem" }}>{d.title}</div>}
        <div style={{ height: 3, width: 48, background: rail, margin: "1rem 0 1.2rem" }} />
        {d.summary && (<><MainHead>Profile</MainHead><Summary d={d} k={k} /></>)}
        <MainHead>Experience</MainHead><Experience d={d} k={k} />
        <MainHead>Education</MainHead><Education d={d} k={k} />
      </div>
    </div>
  );
};

// 7 · NORDIC — extreme minimalism, light name, big whitespace, no rules.
const Fjord = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => {
  const Sec = ({ label, children }: { label: string; children: ReactNode }) => (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,118px) minmax(0,1fr)", gap: "0 2.2rem", padding: "1.5rem 0" }}>
      <div style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: ".22em", textTransform: "uppercase", color: k.muted, paddingTop: 3 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
  const sep = "   /   ";
  return (
    <div ref={innerRef} className="rounded-xl border overflow-hidden shadow-premium" style={{ background: "#fcfcfd", color: k.ink, borderColor: k.line, fontFamily: k.font }}>
      <div style={{ padding: "3.6rem 3rem 1.6rem" }}>
        <div style={{ fontSize: 40, fontWeight: 300, color: k.strong, letterSpacing: "-.015em" }}>{d.name}</div>
        {d.title && <div style={{ color: k.muted, fontSize: 14.5, marginTop: ".55rem", fontWeight: 400 }}>{d.title}</div>}
      </div>
      <div style={{ padding: "0 3rem 3rem", borderTop: `1px solid ${k.line}` }}>
        <Sec label="Contact"><div style={{ fontSize: 12.5, color: k.ink, lineHeight: 1.9 }}>{[d.contact.location, d.contact.email, d.contact.phone, d.contact.linkedin].filter(Boolean).join(sep)}</div></Sec>
        {d.summary && <Sec label="Profile"><p style={{ fontSize: 13.5, lineHeight: 1.78, color: k.ink }}>{d.summary}</p></Sec>}
        <Sec label="Experience"><Experience d={d} k={k} /></Sec>
        <Sec label="Education"><Education d={d} k={k} /></Sec>
        <Sec label="Skills"><div style={{ fontSize: 13, color: k.ink, lineHeight: 2 }}>{d.skills.join(sep)}</div></Sec>
        <Sec label="Languages"><div style={{ fontSize: 13, color: k.ink }}>{d.languages.join(sep)}</div></Sec>
      </div>
    </div>
  );
};

// 8 · ACADEMIC — serif scholarly hierarchy, publications, grants.
const Scholar = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef}>
    <div style={{ textAlign: "center", paddingBottom: ".9rem", borderBottom: `2px solid ${k.accent}` }}>
      <div style={{ fontFamily: k.disp, fontSize: 30, fontWeight: 600, color: k.strong }}>{d.name}</div>
      {d.title && <div style={{ color: k.accent, fontSize: 12.5, marginTop: ".35rem", letterSpacing: ".1em", textTransform: "uppercase" }}>{d.title}</div>}
      <div style={{ marginTop: ".4rem", display: "flex", justifyContent: "center" }}><Contact d={d} k={k} /></div>
    </div>
    {d.summary && (<><Underline k={k} mt="1.2rem">Research Interests</Underline><Summary d={d} k={k} /></>)}
    <Underline k={k}>Education</Underline><Education d={d} k={k} />
    {d.publications?.length ? (<><Underline k={k}>Selected Publications</Underline><Publications d={d} k={k} /></>) : null}
    {d.projects?.length ? (<><Underline k={k}>Research Projects</Underline><Projects d={d} k={k} /></>) : null}
    <Underline k={k}>Appointments &amp; Experience</Underline><Experience d={d} k={k} compact />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2.2rem" }}>
      <div><Underline k={k}>Grants &amp; Awards</Underline><Stack items={d.certifications} k={k} /></div>
      <div><Underline k={k}>Languages</Underline><Stack items={d.languages} k={k} /></div>
    </div>
  </Page>
);

// 9 · CREATIVE — gradient header, portfolio cards.
const Studio = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef} pad={false}>
    <div style={{ background: `linear-gradient(120deg, ${k.accent}, ${hexA(k.accent, 0.75)})`, color: "#fff", padding: "2.4rem 2.7rem" }}>
      <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1 }}>{d.name}</div>
      {d.title && <div style={{ marginTop: ".5rem", fontSize: 14, fontWeight: 600, opacity: 0.92 }}>{d.title}</div>}
      <div style={{ marginTop: ".8rem", fontSize: 12.5, opacity: 0.9 }}>{[d.contact.email, d.contact.location, d.portfolio].filter(Boolean).join("   ·   ")}</div>
    </div>
    <div style={{ padding: "1.7rem 2.7rem 2.4rem" }}>
      {d.summary && <Summary d={d} k={k} />}
      {d.projects?.length ? (<><Tick k={k}>Portfolio</Tick><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>{d.projects.map((p, i) => (<div key={i} style={{ border: `1px solid ${k.line}`, borderRadius: 8, padding: ".8rem .9rem" }}><div style={{ fontWeight: 700, fontSize: 13, color: k.strong }}>{p.name}</div>{p.tech && <div style={{ fontSize: 11, color: k.accent, fontWeight: 600 }}>{p.tech}</div>}{p.description && <div style={{ fontSize: 12, color: k.ink, marginTop: ".2rem" }}>{p.description}</div>}</div>))}</div></>) : null}
      <Tick k={k}>Experience</Tick><Experience d={d} k={k} compact />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2.2rem" }}>
        <div><Tick k={k}>Skills</Tick><Chips items={d.skills} k={k} /></div>
        <div><Tick k={k}>Education</Tick><Education d={d} k={k} /></div>
      </div>
    </div>
  </Page>
);

// 10 · STARTUP — condensed display, vivid metric band, ventures as cards.
const Velocity = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef} pad={false}>
    <div style={{ padding: "2.2rem 2.6rem 1.4rem" }}>
      <div style={{ fontFamily: k.disp, fontSize: 44, fontWeight: 700, color: k.strong, letterSpacing: "-.02em", lineHeight: 1 }}>{d.name}</div>
      {d.title && <div style={{ color: k.accent, fontSize: 14, fontWeight: 700, marginTop: ".45rem" }}>{d.title}</div>}
      <div style={{ marginTop: ".55rem" }}><Contact d={d} k={k} /></div>
    </div>
    {d.metrics?.length ? (
      <div style={{ background: k.accent, color: "#fff", display: "grid", gridTemplateColumns: `repeat(${Math.min(d.metrics.length, 4)}, 1fr)`, padding: "1.1rem 2.6rem", gap: "1rem" }}>
        {d.metrics.map((m, i) => (<div key={i}><div style={{ fontFamily: k.disp, fontSize: 27, fontWeight: 700, lineHeight: 1 }}>{m.value}</div><div style={{ fontSize: 10.5, opacity: 0.9, textTransform: "uppercase", letterSpacing: ".06em", marginTop: ".25rem" }}>{m.label}</div></div>))}
      </div>
    ) : null}
    <div style={{ padding: "1.5rem 2.6rem 2.4rem" }}>
      {d.summary && <p style={{ fontSize: 13, lineHeight: 1.6, color: k.ink }}>{d.summary}</p>}
      <Tick k={k}>Ventures &amp; Experience</Tick>
      {d.experiences.map((x, i) => (
        <div key={i} style={{ border: `1px solid ${k.line}`, borderRadius: 10, padding: "1rem 1.1rem", marginBottom: ".7rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline" }}>
            <span style={{ fontFamily: k.disp, fontWeight: 700, fontSize: 15, color: k.strong }}>{x.company}</span>
            {(x.start || x.end) && <span style={{ color: k.muted, fontSize: 11.5 }}>{[x.start, x.end].filter(Boolean).join(" – ")}</span>}
          </div>
          <div style={{ color: k.accent, fontSize: 12.5, fontWeight: 600, marginTop: 1 }}>{x.title}</div>
          <div style={{ marginTop: ".4rem" }}>{x.bullets.map((b, j) => <Bullet key={j} k={k}>{b}</Bullet>)}</div>
        </div>
      ))}
      {d.projects?.length ? (<><Tick k={k}>Product Launches</Tick><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".7rem" }}>{d.projects.map((p, i) => (<div key={i} style={{ border: `1px solid ${k.line}`, borderRadius: 10, padding: ".8rem .9rem" }}><div style={{ fontWeight: 700, fontSize: 13, color: k.strong }}>{p.name}</div>{p.tech && <div style={{ fontSize: 11, color: k.accent, fontWeight: 600 }}>{p.tech}</div>}{p.description && <div style={{ fontSize: 12, color: k.ink, marginTop: ".2rem" }}>{p.description}</div>}</div>))}</div></>) : null}
      <Tick k={k}>Skills</Tick><Chips items={d.skills} k={k} />
    </div>
  </Page>
);

// 11 · GOVERNMENT — formal, double rules, clearance line.
const Sentinel = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef}>
    <div style={{ textAlign: "center", borderBottom: `3px double ${k.accent}`, paddingBottom: ".9rem" }}>
      <div style={{ fontSize: 27, fontWeight: 700, color: k.strong, letterSpacing: ".04em", textTransform: "uppercase" }}>{d.name}</div>
      {d.title && <div style={{ color: k.muted, fontSize: 13, marginTop: ".35rem" }}>{d.title}</div>}
      <div style={{ marginTop: ".45rem", display: "flex", justifyContent: "center" }}><Contact d={d} k={k} sep="   |   " /></div>
    </div>
    {d.clearance && <div style={{ textAlign: "center", margin: ".9rem 0", padding: ".5rem", background: k.soft, border: `1px solid ${k.line}`, fontSize: 12, fontWeight: 600, color: k.strong, letterSpacing: ".03em" }}>{d.clearance}</div>}
    {d.summary && (<><Underline k={k}>Profile</Underline><Summary d={d} k={k} /></>)}
    <Underline k={k}>Professional Experience</Underline><Experience d={d} k={k} />
    <Underline k={k}>Education</Underline><Education d={d} k={k} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2.2rem" }}>
      <div><Underline k={k}>Certifications</Underline><Stack items={d.certifications} k={k} /></div>
      <div><Underline k={k}>Competencies</Underline><Stack items={d.skills} k={k} /></div>
    </div>
  </Page>
);

// 12 · INTERNATIONAL — language-proficiency panel, global format.
const Global = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef}>
    <div style={{ borderBottom: `2px solid ${k.accent}`, paddingBottom: ".8rem" }}>
      <div style={{ fontSize: 29, fontWeight: 800, color: k.strong, letterSpacing: "-.01em" }}>{d.name}</div>
      {d.title && <div style={{ color: k.accent, fontSize: 12.5, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", marginTop: ".25rem" }}>{d.title}</div>}
      <div style={{ marginTop: ".4rem" }}><Contact d={d} k={k} /></div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.8fr) minmax(0,1fr)", gap: "0 2rem" }}>
      <div>
        {d.summary && (<><Tick k={k}>Profile</Tick><Summary d={d} k={k} /></>)}
        <Tick k={k}>Experience</Tick><Experience d={d} k={k} />
      </div>
      <div>
        <Tick k={k}>Languages</Tick><LanguagePanel d={d} k={k} />
        <Tick k={k}>Skills</Tick><Chips items={d.skills} k={k} />
        <Tick k={k}>Education</Tick><Education d={d} k={k} />
        {d.certifications.length > 0 && (<><Tick k={k}>Certifications</Tick><Stack items={d.certifications} k={k} /></>)}
      </div>
    </div>
  </Page>
);

const RENDERERS: Record<string, (p: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => JSX.Element> = {
  "executive-boardroom": Boardroom,
  "premium-single": Monarch,
  "tech-architect": Terminal,
  "consulting-elite": Meridian,
  "corporate-modern": Vanguard,
  "premium-twocol": Vertex,
  "nordic-professional": Fjord,
  "academic-research": Scholar,
  "creative-professional": Studio,
  "startup-leader": Velocity,
  "government-public": Sentinel,
  "international-pro": Global,
};

interface Props {
  data: CvData;
  template?: string;
  innerRef?: Ref<HTMLDivElement>;
}

const PremiumCv = ({ data, template, innerRef }: Props) => {
  const t = getPremiumTemplate(template) ?? getPremiumTemplate("corporate-modern")!;
  const k = toK(t);
  const Renderer = RENDERERS[t.id] ?? Vanguard;
  return <Renderer d={data} k={k} innerRef={innerRef} />;
};

export default PremiumCv;
