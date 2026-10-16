import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader, Section, Empty } from "../components/xo";
import { useCompanies } from "../components/CompanySwitcher";
import { useAuth } from "../lib/auth";
import { PLAN_LABEL } from "../lib/access";
import { companyProfiles, selectCompany } from "../lib/active-company";
import { findOwnListing, subscribeListings } from "../lib/listings";
import { currentAccountId } from "../lib/exit-api";
import { loadTransactions } from "../lib/transactions";
import { useDocumentRemote } from "../lib/documents/remote";
import { listVersions } from "../lib/documents/store";
import { portfolioRows, liveSales, STAGE_LABEL, type PortfolioRow } from "../lib/portfolio";

// My companies: every company or product on the founder's account and where each one stands, from its own
// records (listing, CIM and teaser, transaction). Work on one, or add another. Each company is prepared and
// sold under its own engagement (see Pricing); this page shows records, it is not a bill.

const settle = <T,>(p: Promise<T>, fallback: T): Promise<T> => p.catch(() => fallback);

const PREP_LABEL: Record<PortfolioRow["preparation"], string> = { ready: "CIM & teaser written", partial: "Partly written", none: "Not started" };
const STAGE_TONE: Record<PortfolioRow["stage"], string> = {
  "not-listed": "text-xo-faint", listed: "text-xo-text", "in-deal": "text-xo-caution", signed: "text-xo-caution", sold: "text-xo-verified",
};

const Companies: React.FC = () => {
  const nav = useNavigate();
  const remote = useDocumentRemote();
  const { session } = useAuth();
  const { companies } = useCompanies();
  const [rows, setRows] = useState<PortfolioRow[] | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeListings(() => setTick((t) => t + 1)), []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const profiles = companyProfiles();
      const me = currentAccountId();
      const [txns, docs] = await Promise.all([
        remote ? settle(loadTransactions(remote), []) : Promise.resolve([]),
        Promise.all(profiles.map(async (p) => {
          const [cim, teaser] = await Promise.all([settle(listVersions("exitos.cim", p.id, remote), []), settle(listVersions("exitos.teaser", p.id, remote), [])]);
          return { cim: cim.length > 0, teaser: teaser.length > 0 };
        })),
      ]);
      const mine = txns.map((r) => r.txn).filter((t) => !me || t.seller_account_id === me);
      const input = companies.map((c) => {
        const i = profiles.findIndex((p) => p.id === c.id);
        const p = profiles[i];
        return { ...c, listed: !!p && !!findOwnListing(p.profile), cim: docs[i]?.cim ?? false, teaser: docs[i]?.teaser ?? false };
      });
      if (alive) setRows(portfolioRows(input, mine));
    })();
    return () => { alive = false; };
  }, [companies, remote, tick]);

  const open = (id: string, to: string): void => { selectCompany(id); nav(to); };
  const add = (): void => { selectCompany(null); nav("/console/intake"); };
  const listed = rows?.filter((r) => r.stage !== "not-listed").length ?? 0;
  const live = rows ? liveSales(rows) : 0;
  const BTN = "rounded-sm border border-xo-line px-3 py-1.5 text-[12px] font-semibold text-xo-text hover:border-xo-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";

  return (
    <div data-page="companies" className="space-y-4 text-xo-text">
      <PageHeader eyebrow="◉ Portfolio" title="My companies"
        description="Every company or product on your account. Each one keeps its own figures, story, documents, data room, listing and deals."
        actions={<button type="button" onClick={add} className="rounded-sm bg-[#B48737] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#9E7630] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">+ Add a company or product</button>} />

      <Section title="Where each company stands" eyebrow={`${companies.length} ${companies.length === 1 ? "company" : "companies"} · ${listed} listed · ${live} in a sale`} className="border border-xo-line"
        foot={<>From each company's own records: its listing, its CIM and teaser, and its transaction. Listing is free for every company; Preparation and an Active Mandate are engaged per company (<Link to="/pricing" className="underline underline-offset-2">Pricing</Link>). Your console access today follows this account's engagement{session ? `: ${PLAN_LABEL[session.plan]}` : ""}.</>}>
        {companies.length === 0 ? (
          <Empty title="No company yet">Add your first company with Value My Company. Until then, pages show the demo company.</Empty>
        ) : (
          <div role="region" aria-label="Your companies" tabIndex={0} className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-xo-line text-[10px] font-semibold uppercase tracking-[0.14em] text-xo-faint">
                  <th scope="col" className="px-4 py-2.5">Company</th>
                  <th scope="col" className="px-4 py-2.5">Stage</th>
                  <th scope="col" className="px-4 py-2.5">Preparation</th>
                  <th scope="col" className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {!rows && <tr><td colSpan={4} className="px-4 py-3 text-xo-faint">Reading your companies…</td></tr>}
                {rows?.map((r) => (
                  <tr key={r.id} className={`border-t border-xo-line ${r.active ? "bg-[#FBF6EC]" : ""}`}>
                    <th scope="row" className="px-4 py-3 font-semibold">
                      {r.name}{r.active && <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8A6A2E]">Selected</span>}
                    </th>
                    <td className={`px-4 py-3 font-semibold ${STAGE_TONE[r.stage]}`}>{STAGE_LABEL[r.stage]}</td>
                    <td className="px-4 py-3 text-xo-muted">{PREP_LABEL[r.preparation]}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button type="button" onClick={() => open(r.id, "/console")} className={BTN}>{r.active ? "Open" : "Work on this company"}</button>
                        {r.stage === "not-listed" && <button type="button" onClick={() => open(r.id, "/console/marketplace")} className={BTN}>List it</button>}
                        {r.preparation !== "ready" && <button type="button" onClick={() => open(r.id, "/console/documents")} className={BTN}>Prepare</button>}
                        {(r.stage === "in-deal" || r.stage === "signed") && <button type="button" onClick={() => open(r.id, "/console/deals")} className={BTN}>Open the deal</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
};

export default Companies;
