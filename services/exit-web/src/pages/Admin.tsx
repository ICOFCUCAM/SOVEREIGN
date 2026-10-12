import React, { useState } from "react";
import { notify } from "../lib/ui";
import { PageHeader, Section, Metric, ScrollRegion, Provenance, XO_INPUT, XO_LABEL } from "../components/xo";
import { useAuth } from "../lib/auth";
import { listingDestination } from "../lib/exit-api";
import { ROLE_LABEL, type Role, type Plan } from "../lib/access";
import { CHANNELS } from "../lib/social-publish";
import { useEngineStatus, usePublishHistory, ENGINE_ENDPOINT } from "../lib/distribution-engine";

// Admin console — the back office. A labelled sample roster, platform facts
// and the distribution engine's real status. There is no account directory
// or server-side role service yet, so nothing here provisions access.

interface Account { name: string; email: string; role: Role; plan: Plan; deals: number }

// A SAMPLE roster — illustrative accounts, not real users. ExitOS has no
// account directory yet; addresses use the reserved example.com domain.
const SEED: Account[] = [
  { name: "Platform owner", email: "owner@example.com", role: "superadmin", plan: "pro", deals: 0 },
  { name: "Sample founder · Helios Freight", email: "founder.helios@example.com", role: "founder", plan: "pro", deals: 1 },
  { name: "Sample founder · Northwind", email: "founder.northwind@example.com", role: "founder", plan: "free", deals: 0 },
  { name: "Sample buyer · strategic", email: "buyer.strategic@example.com", role: "buyer", plan: "pro", deals: 4 },
  { name: "Sample buyer · private capital", email: "buyer.capital@example.com", role: "buyer", plan: "free", deals: 0 },
  { name: "Ops · Calibration", email: "ops.calibration@example.com", role: "admin", plan: "pro", deals: 0 },
];

const ROLE_STYLE: Record<Role, string> = {
  founder: "text-xo-verified", buyer: "text-xo-caution", admin: "text-xo-action", superadmin: "text-xo-risk",
};

