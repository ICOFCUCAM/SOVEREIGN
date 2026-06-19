import React, { useMemo } from "react";
import { loadActiveCompany } from "../lib/active-company";
import { buildNdaPackage, type NdaPackage } from "../lib/report-docs";
import { ReportFrame, Cover, Contents, Section, Exhibit, BankTable, Lead, Note } from "../lib/report-ui";

const SECTIONS = ["Parties & Recitals", "Terms of Agreement", "Standard Articles", "Template Suite", "Execution"];

const ReportNda: React.FC = () => {
  const { company } = useMemo(() => loadActiveCompany(), []);
  const r: NdaPackage = useMemo(() => buildNdaPackage(company), [company]);
  const p = r.primary;

  // Standard institutional NDA articles, each keyed to the engine's actual
  // template terms — boilerplate structure, real parameters.
  const articles: { n: string; title: string; body: React.ReactNode }[] = [
    { n: "1", title: "Definitions", body: <>“Confidential Information” means all non-public information disclosed by {r.parties.disclosing} (the “Disclosing Party”) to the Recipient, whether oral, written or electronic, relating to the business, finances, operations, customers, technology or prospective transaction of the Disclosing Party.</> },
    { n: "2", title: "Confidentiality Obligations", body: <>The Recipient shall hold all Confidential Information in strict confidence, use it solely to evaluate the contemplated transaction, and disclose it only to those representatives with a need to know who are bound by obligations no less protective than these.</> },
    { n: "3", title: "Exclusions", body: <>The obligations of confidentiality do not extend to information that is or becomes: {p.carveOuts.map((c, i) => <span key={i}>{i > 0 ? "; " : ""}<strong>{c.toLowerCase()}</strong></span>)}.</> },
    { n: "4", title: "Return or Destruction", body: <>Upon termination of discussions or written request, the Recipient shall return or destroy all Confidential Information within <strong>{p.returnOrDestroyDays} days</strong> and certify such destruction in writing.</> },
    { n: "5", title: "Term & Survival", body: <>The confidentiality obligations of this Agreement shall survive for <strong>{p.survivalMonths} months</strong> following the termination of the parties' discussions.</> },
    { n: "6", title: "No License or Warranty", body: <>No license to any intellectual property is granted by this Agreement, and the Confidential Information is provided “as is” without warranty of any kind.</> },
    { n: "7", title: "Remedies", body: <>The Recipient acknowledges that monetary damages may be insufficient to remedy a breach. {p.injunctiveRelief ? "The Disclosing Party shall accordingly be entitled to seek injunctive relief in addition to all other remedies at law or equity." : "The parties shall pursue available remedies at law or equity."}{p.liquidatedDamagesUsd != null ? <> Liquidated damages of <strong>{p.terms.find((t) => t.k === "Liquidated damages")?.v}</strong> shall apply to a material breach.</> : null}</> },
    { n: "8", title: "Governing Law", body: <>This Agreement shall be governed by and construed in accordance with the laws of <strong>{p.governingLaw}</strong> ({p.jurisdiction}), without regard to conflict-of-law principles. Its territorial scope is <strong>{p.scope}</strong>.</> },
  ];

  return (
    <ReportFrame docType={r.meta.title} company={company.name} frameworkVersion={r.meta.frameworkVersion}>
      <Cover docType="Non-Disclosure Agreement Package" company={company.name} preparedFor={r.parties.receiving} preparedBy={r.meta.preparedBy} date={r.meta.date} frameworkVersion={r.meta.frameworkVersion} />
      <Contents items={SECTIONS} />

      <Section n={1} title="Parties & Recitals">
        <BankTable
          columns={[{ key: "k", label: "Party" }, { key: "v", label: "Identity", align: "right" }]}
          rows={[
            { k: "Disclosing Party", v: r.parties.disclosing },
            { k: "Receiving Party", v: r.parties.receiving },
          ]}
        />
        <Lead>
          This Non-Disclosure Agreement governs the exchange of confidential information between the parties in connection with
          the evaluation of a possible acquisition of {company.name}. It is issued on the{" "}
          <strong className="text-[#0b1220]">{p.name}</strong> (v{p.version}), comprising {p.clauseCount} standard clauses, of
          which the principal articles are set out below.
        </Lead>
      </Section>

      <Section n={2} title="Terms of Agreement">
        <Exhibit n="II-A" title="Principal terms">
          <BankTable
            columns={[{ key: "k", label: "Term" }, { key: "v", label: "Provision", align: "right" }]}
            rows={p.terms.map((t) => ({ k: t.k, v: t.v }))}
            footnote="Terms are read directly from the ExitOS NDA engine's institutional template — not drafted ad hoc."
          />
        </Exhibit>
      </Section>

      <Section n={3} title="Standard Articles">
        <div className="space-y-4">
          {articles.map((a) => (
            <div key={a.n} className="avoid-break">
              <div className="flex items-baseline gap-2 border-b border-[#e3e8ef] pb-1">
                <span className="font-mono text-[11px] font-bold text-[#0e7a4f]">Article {a.n}</span>
                <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#0b1220]">{a.title}</span>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#2b3543]">{a.body}</p>
            </div>
          ))}
        </div>
        <Note>The full executed agreement contains {p.clauseCount} clauses; the articles above summarise the principal provisions. This package is a draft for counsel review and is not, by itself, an executed agreement.</Note>
      </Section>

      <Section n={4} title="Template Suite">
        <Lead>ExitOS issues NDAs from a suite of institutional templates; the appropriate form is selected per counterparty and stage.</Lead>
        <Exhibit n="IV-A" title="Available NDA templates">
          <BankTable
            columns={[
              { key: "n", label: "Template" }, { key: "s", label: "Form" }, { key: "c", label: "Clauses", align: "right" },
              { key: "su", label: "Survival", align: "right" }, { key: "rd", label: "Return", align: "right" },
              { key: "law", label: "Law", align: "right" }, { key: "inj", label: "Injunctive", align: "center" }, { key: "d", label: "Damages", align: "right" },
            ]}
            rows={r.templates.map((t) => ({
              n: t.name, s: <span className="capitalize">{t.shape}</span>, c: String(t.clauseCount),
              su: t.survival, rd: t.returnDestroy, law: t.law, inj: t.injunctive, d: t.damages,
            }))}
          />
        </Exhibit>
      </Section>

      <Section n={5} title="Execution">
        <Lead>Executed in counterparts, each of which shall be deemed an original.</Lead>
        <div className="mt-6 grid grid-cols-2 gap-x-12 gap-y-12">
          {[r.parties.disclosing, "Recipient"].map((party) => (
            <div key={party}>
              <div className="h-10 border-b border-[#0b1220]" />
              <div className="mt-2 text-[12px] font-semibold text-[#0b1220]">{party}</div>
              <div className="text-[10px] uppercase tracking-wide text-[#9aa3b0]">Authorised signatory · Date</div>
            </div>
          ))}
        </div>
        <Note>This document is the property of ExitOS Advisory, furnished to the named Recipient for the sole purpose of evaluating a transaction with {company.name}, and may not be reproduced or distributed.</Note>
      </Section>
    </ReportFrame>
  );
};

export default ReportNda;
