import type { Remote } from "./documents/store";

// ── IDENTITY VERIFICATION (client) ──────────────────────────────────
// A founder proves who they are before listing a company. The flows run in the exit-identity
// function and the result is recorded on the server; the database refuses a listing from an account
// without a current verification and stamps the listing with the method itself. Nothing here can
// mark anyone verified.

export type IdentityProvider =
  | "stripe_identity" | "no_bankid" | "se_bankid" | "dk_mitid" | "fi_ftn" | "be_itsme"
  | "nl_idin" | "de_eid" | "fr_franceconnect" | "ee_smartid";

export interface ProviderInfo {
  readonly id: IdentityProvider;
  readonly name: string;
  readonly how: string;                     // what the founder does
  readonly need: string;                    // what they need to hand
  readonly region: string;                  // where it works, in words
  readonly verifies: string;                // what the method actually establishes
  readonly next: string;                    // what happens when the founder begins
  readonly countries: readonly string[];    // ISO 3166 alpha-2; empty = worldwide
}

/** Every method ExitOS offers, national eIDs first for their countries, Stripe Identity everywhere. */
export const IDENTITY_PROVIDERS: readonly ProviderInfo[] = [
  { id: "no_bankid", name: "BankID", how: "Confirm with Norwegian BankID", need: "BankID app or code device", region: "Norway", countries: ["NO"], verifies: "That you are the person your Norwegian bank has identified, using your BankID.", next: "You are taken to the provider through ExitOS's identity broker, confirm there, and return here. ExitOS receives the confirmation — never your credentials or national identity number." },
  { id: "se_bankid", name: "BankID", how: "Confirm with Swedish BankID", need: "BankID app on your phone", region: "Sweden", countries: ["SE"], verifies: "That you are the person your Swedish bank has identified, using your BankID.", next: "You are taken to the provider through ExitOS's identity broker, confirm there, and return here. ExitOS receives the confirmation — never your credentials or national identity number." },
  { id: "dk_mitid", name: "MitID", how: "Confirm with MitID", need: "MitID app or code display", region: "Denmark", countries: ["DK"], verifies: "That you are the person registered to your Danish MitID.", next: "You are taken to the provider through ExitOS's identity broker, confirm there, and return here. ExitOS receives the confirmation — never your credentials or national identity number." },
  { id: "fi_ftn", name: "Finnish Trust Network", how: "Confirm with your bank or mobile certificate", need: "Online-bank credentials or Mobiilivarmenne", region: "Finland", countries: ["FI"], verifies: "That you are the person your Finnish bank or mobile operator has identified.", next: "You are taken to the provider through ExitOS's identity broker, confirm there, and return here. ExitOS receives the confirmation — never your credentials or national identity number." },
  { id: "be_itsme", name: "itsme", how: "Confirm in the itsme app", need: "itsme app", region: "Belgium · Netherlands · Luxembourg", countries: ["BE", "NL", "LU"], verifies: "That you are the person registered to your itsme account.", next: "You are taken to the provider through ExitOS's identity broker, confirm there, and return here. ExitOS receives the confirmation — never your credentials or national identity number." },
  { id: "nl_idin", name: "iDIN", how: "Confirm through your Dutch bank", need: "Online-banking login", region: "Netherlands", countries: ["NL"], verifies: "That you are the person your Dutch bank has identified.", next: "You are taken to the provider through ExitOS's identity broker, confirm there, and return here. ExitOS receives the confirmation — never your credentials or national identity number." },
  { id: "de_eid", name: "German eID", how: "Read your ID card with the AusweisApp", need: "Personalausweis with online function", region: "Germany", countries: ["DE"], verifies: "That you hold the German identity card read by the AusweisApp.", next: "You are taken to the provider through ExitOS's identity broker, confirm there, and return here. ExitOS receives the confirmation — never your credentials or national identity number." },
  { id: "fr_franceconnect", name: "FranceConnect", how: "Confirm with a French public-service login", need: "FranceConnect account", region: "France", countries: ["FR"], verifies: "That you are the person behind your French public-service account.", next: "You are taken to the provider through ExitOS's identity broker, confirm there, and return here. ExitOS receives the confirmation — never your credentials or national identity number." },
  { id: "ee_smartid", name: "Smart-ID", how: "Confirm in the Smart-ID app", need: "Smart-ID app", region: "Estonia · Latvia · Lithuania", countries: ["EE", "LV", "LT"], verifies: "That you are the person registered to your Smart-ID account.", next: "You are taken to the provider through ExitOS's identity broker, confirm there, and return here. ExitOS receives the confirmation — never your credentials or national identity number." },
  { id: "stripe_identity", name: "Stripe Identity", how: "Photograph your passport or ID card and take a live selfie", need: "Passport, ID card or driving licence", region: "Worldwide", countries: [], verifies: "That your passport, ID card or driving licence is genuine and that you are its holder, matched by a live selfie.", next: "Stripe opens a secure page where you photograph your document and take a selfie. Stripe reviews it, usually within minutes, and you return here to see the result." },
];
export const providerInfo = (id: string): ProviderInfo | undefined => IDENTITY_PROVIDERS.find((p) => p.id === id);
export const providerLabel = (id: string): string => {
  const p = providerInfo(id); if (!p) return id;
  return p.countries.length === 1 && (p.id === "no_bankid" || p.id === "se_bankid") ? `${p.name} ${p.countries[0] === "NO" ? "Norway" : "Sweden"}` : p.name;
};

