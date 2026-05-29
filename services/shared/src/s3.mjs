// Sovereign Dispatch — S3-compatible object storage backend (productionization).
//
// Dependency-free AWS SigV4 (node:crypto) — no AWS SDK, no supply-chain surface.
// Works against AWS S3 and any S3-compatible endpoint (incl. Supabase Storage's
// S3 protocol, MinIO, R2). Used by storage.mjs when DISPATCH_STORAGE_BACKEND=s3.
//
// Config (env):
//   S3_ENDPOINT        e.g. https://s3.eu-west-2.amazonaws.com
//                      or   https://<proj>.supabase.co/storage/v1/s3
//   S3_REGION          e.g. eu-west-2   (Supabase: any, e.g. us-east-1)
//   S3_BUCKET          bucket name
//   S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY
//   S3_FORCE_PATH_STYLE=1   (Supabase/MinIO require path-style)
//
// NOTE: signing is verified against AWS's published SigV4 presign test vector
// (see s3.test.mjs). Live PUT/GET against a real endpoint is NOT exercised in
// this environment (no creds / network) — validate on first deploy.

import { createHash, createHmac } from "node:crypto";

const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
// AWS URI-encodes the path but keeps "/" unescaped.
const encPath = (p) => p.split("/").map(enc).join("/");
const sha256hex = (buf) => createHash("sha256").update(buf).digest("hex");
const hmac = (key, data) => createHmac("sha256", key).update(data).digest();

export function s3Config() {
  return {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "us-east-1",
    bucket: process.env.S3_BUCKET,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    pathStyle: process.env.S3_FORCE_PATH_STYLE === "1" || !!process.env.S3_ENDPOINT,
  };
}

export function s3Configured() {
  const c = s3Config();
  return !!(c.endpoint && c.bucket && c.accessKeyId && c.secretAccessKey);
}

function amzDate(d = new Date()) {
  const iso = d.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { full: iso.slice(0, 15) + "Z", short: iso.slice(0, 8) };
}

function signingKey(secret, dateShort, region, service) {
  return hmac(hmac(hmac(hmac("AWS4" + secret, dateShort), region), service), "aws4_request");
}

// Build the host + canonical path for an object key (path-style vs virtual-host).
function urlParts(cfg, key) {
  const u = new URL(cfg.endpoint);
  if (cfg.pathStyle) return { host: u.host, scheme: u.protocol, base: `${u.protocol}//${u.host}`, path: `${u.pathname.replace(/\/$/, "")}/${cfg.bucket}/${encPath(key)}` };
  return { host: `${cfg.bucket}.${u.host}`, scheme: u.protocol, base: `${u.protocol}//${cfg.bucket}.${u.host}`, path: `/${encPath(key)}` };
}

/**
 * Presign a GET (or other method) URL — pure HMAC, no network. Returns the URL.
 * @param {string} key object key
 * @param {number} expiresSeconds
 * @param {{method?:string, now?:Date, cfg?:object}} [opts]
 */
export function presignUrl(key, expiresSeconds, opts = {}) {
  const cfg = opts.cfg || s3Config();
  const method = opts.method || "GET";
  const service = "s3";
  const { full, short } = amzDate(opts.now || new Date());
  const { host, base, path } = urlParts(cfg, key);
  const cred = `${cfg.accessKeyId}/${short}/${cfg.region}/${service}/aws4_request`;
  const q = new Map([
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", cred],
    ["X-Amz-Date", full],
    ["X-Amz-Expires", String(expiresSeconds)],
    ["X-Amz-SignedHeaders", "host"],
  ]);
  const canonicalQuery = [...q.entries()].map(([k, v]) => `${enc(k)}=${enc(v)}`).sort().join("&");
  const canonicalHeaders = `host:${host}\n`;
  const canonicalRequest = [method, path, canonicalQuery, canonicalHeaders, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", full, `${short}/${cfg.region}/${service}/aws4_request`, sha256hex(canonicalRequest)].join("\n");
  const sig = hmac(signingKey(cfg.secretAccessKey, short, cfg.region, service), stringToSign).toString("hex");
  return `${base}${path}?${canonicalQuery}&X-Amz-Signature=${sig}`;
}

// Signed request headers for an authenticated PUT/GET (used for upload/download).
function signedHeaders(cfg, method, key, body) {
  const service = "s3";
  const { full, short } = amzDate();
  const { host, base, path } = urlParts(cfg, key);
  const payloadHash = sha256hex(body ?? Buffer.alloc(0));
  const headers = { host, "x-amz-content-sha256": payloadHash, "x-amz-date": full };
  const signedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = signedHeaderNames.map((h) => `${h}:${headers[h]}\n`).join("");
  const signedHeaderStr = signedHeaderNames.join(";");
  const canonicalRequest = [method, path, "", canonicalHeaders, signedHeaderStr, payloadHash].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", full, `${short}/${cfg.region}/${service}/aws4_request`, sha256hex(canonicalRequest)].join("\n");
  const sig = hmac(signingKey(cfg.secretAccessKey, short, cfg.region, service), stringToSign).toString("hex");
  headers.Authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${short}/${cfg.region}/${service}/aws4_request, SignedHeaders=${signedHeaderStr}, Signature=${sig}`;
  return { url: `${base}${path}`, headers };
}

export async function s3Put(key, buf, contentType = "application/octet-stream") {
  const cfg = s3Config();
  const { url, headers } = signedHeaders(cfg, "PUT", key, buf);
  const r = await fetch(url, { method: "PUT", headers: { ...headers, "content-type": contentType }, body: buf });
  if (!r.ok) throw new Error(`s3 put failed: ${r.status} ${await r.text().catch(() => "")}`.slice(0, 200));
}

export async function s3Get(key) {
  const cfg = s3Config();
  const { url, headers } = signedHeaders(cfg, "GET", key);
  const r = await fetch(url, { method: "GET", headers });
  if (!r.ok) throw new Error(`s3 get failed: ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}