const Admin: React.FC = () => {
  const { session } = useAuth();
  const isSuper = session?.role === "superadmin";
  const [accounts, setAccounts] = useState<Account[]>(SEED);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim());
  const emailMsg = newEmail.trim() === "" ? "" : !emailOk ? "Enter an email address, e.g. operator@example.com." : accounts.some((a) => a.email.toLowerCase() === newEmail.trim().toLowerCase()) ? "That email is already in the sample roster." : "";
  // Adds a row to the SAMPLE roster on this page only: no account is
  // created and no access is granted (roles are not server-side yet).
  const createAdmin = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!newName.trim() || !emailOk || emailMsg) return;
    setAccounts((prev) => [{ name: newName.trim(), email: newEmail.trim(), role: "admin", plan: "pro", deals: 0 }, ...prev]);
    setNewName(""); setNewEmail("");
    notify("Added to the sample roster — no account was created");
  };

  const founders = accounts.filter((a) => a.role === "founder").length;
  const buyers = accounts.filter((a) => a.role === "buyer").length;
  const pro = accounts.filter((a) => a.plan === "pro").length;

  const BTN = "rounded-sm bg-deal-700 px-3 py-2 text-[12px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-60";

  return (
    <div data-page="admin" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="Internal · Operator" title="Admin Console"
        description={`Signed in as ${ROLE_LABEL[session?.role ?? "admin"]}. A sample account roster (illustrative), platform configuration and the distribution engine.`} />

      <section aria-label="Roster summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Accounts" emphasis value={String(accounts.length)} sub="sample roster" provenance="demo" /></div>
        <div className="bg-xo-panel"><Metric label="Founders" value={String(founders)} sub="sample · seller side" /></div>
        <div className="bg-xo-panel"><Metric label="Buyers" value={String(buyers)} sub="sample · buy side" /></div>
        <div className="bg-xo-panel"><Metric label="Pro subscriptions" value={`${pro}/${accounts.length}`} sub="sample · paid plans" /></div>
      </section>

      {/* Provision admins — superadmin only */}
      {isSuper ? (
        <Section title="Provision admin" className="border border-xo-line" right={<Provenance kind="demo">Not wired</Provenance>}
          foot="Superadmin only. This adds a row to the sample roster on this page — it does not create an account or grant access. Admin roles are not server-side yet; in local development the operator email is set by VITE_EXITOS_DEV_OPERATOR_EMAIL.">
          <form onSubmit={createAdmin} className="grid items-end gap-3 px-4 py-4 sm:grid-cols-[1fr_1fr_auto]">
            <div><label htmlFor="adm-name" className={XO_LABEL}>Full name</label><input id="adm-name" className={XO_INPUT} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Operator name" /></div>
            <div><label htmlFor="adm-email" className={XO_LABEL}>Work email</label><input id="adm-email" className={XO_INPUT} type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="operator@example.com" aria-invalid={emailMsg !== ""} aria-describedby="adm-email-msg" />
              <span id="adm-email-msg" className="mt-1 block min-h-[1rem] text-[12px] text-xo-risk">{emailMsg}</span></div>
            <button type="submit" disabled={!newName.trim() || !emailOk || emailMsg !== ""} className={BTN}>Add to sample roster</button>
          </form>
        </Section>
      ) : (
        <p className="border border-xo-line bg-xo-panel p-4 text-[13px] text-xo-muted">Admin provisioning is restricted to the superadmin.</p>
      )}

      <Section title="Accounts — sample roster" className="border border-xo-line" right={<Provenance kind="demo">Sample</Provenance>}
        foot="Illustrative accounts, not real users. ExitOS has no account directory yet; a real roster needs a server-side identity service.">
        <ScrollRegion label="Accounts table">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead className="text-left text-[11px] text-xo-muted">
              <tr className="border-b border-xo-line">
                <th scope="col" className="px-4 py-2 font-medium">Account</th>
                <th scope="col" className="px-2 py-2 font-medium">Role</th>
                <th scope="col" className="px-2 py-2 font-medium">Plan</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Active deals</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.email} className="border-b border-xo-line last:border-0">
                  <th scope="row" className="px-4 py-2.5 text-left font-normal"><div className="font-medium">{a.name}</div><div className="text-[12px] text-xo-muted">{a.email}</div></th>
                  <td className={`px-2 py-2.5 text-[12px] font-semibold ${ROLE_STYLE[a.role]}`}>{ROLE_LABEL[a.role]}</td>
                  <td className="px-2 py-2.5"><span className={`rounded-sm border px-1.5 py-px text-[11px] font-semibold uppercase ${a.plan === "pro" ? "border-xo-verified/50 text-xo-verified" : "border-xo-line text-xo-muted"}`}>{a.plan}</span></td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{a.deals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      </Section>

      <Section title="Platform configuration" className="border border-xo-line"
        foot="Facts about how this console runs — not health checks. No service is monitored from here.">
        <dl className="grid gap-px bg-xo-line sm:grid-cols-3">
          {[
            ["Engines", "Run in the browser", "Valuation, discovery and diligence engines run client-side; there is no engine service to monitor."],
            ["Marketplace storage", listingDestination() === "exchange" ? "Exchange backend" : "This browser", listingDestination() === "exchange" ? "Listings, requests and offers are stored in the Supabase backend." : "No backend is configured, so listings, requests and offers are stored in this browser."],
            ["Identity", "Demo sessions", "Sessions are created in the browser; there is no SSO or server-side role service yet."],
          ].map(([k, v, d]) => (
            <div key={k} className="bg-xo-panel px-4 py-3">
              <dt className="text-[12px] text-xo-muted">{k}</dt>
              <dd className="mt-0.5 text-[13px] font-semibold">{v}</dd>
              <dd className="mt-0.5 text-[12px] text-xo-muted">{d}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <SocialDistribution />
    </div>
  );
};

// ── ExitOS Distribution Engine — our own social posting backend ──────
// Channel credentials live as Supabase function secrets on exit-social-dispatch
// (LINKEDIN_ACCESS_TOKEN, X_ACCESS_TOKEN, FB_PAGE_ACCESS_TOKEN, TELEGRAM_BOT_TOKEN,
// WHATSAPP_TOKEN, INSTAGRAM_ACCESS_TOKEN, …). This panel reads the live
// connection status from the engine and shows what has been published.
const SECRET_HINT: Record<string, string> = {
  linkedin: "LINKEDIN_ACCESS_TOKEN + LINKEDIN_AUTHOR_URN",
  x: "X_ACCESS_TOKEN",
  facebook: "FB_PAGE_ACCESS_TOKEN + FB_PAGE_ID",
  instagram: "INSTAGRAM_ACCESS_TOKEN + INSTAGRAM_USER_ID",
  telegram: "TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID",
  whatsapp: "WHATSAPP_TOKEN + WHATSAPP_PHONE_ID + WHATSAPP_RECIPIENTS",
};

const SocialDistribution: React.FC = () => {
  const { connected, anyConnected, loading } = useEngineStatus();
  const history = usePublishHistory();

  return (
    <Section title="ExitOS Distribution Engine" className="border border-xo-line"
      right={<span className={`flex items-center gap-1.5 text-[12px] ${anyConnected ? "text-xo-verified" : "text-xo-caution"}`}>
        <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${anyConnected ? "bg-xo-verified" : "bg-xo-caution"}`} />
        {loading ? "Checking…" : anyConnected ? `${Object.values(connected).filter(Boolean).length} channel(s) connected` : "No channels connected"}
      </span>}>
      <div className="px-4 py-3">
        <p className="text-[13px] leading-relaxed text-xo-muted">
          ExitOS's own posting engine (<span className="font-mono text-xo-text">exit-social-dispatch</span>) holds each
          platform's tokens as Supabase function secrets and posts to the real APIs. The browser never sees a credential.
          Connect a channel by setting its secrets, then redeploy the function.
        </p>
        <ul className="mt-3 grid gap-px bg-xo-line sm:grid-cols-2">
          {CHANNELS.map((c) => {
            const on = connected[c.id];
            return (
              <li key={c.id} className="flex items-start justify-between gap-3 bg-xo-panel p-3">
                <div>
                  <div className="text-[13px] font-semibold">{c.label}</div>
                  <div className="break-all font-mono text-[11px] text-xo-muted">{SECRET_HINT[c.id]}</div>
                </div>
                <span className={`shrink-0 rounded-sm border px-1.5 py-px text-[11px] font-semibold ${on ? "border-xo-verified/50 text-xo-verified" : "border-xo-line text-xo-muted"}`}>{loading ? "…" : on ? "Connected" : "Not connected"}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 break-all font-mono text-[11px] text-xo-muted">Endpoint · {ENGINE_ENDPOINT}</div>
        <h3 className="mt-4 text-[12px] font-semibold text-xo-muted">Recent publishes</h3>
        {history.length === 0 ? (
          <p className="mt-1 text-[12px] text-xo-muted">Nothing published yet. Use “↗ Publish” on any opportunity in Acquisition Radar.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {history.slice(0, 8).map((h, i) => (
              <li key={i} className="flex items-center gap-2 text-[12px]">
                <span className={h.status === "done" ? "text-xo-verified" : "text-xo-risk"}>{h.status === "done" ? "✓ published" : "✗ failed"}</span>
                <span className="capitalize">{h.channel}</span>
                <span className="truncate text-xo-muted">· {h.title}</span>
                {h.url && <a href={h.url} target="_blank" rel="noopener noreferrer" className="ml-auto shrink-0 font-medium text-xo-action underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">view<span className="sr-only"> {h.channel} post</span> ↗</a>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
};

export default Admin;
