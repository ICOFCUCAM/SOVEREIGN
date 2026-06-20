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
  font: string; accent: string; dark: boolean;
  bg: string; ink: string; strong: string; muted: string; line: string; soft: string; chip: string;
}
const toK = (t: PremiumTemplate): K => {
  const dark = !!t.dark;
  return {
    font: FONT_FAMILY[t.font], accent: t.accent, dark,
    bg: dark ? "#0f172a" : "#ffffff",
    ink: dark ? "#cbd5e1" : "#374151",
    strong: dark ? "#ffffff" : "#0f172a",
    muted: dark ? "#94a3b8" : "#6b7280",
    line: dark ? "rgba(255,255,255,0.12)" : "#e8eaed",
    soft: dark ? "rgba(255,255,255,0.05)" : "#f6f8fa",
    chip: dark ? "rgba(255,255,255,0.08)" : "#eef2f7",
  };
};

/* ── shared atoms ── */
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
// Section header variants
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

const Experience = ({ data, k, compact }: { data: CvData; k: K; compact?: boolean }) => (
  <div>
    {data.experiences.map((x, i) => (
      <div key={i} style={{ marginBottom: i === data.experiences.length - 1 ? 0 : compact ? ".8rem" : "1.05rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline" }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: k.strong, lineHeight: 1.25 }}>{x.title}</div>
          {(x.start || x.end) && <div style={{ color: k.muted, fontSize: 11.5, whiteSpace: "nowrap", fontWeight: 500 }}>{[x.start, x.end].filter(Boolean).join(" – ")}</div>}
        </div>
        {x.company && <div style={{ color: k.accent, fontSize: 12.8, fontWeight: 600, marginTop: 1 }}>{x.company}</div>}
        <div style={{ marginTop: ".4rem" }}>{x.bullets.map((b, j) => <Bullet key={j} k={k}>{b}</Bullet>)}</div>
      </div>
    ))}
  </div>
);
const Education = ({ data, k }: { data: CvData; k: K }) => (
  <div>{data.education.map((e, i) => (
    <div key={i} style={{ margin: ".35rem 0" }}>
      <div style={{ fontWeight: 600, fontSize: 12.8, color: k.strong }}>{[e.degree, e.field].filter(Boolean).join(", ")}</div>
      <div style={{ color: k.muted, fontSize: 12 }}>{[e.institution, e.year].filter(Boolean).join(" · ")}</div>
    </div>
  ))}</div>
);
const Stack = ({ items, k }: { items: string[]; k: K }) => (
  <div>{items.map((s, i) => <div key={i} style={{ fontSize: 12.6, color: k.ink, margin: ".22rem 0" }}>{s}</div>)}</div>
);
const Summary = ({ data, k }: { data: CvData; k: K }) => data.summary ? <p style={{ fontSize: 13, lineHeight: 1.62, color: k.ink, textAlign: "justify" }}>{data.summary}</p> : null;
const Contact = ({ data, k, sep = "  ·  " }: { data: CvData; k: K; sep?: string }) => {
  const items = [data.contact.location, data.contact.email, data.contact.phone, data.contact.linkedin].filter(Boolean) as string[];
  return <span style={{ color: k.muted, fontSize: 12.3 }}>{items.join(sep)}</span>;
};
const Initials = ({ data }: { data: CvData }) => <>{data.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")}</>;

/* ── signature sections ── */
const MetricBand = ({ data, k, boxed }: { data: CvData; k: K; boxed?: boolean }) => !data.metrics?.length ? null : (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(data.metrics.length, 4)}, 1fr)`, gap: boxed ? 0 : "1rem", border: boxed ? `1px solid ${k.line}` : "none", borderRadius: boxed ? 8 : 0, overflow: "hidden", margin: ".4rem 0" }}>
    {data.metrics.map((m, i) => (
      <div key={i} style={{ padding: boxed ? "0.9rem 1rem" : 0, borderRight: boxed && i < data.metrics!.length - 1 ? `1px solid ${k.line}` : "none", textAlign: boxed ? "center" : "left" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: k.accent, lineHeight: 1 }}>{m.value}</div>
        <div style={{ fontSize: 11, color: k.muted, marginTop: ".25rem", textTransform: "uppercase", letterSpacing: ".05em" }}>{m.label}</div>
      </div>
    ))}
  </div>
);
const SkillsMatrix = ({ data, k }: { data: CvData; k: K }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: ".5rem", border: `1px solid ${k.line}`, borderRadius: 8, padding: "1rem", background: k.soft }}>
    {data.skills.map((s, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: ".4rem", fontSize: 12.2, color: k.ink }}>
        <span style={{ width: 6, height: 6, background: k.accent, borderRadius: 2, flexShrink: 0 }} />{s}
      </div>
    ))}
  </div>
);
const Projects = ({ data, k }: { data: CvData; k: K }) => !data.projects?.length ? null : (
  <div>{data.projects.map((p, i) => (
    <div key={i} style={{ marginBottom: ".7rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: k.strong }}>{p.name}</span>
        {p.tech && <span style={{ fontSize: 11, color: k.accent, fontWeight: 600, whiteSpace: "nowrap" }}>{p.tech}</span>}
      </div>
      {p.description && <div style={{ fontSize: 12.4, color: k.ink, marginTop: ".15rem" }}>{p.description}</div>}
    </div>
  ))}</div>
);
const Publications = ({ data, k }: { data: CvData; k: K }) => !data.publications?.length ? null : (
  <ol style={{ margin: 0, paddingLeft: "1.1rem" }}>{data.publications.map((p, i) => (
    <li key={i} style={{ fontSize: 12.3, color: k.ink, margin: ".3rem 0", lineHeight: 1.5 }}>{p}</li>
  ))}</ol>
);
const Achievements = ({ data, k }: { data: CvData; k: K }) => !data.achievements?.length ? null : (
  <div>{data.achievements.map((a, i) => (
    <div key={i} style={{ display: "flex", gap: ".55rem", margin: ".35rem 0", paddingLeft: ".2rem", borderLeft: `2px solid ${k.accent}`, paddingTop: 1, paddingBottom: 1 }}>
      <span style={{ fontSize: 12.8, lineHeight: 1.5, color: k.strong, paddingLeft: ".55rem", fontWeight: 500 }}>{a}</span>
    </div>
  ))}</div>
);
const LanguagePanel = ({ data, k }: { data: CvData; k: K }) => {
  const levels = data.languageLevels?.length ? data.languageLevels : data.languages.map((l) => ({ language: l, level: "" }));
  return (
    <div>{levels.map((l, i) => (
      <div key={i} style={{ margin: ".3rem 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.4 }}>
          <span style={{ color: k.strong, fontWeight: 600 }}>{l.language}</span>
          <span style={{ color: k.muted }}>{l.level}</span>
        </div>
      </div>
    ))}</div>
  );
};

const Page = ({ k, children, innerRef, pad = true }: { k: K; children: ReactNode; innerRef?: Ref<HTMLDivElement>; pad?: boolean }) => (
  <div ref={innerRef} className="rounded-xl border overflow-hidden shadow-premium" style={{ background: k.bg, color: k.ink, borderColor: k.line, fontFamily: k.font }}>
    <div style={pad ? { padding: "2.5rem 2.7rem" } : undefined}>{children}</div>
  </div>
);

/* ── 12 distinct architectures ── */

const Boardroom = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef} pad={false}>
    <div style={{ background: k.accent, color: "#fff", padding: "2.2rem 2.7rem" }}>
      <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1 }}>{d.name}</div>
      {d.title && <div style={{ marginTop: ".6rem", fontSize: 14, fontWeight: 500, letterSpacing: ".18em", textTransform: "uppercase", opacity: 0.85 }}>{d.title}</div>}
      <div style={{ marginTop: ".9rem", opacity: 0.8 }}><Contact data={d} k={{ ...k, muted: "rgba(255,255,255,0.85)" }} sep="   |   " /></div>
    </div>
    <div style={{ padding: "1.8rem 2.7rem 2.4rem" }}>
      {d.summary && (<><Plain k={k} mt="0">Executive Summary</Plain><p style={{ fontSize: 14, lineHeight: 1.6, color: k.strong }}>{d.summary}</p></>)}
      {d.achievements?.length ? (<><Plain k={k}>Signature Achievements</Plain><Achievements data={d} k={k} /></>) : null}
      <Plain k={k}>Experience</Plain><Experience data={d} k={k} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2.2rem" }}>
        <div><Plain k={k}>Education</Plain><Education data={d} k={k} /></div>
        <div><Plain k={k}>Core Expertise</Plain><Chips items={d.skills} k={k} /></div>
      </div>
    </div>
  </Page>
);

const Monarch = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef}>
    <div style={{ textAlign: "center", paddingBottom: "1rem", borderBottom: `1px solid ${k.line}` }}>
      <div style={{ fontSize: 31, fontWeight: 700, letterSpacing: ".02em", color: k.strong }}>{d.name}</div>
      {d.title && <div style={{ marginTop: ".4rem", fontSize: 12.5, letterSpacing: ".2em", textTransform: "uppercase", color: k.accent }}>{d.title}</div>}
      <div style={{ marginTop: ".6rem" }}><Contact data={d} k={k} /></div>
    </div>
    {d.summary && (<><Plain k={k} mt="1.3rem">Profile</Plain><Summary data={d} k={k} /></>)}
    <Plain k={k}>Experience</Plain><Experience data={d} k={k} />
    <Plain k={k}>Education</Plain><Education data={d} k={k} />
    <Plain k={k}>Skills</Plain><div style={{ fontSize: 12.8, color: k.ink, lineHeight: 1.7 }}>{d.skills.join("  ·  ")}</div>
    {d.certifications.length > 0 && (<><Plain k={k}>Certifications</Plain><div style={{ fontSize: 12.8, color: k.ink }}>{d.certifications.join("  ·  ")}</div></>)}
  </Page>
);

const Architect = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `2px solid ${k.accent}`, paddingBottom: ".8rem" }}>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: k.strong, letterSpacing: "-.01em" }}>{d.name}</div>
        {d.title && <div style={{ color: k.accent, fontSize: 12.5, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", marginTop: ".25rem" }}>{d.title}</div>}
      </div>
      <div style={{ textAlign: "right", fontSize: 12, color: k.muted, lineHeight: 1.65 }}>{[d.contact.email, d.contact.phone, d.contact.location, d.contact.linkedin].filter(Boolean).map((c, i) => <div key={i}>{c}</div>)}</div>
    </div>
    <Tick k={k}>Technical Skills</Tick><SkillsMatrix data={d} k={k} />
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)", gap: "0 2rem" }}>
      <div>
        {d.projects?.length ? (<><Tick k={k}>Key Projects</Tick><Projects data={d} k={k} /></>) : null}
        <Tick k={k}>Experience</Tick><Experience data={d} k={k} compact />
      </div>
      <div>
        {d.certifications.length > 0 && (<><Tick k={k}>Certifications</Tick><Stack items={d.certifications} k={k} /></>)}
        <Tick k={k}>Education</Tick><Education data={d} k={k} />
      </div>
    </div>
  </Page>
);

const Meridian = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef}>
    <div style={{ paddingBottom: ".7rem" }}>
      <div style={{ fontSize: 29, fontWeight: 800, color: k.strong, letterSpacing: "-.01em" }}>{d.name}</div>
      {d.title && <div style={{ color: k.accent, fontSize: 12.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", marginTop: ".25rem" }}>{d.title}</div>}
      <div style={{ marginTop: ".4rem" }}><Contact data={d} k={k} /></div>
    </div>
    <MetricBand data={d} k={k} boxed />
    {d.summary && (<><Underline k={k}>Profile</Underline><Summary data={d} k={k} /></>)}
    <Underline k={k}>Selected Engagements</Underline><Experience data={d} k={k} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2.2rem" }}>
      <div><Underline k={k}>Education</Underline><Education data={d} k={k} /></div>
      <div><Underline k={k}>Expertise</Underline><Chips items={d.skills} k={k} /></div>
    </div>
  </Page>
);

const Vanguard = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef} pad={false}>
    <div style={{ height: 6, background: k.accent }} />
    <div style={{ padding: "2.1rem 2.7rem 2.4rem" }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: k.strong, letterSpacing: "-.01em" }}>{d.name}</div>
      {d.title && <div style={{ color: k.accent, fontSize: 13, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", marginTop: ".3rem" }}>{d.title}</div>}
      <div style={{ marginTop: ".5rem", paddingBottom: ".9rem", borderBottom: `1px solid ${k.line}` }}><Contact data={d} k={k} /></div>
      {d.summary && (<><Tick k={k} mt="1.2rem">Profile</Tick><Summary data={d} k={k} /></>)}
      <Tick k={k}>Experience</Tick><Experience data={d} k={k} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2.2rem" }}>
        <div><Tick k={k}>Education</Tick><Education data={d} k={k} /></div>
        <div><Tick k={k}>Certifications</Tick><Stack items={d.certifications} k={k} /></div>
      </div>
      <Tick k={k}>Skills</Tick><Chips items={d.skills} k={k} />
    </div>
  </Page>
);

const SidebarBase = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <div ref={innerRef} className="rounded-xl border overflow-hidden shadow-premium" style={{ background: k.bg, color: k.ink, borderColor: k.line, fontFamily: k.font }}>
    <div style={{ display: "flex", alignItems: "center", gap: "1.3rem", padding: "1.9rem 2.2rem", background: k.dark ? hexA(k.accent, 0.16) : k.soft, borderBottom: `1px solid ${k.line}` }}>
      <div style={{ width: 78, height: 78, borderRadius: 9999, background: k.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 26, flexShrink: 0 }}><Initials data={d} /></div>
      <div><div style={{ fontSize: 26, fontWeight: 800, color: k.strong, lineHeight: 1.1 }}>{d.name}</div>{d.title && <div style={{ color: k.accent, fontSize: 12.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", marginTop: ".3rem" }}>{d.title}</div>}</div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,0.86fr) minmax(0,2fr)" }}>
      <div style={{ background: k.dark ? hexA(k.accent, 0.08) : k.soft, padding: "1.5rem 1.5rem", borderRight: `1px solid ${k.line}` }}>
        <Plain k={k} mt="0">Contact</Plain><Stack items={[d.contact.location, d.contact.email, d.contact.phone, d.contact.linkedin].filter(Boolean) as string[]} k={k} />
        <Plain k={k}>Skills</Plain><Chips items={d.skills} k={k} />
        {d.certifications.length > 0 && (<><Plain k={k}>Certifications</Plain><Stack items={d.certifications} k={k} /></>)}
        <Plain k={k}>Languages</Plain><Stack items={d.languages} k={k} />
        <Plain k={k}>Education</Plain><Education data={d} k={k} />
      </div>
      <div style={{ padding: "1.5rem 1.8rem" }}>
        {d.summary && (<><Plain k={k} mt="0">Profile</Plain><Summary data={d} k={k} /></>)}
        <Plain k={k}>Experience</Plain><Experience data={d} k={k} />
      </div>
    </div>
  </div>
);

const Fjord = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => {
  const Sec = ({ label, children }: { label: string; children: ReactNode }) => (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,140px) minmax(0,1fr)", gap: "0 1.6rem", padding: "1.1rem 0", borderTop: `1px solid ${k.line}` }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", color: k.muted, paddingTop: 2 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
  return (
    <Page k={k} innerRef={innerRef}>
      <div style={{ marginBottom: "1.4rem" }}>
        <div style={{ fontSize: 32, fontWeight: 600, color: k.strong, letterSpacing: "-.01em" }}>{d.name}</div>
        {d.title && <div style={{ color: k.muted, fontSize: 14, marginTop: ".35rem" }}>{d.title}</div>}
        <div style={{ marginTop: ".7rem" }}><Contact data={d} k={k} sep="      " /></div>
      </div>
      {d.summary && <Sec label="Profile"><Summary data={d} k={k} /></Sec>}
      <Sec label="Experience"><Experience data={d} k={k} /></Sec>
      <Sec label="Education"><Education data={d} k={k} /></Sec>
      <Sec label="Skills"><div style={{ fontSize: 12.8, color: k.ink, lineHeight: 1.8 }}>{d.skills.join("   /   ")}</div></Sec>
      <Sec label="Languages"><div style={{ fontSize: 12.8, color: k.ink }}>{d.languages.join("   /   ")}</div></Sec>
    </Page>
  );
};

const Scholar = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef}>
    <div style={{ textAlign: "center", paddingBottom: ".9rem", borderBottom: `2px solid ${k.accent}` }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: k.strong }}>{d.name}</div>
      {d.title && <div style={{ color: k.accent, fontSize: 12.5, marginTop: ".3rem", letterSpacing: ".1em", textTransform: "uppercase" }}>{d.title}</div>}
      <div style={{ marginTop: ".4rem" }}><Contact data={d} k={k} /></div>
    </div>
    {d.summary && (<><Underline k={k} mt="1.2rem">Research Interests</Underline><Summary data={d} k={k} /></>)}
    <Underline k={k}>Education</Underline><Education data={d} k={k} />
    {d.publications?.length ? (<><Underline k={k}>Selected Publications</Underline><Publications data={d} k={k} /></>) : null}
    {d.projects?.length ? (<><Underline k={k}>Research Projects</Underline><Projects data={d} k={k} /></>) : null}
    <Underline k={k}>Appointments &amp; Experience</Underline><Experience data={d} k={k} compact />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2.2rem" }}>
      <div><Underline k={k}>Grants &amp; Awards</Underline><Stack items={d.certifications} k={k} /></div>
      <div><Underline k={k}>Languages</Underline><Stack items={d.languages} k={k} /></div>
    </div>
  </Page>
);

const Studio = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef} pad={false}>
    <div style={{ background: `linear-gradient(120deg, ${k.accent}, ${hexA(k.accent, 0.78)})`, color: "#fff", padding: "2.4rem 2.7rem" }}>
      <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1 }}>{d.name}</div>
      {d.title && <div style={{ marginTop: ".5rem", fontSize: 14, fontWeight: 600, letterSpacing: ".05em", opacity: 0.92 }}>{d.title}</div>}
      <div style={{ marginTop: ".8rem", fontSize: 12.5, opacity: 0.9 }}>{[d.contact.email, d.contact.location, d.portfolio].filter(Boolean).join("   ·   ")}</div>
    </div>
    <div style={{ padding: "1.7rem 2.7rem 2.4rem" }}>
      {d.summary && <Summary data={d} k={k} />}
      {d.projects?.length ? (<><Tick k={k}>Portfolio</Tick><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>{d.projects.map((p, i) => (<div key={i} style={{ border: `1px solid ${k.line}`, borderRadius: 8, padding: ".8rem .9rem" }}><div style={{ fontWeight: 700, fontSize: 13, color: k.strong }}>{p.name}</div>{p.tech && <div style={{ fontSize: 11, color: k.accent, fontWeight: 600 }}>{p.tech}</div>}{p.description && <div style={{ fontSize: 12, color: k.ink, marginTop: ".2rem" }}>{p.description}</div>}</div>))}</div></>) : null}
      <Tick k={k}>Experience</Tick><Experience data={d} k={k} compact />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2.2rem" }}>
        <div><Tick k={k}>Skills</Tick><Chips items={d.skills} k={k} /></div>
        <div><Tick k={k}>Education</Tick><Education data={d} k={k} /></div>
      </div>
    </div>
  </Page>
);

const Velocity = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef}>
    <div style={{ paddingBottom: ".8rem", borderBottom: `1px solid ${k.line}` }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: k.strong, letterSpacing: "-.02em" }}>{d.name}</div>
      {d.title && <div style={{ color: k.accent, fontSize: 13, fontWeight: 700, marginTop: ".3rem" }}>{d.title}</div>}
      <div style={{ marginTop: ".4rem" }}><Contact data={d} k={k} /></div>
    </div>
    {d.metrics?.length ? (
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", margin: "1.2rem 0 .4rem" }}>
        {d.metrics.map((m, i) => (<div key={i}><span style={{ fontSize: 28, fontWeight: 800, color: k.accent }}>{m.value}</span><div style={{ fontSize: 11.5, color: k.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>{m.label}</div></div>))}
      </div>
    ) : null}
    {d.summary && (<><Tick k={k}>Profile</Tick><Summary data={d} k={k} /></>)}
    <Tick k={k}>Ventures &amp; Experience</Tick><Experience data={d} k={k} />
    {d.projects?.length ? (<><Tick k={k}>Product Launches</Tick><Projects data={d} k={k} /></>) : null}
    <Tick k={k}>Skills</Tick><Chips items={d.skills} k={k} />
  </Page>
);

const Sentinel = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef}>
    <div style={{ textAlign: "center", borderBottom: `3px double ${k.accent}`, paddingBottom: ".9rem" }}>
      <div style={{ fontSize: 27, fontWeight: 700, color: k.strong, letterSpacing: ".03em", textTransform: "uppercase" }}>{d.name}</div>
      {d.title && <div style={{ color: k.muted, fontSize: 13, marginTop: ".35rem" }}>{d.title}</div>}
      <div style={{ marginTop: ".45rem" }}><Contact data={d} k={k} sep="   |   " /></div>
    </div>
    {d.clearance && <div style={{ textAlign: "center", margin: ".9rem 0", padding: ".5rem", background: k.soft, border: `1px solid ${k.line}`, fontSize: 12, fontWeight: 600, color: k.strong, letterSpacing: ".03em" }}>{d.clearance}</div>}
    {d.summary && (<><Underline k={k}>Profile</Underline><Summary data={d} k={k} /></>)}
    <Underline k={k}>Professional Experience</Underline><Experience data={d} k={k} />
    <Underline k={k}>Education</Underline><Education data={d} k={k} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2.2rem" }}>
      <div><Underline k={k}>Certifications</Underline><Stack items={d.certifications} k={k} /></div>
      <div><Underline k={k}>Competencies</Underline><Stack items={d.skills} k={k} /></div>
    </div>
  </Page>
);

const Global = ({ d, k, innerRef }: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => (
  <Page k={k} innerRef={innerRef}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `2px solid ${k.accent}`, paddingBottom: ".8rem" }}>
      <div><div style={{ fontSize: 29, fontWeight: 800, color: k.strong, letterSpacing: "-.01em" }}>{d.name}</div>{d.title && <div style={{ color: k.accent, fontSize: 12.5, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", marginTop: ".25rem" }}>{d.title}</div>}<div style={{ marginTop: ".4rem" }}><Contact data={d} k={k} /></div></div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.8fr) minmax(0,1fr)", gap: "0 2rem" }}>
      <div>
        {d.summary && (<><Tick k={k}>Profile</Tick><Summary data={d} k={k} /></>)}
        <Tick k={k}>Experience</Tick><Experience data={d} k={k} />
      </div>
      <div>
        <Tick k={k}>Languages</Tick><LanguagePanel data={d} k={k} />
        <Tick k={k}>Skills</Tick><Chips items={d.skills} k={k} />
        <Tick k={k}>Education</Tick><Education data={d} k={k} />
        {d.certifications.length > 0 && (<><Tick k={k}>Certifications</Tick><Stack items={d.certifications} k={k} /></>)}
      </div>
    </div>
  </Page>
);

const RENDERERS: Record<string, (p: { d: CvData; k: K; innerRef?: Ref<HTMLDivElement> }) => JSX.Element> = {
  "executive-boardroom": Boardroom,
  "premium-single": Monarch,
  "tech-architect": Architect,
  "consulting-elite": Meridian,
  "corporate-modern": Vanguard,
  "premium-twocol": SidebarBase,
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
