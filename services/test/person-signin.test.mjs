// People without an identity provider (M27) — e2e against the API on :8787 and a superuser pool.
// Proves: an administrator adds a person and issues a single-use 7-day invitation → the link names the
// person and institution only while valid → a weak password is refused → accepting sets the password and
// signs the person in with a person session (their offices decide the scopes) → the link is spent → email +
// password signs in; a wrong password and an unknown email get the same answer → a new invitation revokes
// the old link and resets the password → five wrong passwords lock the sign-in → only the token's hash and a
// scrypt hash are stored → a non-administrator cannot invite → an email holds a password in one institution
// only → a domain with an identity provider gets no invitation and no password → removing the person ends it.
import crypto from "node:crypto";
import pgpkg from "pg";

const API = "http://127.0.0.1:8787";
const admin = new pgpkg.Pool({
  host: process.env.PGHOST || "/tmp", port: Number(process.env.PGPORT || 55432),
  user: "postgres", password: process.env.PGADMIN_PASSWORD || "postgres",
  database: process.env.PGDATABASE || "dispatch", max: 3,
});
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };
const call = async (method, path, body, token) => {
  const r = await fetch(API + path, { method, headers: { ...(token ? { authorization: "Bearer " + token } : {}), ...(body !== undefined ? { "content-type": "application/json" } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  return { status: r.status, json: await r.json().catch(() => null) };
};
const claims = (t) => JSON.parse(Buffer.from(t.split(".")[1], "base64url").toString());
const sha = (t) => crypto.createHash("sha256").update(t).digest("hex");

async function institution(name) {
  const su = (await call("POST", "/v1/signup", { name })).json;
  const tk = (await call("POST", "/v1/token", { client_id: su.client_id, secret: su.secret })).json;
  return { tenantId: su.tenantId, token: tk.access_token };
}

async function main() {
  console.log("== People sign-in without an identity provider (invitations + passwords) ==");
  const run = crypto.randomBytes(4).toString("hex");
  const A = await institution(`Signin Ministry ${run}`);
  const email = `amina.${run}@example.org`, pw = "correct horse battery";

  // 1. Add a person and invite them.
  const p = await call("POST", "/v1/users", { email, fullName: "Amina Okafor" }, A.token);
  ok(p.status === 201 && p.json.id, "administrator adds a person");
  const inv = await call("POST", "/v1/users/invite", { id: p.json.id }, A.token);
  const days = inv.json?.expiresAt ? (new Date(inv.json.expiresAt) - Date.now()) / 86400000 : 0;
  ok(inv.status === 201 && /^[A-Za-z0-9_-]{43}$/.test(inv.json.token) && days > 6.9 && days <= 7, "invitation issued: a 256-bit token, expires in 7 days");

  // 2. The link shows who it is for, while valid.
  const d = await call("POST", "/v1/auth/invitation", { token: inv.json.token });
  ok(d.status === 200 && d.json.state === "valid" && d.json.email === email && d.json.institution === `Signin Ministry ${run}` && d.json.fullName === "Amina Okafor", "invitation details: person, email and institution");
  const junk = await call("POST", "/v1/auth/invitation", { token: crypto.randomBytes(32).toString("base64url") });
  ok(junk.status === 200 && junk.json.state === "unknown" && junk.json.email === null, "an unknown link reveals nothing");

  // 3. Weak password refused; accepting signs the person in.
  const weak = await call("POST", "/v1/auth/invitation/accept", { token: inv.json.token, password: "short" });
  ok(weak.status === 400 && weak.json.error?.code === "WEAK_PASSWORD", "a password under 10 characters is refused");
  const acc = await call("POST", "/v1/auth/invitation/accept", { token: inv.json.token, password: pw });
  const c1 = acc.json?.access_token ? claims(acc.json.access_token) : {};
  ok(acc.status === 200 && c1.principal_type === "person" && c1.email === email && c1.tenant_id === A.tenantId && c1.sub === p.json.id, "accepting sets the password and returns a person session");
  ok(JSON.stringify(acc.json.scopes) === JSON.stringify(["dispatch:read", "dispatch:render"]), "a person holding no office gets read and write scopes only");
  const again = await call("POST", "/v1/auth/invitation/accept", { token: inv.json.token, password: pw });
  ok(again.status === 410 && (await call("POST", "/v1/auth/invitation", { token: inv.json.token })).json.state === "used", "the link is single-use");
  ok((await call("GET", "/v1/documents", undefined, acc.json.access_token)).status === 200, "the person session reads the institution's records");

  // 4. Email + password sign-in; failures are indistinguishable.
  ok((await call("POST", "/v1/auth/method", { email })).json?.method === "password", "a domain without an identity provider signs in by password");
  const si = await call("POST", "/v1/auth/password", { email: email.toUpperCase(), password: pw });
  ok(si.status === 200 && claims(si.json.access_token).sub === p.json.id, "email (any case) + password signs in");
  const wrong = await call("POST", "/v1/auth/password", { email, password: "not the password" });
  const nobody = await call("POST", "/v1/auth/password", { email: `nobody.${run}@example.org`, password: "not the password" });
  ok(wrong.status === 401 && nobody.status === 401 && wrong.json.error.code === nobody.json.error.code && wrong.json.error.message === nobody.json.error.message, "wrong password and unknown email get the same answer");

  // 5. The administrator sees who has accepted.
  const list = await call("GET", "/v1/users", undefined, A.token);
  const me = list.json.users.find((u) => u.id === p.json.id);
  ok(me?.signIn?.password === true && !!me.signIn.lastSignInAt, "administrator sees the person signs in by password");
  const asPerson = await call("GET", "/v1/users", undefined, si.json.access_token);
  ok(asPerson.status === 200 && asPerson.json.users.every((u) => u.signIn === undefined), "a non-administrator does not see sign-in status");
  ok((await call("POST", "/v1/users/invite", { id: p.json.id }, si.json.access_token)).status === 403, "a non-administrator cannot invite");

  // 6. A new invitation revokes the old one and resets the password.
  const inv2 = await call("POST", "/v1/users/invite", { id: p.json.id }, A.token);
  const inv3 = await call("POST", "/v1/users/invite", { id: p.json.id }, A.token);
  ok((await call("POST", "/v1/auth/invitation", { token: inv2.json.token })).json.state === "revoked", "issuing a new link revokes the open one");
  const reset = await call("POST", "/v1/auth/invitation/accept", { token: inv3.json.token, password: "a brand new passphrase" });
  ok(reset.status === 200 && (await call("POST", "/v1/auth/password", { email, password: pw })).status === 401
    && (await call("POST", "/v1/auth/password", { email, password: "a brand new passphrase" })).status === 200, "a new invitation resets the password");

  // 7. Storage: hashes only.
  const st = (await admin.query("select c.password_hash, (select count(*) from dispatch.person_invitations i where i.token_hash = $2) n from dispatch.person_credentials c where c.user_id = $1", [p.json.id, sha(inv3.json.token)])).rows[0];
  ok(st.password_hash.startsWith("scrypt$") && !st.password_hash.includes("brand new") && Number(st.n) === 1, "only the token's SHA-256 and a scrypt password hash are stored");
  const direct = await admin.query("select has_table_privilege('dispatch_app', 'dispatch.person_credentials', 'select') c, has_table_privilege('dispatch_app', 'dispatch.person_invitations', 'select') i");
  ok(direct.rows[0].c === false && direct.rows[0].i === false, "the application role cannot read the credential tables directly");

  // 8. Lockout after five wrong passwords.
  for (let i = 0; i < 5; i++) await call("POST", "/v1/auth/password", { email, password: `wrong ${i} attempt` });
  const locked = await call("POST", "/v1/auth/password", { email, password: "a brand new passphrase" });
  ok(locked.status === 429 && locked.json.error.code === "SIGN_IN_LOCKED", "five wrong passwords pause the sign-in, even for the right one");
  await admin.query("update dispatch.person_credentials set locked_until = now() - interval '1 second' where user_id = $1", [p.json.id]);
  ok((await call("POST", "/v1/auth/password", { email, password: "a brand new passphrase" })).status === 200, "the pause ends; the right password works again");

  // 9. One institution per password email.
  const B = await institution(`Signin Agency ${run}`);
  const pb = await call("POST", "/v1/users", { email, fullName: "Amina Okafor" }, B.token);
  const ib = await call("POST", "/v1/users/invite", { id: pb.json.id }, B.token);
  const ab = await call("POST", "/v1/auth/invitation/accept", { token: ib.json.token, password: "another long passphrase" });
  ok(ab.status === 409 && ab.json.error.code === "EMAIL_IN_USE", "an email holds a password sign-in in one institution only");
  ok((await call("POST", "/v1/users/invite", { id: p.json.id }, B.token)).status === 404, "an administrator cannot invite another institution's person");

  // 10. A domain with an identity provider: no invitation, no password.
  const ssoDomain = `idp-${run}.example.gov`, ssoEmail = `k.mensah@${ssoDomain}`;
  await admin.query("insert into dispatch.tenant_sso_connections (tenant_id, issuer, client_id, email_domain) values ($1, 'https://idp.example.gov', 'dispatch', $2)", [A.tenantId, ssoDomain]);
  const ps = await call("POST", "/v1/users", { email: ssoEmail, fullName: "Kofi Mensah" }, A.token);
  const is = await call("POST", "/v1/users/invite", { id: ps.json.id }, A.token);
  ok(is.status === 409 && is.json.error.code === "USE_SSO", "a person on the identity provider's domain gets no invitation");
  ok((await call("POST", "/v1/auth/method", { email: ssoEmail })).json?.method === "sso", "that domain is sent to the identity provider");

  // 11. Removing the person ends their sign-in.
  const open = await call("POST", "/v1/users/invite", { id: p.json.id }, A.token);
  ok((await call("DELETE", "/v1/users", { id: p.json.id }, A.token)).status === 200, "administrator removes the person");
  ok((await call("POST", "/v1/auth/password", { email, password: "a brand new passphrase" })).status === 401, "a removed person cannot sign in");
  ok((await call("POST", "/v1/auth/invitation", { token: open.json.token })).json.state === "revoked", "a removed person's open link is revoked");
  const audit = (await admin.query("select array_agg(distinct action order by action) a from dispatch.audit_events where tenant_id = $1 and action like 'person.%'", [A.tenantId])).rows[0].a;
  ok(["person.invitation_accepted", "person.invited", "person.sign_in_locked", "person.sign_in_removed"].every((x) => audit.includes(x)), "every step is in the audit trail");

  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  await admin.end();
  process.exit(fail ? 1 : 0);
}
main().catch(async (e) => { console.error(e); try { await admin.end(); } catch {} process.exit(1); });
