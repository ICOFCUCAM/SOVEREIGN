// R-S1-1 — service-secret at-rest hashing (scrypt) + legacy sha256 back-compat.
// Unit: hashSecretScrypt/verifySecret roundtrip + format + rejection.
// E2E: a scrypt-hashed service client authenticates via /v1/token, AND the
// seeded sha256 client (svc-a) still authenticates (back-compat).
import crypto from "node:crypto";
import pgpkg from "pg";
import { hashSecret, hashSecretScrypt, verifySecret } from "../shared/src/auth.mjs";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

async function main() {
  console.log("== R-S1-1 secret hashing ==");

  // --- unit ---
  const stored = hashSecretScrypt("hunter2");
  ok(/^scrypt\$\d+\$\d+\$\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/.test(stored), "scrypt hash has encoded format");
  ok(verifySecret("hunter2", stored).ok === true && verifySecret("hunter2", stored).legacy === false, "scrypt verify ok (legacy=false)");
  ok(verifySecret("wrong", stored).ok === false, "scrypt verify rejects wrong secret");
  ok(hashSecretScrypt("hunter2") !== stored, "salted: two hashes of same secret differ");

  // legacy sha256 back-compat
  const legacy = hashSecret("legacy-secret");
  ok(verifySecret("legacy-secret", legacy).ok === true && verifySecret("legacy-secret", legacy).legacy === true, "legacy sha256 verify ok (legacy=true)");
  ok(verifySecret("nope", legacy).ok === false, "legacy verify rejects wrong secret");
  ok(verifySecret("x", "").ok === false && verifySecret("x", null).ok === false, "empty/null stored → reject");

  // --- e2e (only if API up) ---
  const API = process.env.DISPATCH_API_URL;
  if (API) {
    // Provision a service client out-of-band as the owner/admin role (service_clients
    // has no app INSERT policy by design — provisioning is an admin operation).
    const admin = new pgpkg.Pool({ host: process.env.PGHOST || "localhost", port: Number(process.env.PGPORT || 5432), user: "postgres", password: process.env.PGADMIN_PASSWORD || "postgres", database: process.env.PGDATABASE || "dispatch", max: 2 });
    const clientId = "scrypt-" + crypto.randomUUID().slice(0, 8);
    const clientSecret = crypto.randomUUID();
    await admin.query("insert into dispatch.service_clients (tenant_id, name, client_id, secret_hash, scopes) values ($1,$2,$3,$4,$5)",
      ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "scrypt-client", clientId, hashSecretScrypt(clientSecret), ["dispatch:read"]]);

    const good = await fetch(API + "/v1/token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ client_id: clientId, secret: clientSecret }) });
    ok(good.status === 200, "scrypt-hashed client authenticates via /v1/token");
    const bad = await fetch(API + "/v1/token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ client_id: clientId, secret: "wrong" }) });
    ok(bad.status === 401, "scrypt-hashed client rejects wrong secret → 401");

    // back-compat: the seeded sha256 client (svc-a / secret-A) still works
    const legacyAuth = await fetch(API + "/v1/token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ client_id: "svc-a", secret: "secret-A" }) });
    ok(legacyAuth.status === 200, "legacy sha256 client (svc-a) still authenticates");

    await admin.end();
  } else {
    console.log("  (skip e2e — DISPATCH_API_URL not set)");
  }

  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
