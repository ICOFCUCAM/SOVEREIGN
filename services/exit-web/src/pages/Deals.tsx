import React from "react";
import { PageHeader } from "../components/xo";
import { useAuth } from "../lib/auth";
import { useDocumentRemote } from "../lib/documents/remote";
import { NdaLifecycle } from "../components/NdaLifecycle";
import { TransactionRecordPanel } from "../components/TransactionRecord";

// ── YOUR DEALS (free for both parties, O-17) ────────────────────────
// Where a seller and a buyer do what an existing deal requires of them: issue, sign and verify an
// NDA, open the data room it grants, and work the transaction from conditions to completion and
// after. No plan gates this page: a counterparty never has to buy a subscription to meet its
// obligations in a deal the other party started. What a party may do is decided on the server, as
// that account, on every call (identity, party membership, NDA state and scope, disclosure,
// transaction stage); the plan is not an input there, and this page grants nothing the server
// would refuse. The premium tools (valuation, readiness, outreach, the NDA Vault register, the
// Closing Center's checklist and diligence) keep their plans.

const Deals: React.FC = () => {
  const { session } = useAuth();
  const remote = useDocumentRemote();
  return (
    <div data-page="deals" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={session?.role === "buyer" ? "◉ Buyer · Deals" : "◉ Founder · Deals"} title="Your NDAs and transactions"
        description="Everything a deal asks of you, on any plan: NDAs to sign or verify, the files an executed NDA opens, and the transaction from its conditions to completion." />
      {remote ? (
        <>
          <NdaLifecycle remote={remote} />
          <TransactionRecordPanel remote={remote} />
        </>
      ) : (
        <p role="note" className="border border-xo-line bg-xo-panel px-4 py-3 text-[13px] text-xo-muted">
          Your NDAs and transactions are held on the server and shown only to their parties. This session has no server account (development sign-in); sign in with your e-mail link to see them.
        </p>
      )}
      <p className="text-[12px] text-xo-faint">This page is free on every plan. ExitOS records what the parties state and confirm; it does not hold funds, check signatures or bank records, or give legal advice.</p>
    </div>
  );
};

export default Deals;
