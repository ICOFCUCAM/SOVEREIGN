import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadActiveCompany, loadSavedIntake, onCompanyChange } from "../lib/active-company";
import { findOwnListing, subscribeListings } from "../lib/listings";
import { currentAccountId, ndaRequestsForListing, offersForListing } from "../lib/exit-api";
import { subscribe as onDealEvent } from "../lib/deal-events";
import { loadTransactions } from "../lib/transactions";
import { useDocumentRemote } from "../lib/documents/remote";
import { sellerWaiting, type WaitingItem } from "../lib/waiting";

// The first thing on the founder's Home: what is waiting for them now, each with one button. Shown only when
// something waits; the figures below are unchanged.

const settle = <T,>(p: Promise<T>, fallback: T): Promise<T> => p.catch(() => fallback);

const WaitingForYou: React.FC = () => {
  const remote = useDocumentRemote();
  const [items, setItems] = useState<WaitingItem[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeListings(() => setTick((t) => t + 1)), []);
  useEffect(() => onDealEvent(() => setTick((t) => t + 1)), []);
  useEffect(() => onCompanyChange(() => setTick((t) => t + 1)), []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const own = loadSavedIntake() ? findOwnListing(loadActiveCompany().company) : undefined;
      const [ndaRequests, offers, txns] = await Promise.all([
        own ? settle(ndaRequestsForListing(own.id), []) : Promise.resolve([]),
        own ? settle(offersForListing(own.id), []) : Promise.resolve([]),
        remote ? settle(loadTransactions(remote), []) : Promise.resolve([]),
      ]);
      if (alive) setItems(sellerWaiting({ ndaRequests, offers, txns, me: currentAccountId() }));
    })();
    return () => { alive = false; };
  }, [remote, tick]);

  if (items.length === 0) return null;
  return (
    <section aria-label="Waiting for you" className="border border-[#E6D9BF] bg-[#FBF7EE] px-5 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A6A2E]">Waiting for you</div>
      <ul className="mt-2 divide-y divide-[#EFE4CC]">
        {items.map((i) => (
          <li key={i.key} className="flex flex-wrap items-center gap-3 py-2">
            <span className="min-w-0 flex-1 text-[14px] font-semibold text-xo-text">{i.label}</span>
            <Link to={i.to} className="rounded-sm bg-[#B48737] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#9E7630] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Open →</Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default WaitingForYou;