const COUNTRY_CODE: Record<string, string> = {
  norway: "NO", norge: "NO", sweden: "SE", sverige: "SE", denmark: "DK", danmark: "DK", finland: "FI", suomi: "FI",
  belgium: "BE", netherlands: "NL", "the netherlands": "NL", holland: "NL", luxembourg: "LU", germany: "DE", deutschland: "DE",
  france: "FR", estonia: "EE", latvia: "LV", lithuania: "LT",
};
/** "Norway" or "NO" → "NO"; anything unrecognised → undefined. */
export const countryCode = (country: string | undefined): string | undefined => {
  const k = (country ?? "").trim().toLowerCase();
  return k.length === 2 ? k.toUpperCase() : COUNTRY_CODE[k];
};

/** The methods to show a founder based in `country`: their national eIDs first, then the rest, Stripe Identity always offered. */
export function providersFor(country: string | undefined): { suggested: ProviderInfo[]; other: ProviderInfo[] } {
  const cc = countryCode(country);
  const suggested = IDENTITY_PROVIDERS.filter((p) => cc && p.countries.includes(cc));
  const stripe = IDENTITY_PROVIDERS.find((p) => p.id === "stripe_identity")!;
  return { suggested: [...suggested, stripe], other: IDENTITY_PROVIDERS.filter((p) => !suggested.includes(p) && p !== stripe) };
}

/** The founder's most recent attempt, read from their own verification rows (RLS: own rows, result columns only). */
export interface Attempt { readonly provider: IdentityProvider; readonly status: "pending" | "verified" | "failed" | "canceled"; readonly failure: string | null; readonly created_at: string; readonly verified_at: string | null; readonly expires_at: string | null }

export type PathwayState = "checking" | "unavailable" | "available" | "in_progress" | "verified" | "failed" | "expired";
const PENDING_MS = 30 * 60_000;

/** The state one pathway is shown in, from what the server reports — never from a client-side flag. */
export function pathwayState(id: IdentityProvider, s: { hasServer: boolean; checked: boolean; available: boolean; current: Verification | null; latest: Attempt | null; now?: number }): PathwayState {
  const now = s.now ?? Date.now();
  if (s.current?.provider === id) return "verified";
  const mine = s.latest?.provider === id ? s.latest : null;
  if (mine?.status === "verified" && mine.expires_at && Date.parse(mine.expires_at) <= now) return "expired";
  if (!s.hasServer) return "unavailable";
  if (!s.checked) return "checking";
  if (mine?.status === "pending" && now - Date.parse(mine.created_at) < PENDING_MS && s.available) return "in_progress";
  if ((mine?.status === "failed" || mine?.status === "canceled") && s.available) return "failed";
  return s.available ? "available" : "unavailable";
}

export interface Verification { readonly provider: IdentityProvider; readonly status: string; readonly country: string | null; readonly verified_at: string; readonly expires_at: string }
export interface IdentityStatus { readonly providers: Partial<Record<IdentityProvider, boolean>>; readonly verification: Verification | null }

const endpoint = (r: Remote): string => `${r.url}/functions/v1/exit-identity`;
const h = (r: Remote): Record<string, string> => ({ apikey: r.anonKey, Authorization: `Bearer ${r.accessToken}`, "content-type": "application/json" });
const f = (r: Remote): typeof fetch => r.fetchImpl ?? fetch;
async function call<T>(r: Remote, init: RequestInit | undefined, what: string): Promise<T> {
  const res = await f(r)(endpoint(r), { ...init, headers: h(r) });
  const body = await res.json().catch(() => null) as ({ ok?: boolean; error?: string } & T) | null;
  if (!res.ok || !body?.ok) throw new Error(body?.error ?? `${what} failed (${res.status})`);
  return body;
}

/** The founder's most recent verification attempt, or null. */
export async function latestAttempt(r: Remote): Promise<Attempt | null> {
  const res = await f(r)(`${r.url}/rest/v1/exitos_identity_verifications?select=provider,status,failure,created_at,verified_at,expires_at&order=created_at.desc&limit=1`, { headers: h(r) });
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []) as Attempt[];
  return rows[0] ?? null;
}

/** Which methods are switched on, and the account's current verification. */
export const identityStatus = (r: Remote): Promise<IdentityStatus> => call<IdentityStatus>(r, undefined, "Checking your verification");

/** Start a verification; resolves to the provider URL the founder is sent to. */
export async function startVerification(r: Remote, provider: IdentityProvider, returnUrl: string): Promise<string> {
  const b = await call<{ url: string }>(r, { method: "POST", body: JSON.stringify({ action: "start", provider, returnUrl }) }, "Starting verification");
  return b.url;
}

/** Finish a national-eID sign-in from the code and state the broker returned. */
export const completeEid = (r: Remote, code: string, state: string): Promise<{ verification: Verification | null }> =>
  call(r, { method: "POST", body: JSON.stringify({ action: "complete", code, state }) }, "Finishing verification");

/** Re-read the latest Stripe Identity session after the founder returns from Stripe. */
export const refreshStripe = (r: Remote): Promise<{ status: string; verification: Verification | null }> =>
  call(r, { method: "POST", body: JSON.stringify({ action: "refresh" }) }, "Checking Stripe Identity");
