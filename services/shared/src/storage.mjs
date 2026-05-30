// Sovereign Dispatch — artifact storage abstraction.
//
// Writes rendered artifact bytes to an object store and returns a storage ref +
// sha256. Two backends behind one interface (putArtifact/getArtifact/signUrl):
//   - fs (default): local filesystem; zero dependency, used in CI/dev.
//   - s3: any S3-compatible endpoint (AWS S3, Supabase Storage S3, MinIO, R2),
//         dependency-free SigV4 (s3.mjs); gives genuine shareable signed URLs.
// Select with DISPATCH_STORAGE_BACKEND=fs|s3 (auto-uses s3 if it's configured).
//
//   DISPATCH_STORAGE_DIR     base dir for the fs backend (default: /tmp/dispatch-artifacts)
//   S3_* (see s3.mjs)        config for the s3 backend
//
// Path convention: tenant/{tid}/doc/{docId}/{versionId}/{artifactId}.{ext}

import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { s3Configured, s3Put, s3Get, presignUrl } from "./s3.mjs";

const BASE = process.env.DISPATCH_STORAGE_DIR || "/tmp/dispatch-artifacts";

const CONTENT_TYPE = { md: "text/markdown; charset=utf-8", pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };

export function backend() {
  const sel = (process.env.DISPATCH_STORAGE_BACKEND || "").toLowerCase();
  if (sel === "s3") return "s3";
  if (sel === "fs") return "fs";
  return s3Configured() ? "s3" : "fs"; // auto: use s3 when configured
}

export function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

export function artifactKey({ tenantId, documentId, versionId, artifactId, ext }) {
  return `tenant/${tenantId}/doc/${documentId}/${versionId}/${artifactId}.${ext}`;
}

function extOf(key) { const m = /\.([a-z0-9]+)$/.exec(key); return m ? m[1] : ""; }

/**
 * Write artifact bytes. Returns { storageRef, sha256, sizeBytes }.
 * Write-once: callers create a new artifactId per (re-)render.
 */
export async function putArtifact(key, bytes) {
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  if (backend() === "s3") {
    await s3Put(key, buf, CONTENT_TYPE[extOf(key)] || "application/octet-stream");
  } else {
    const abs = join(BASE, key);
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, buf);
  }
  return { storageRef: key, sha256: sha256(buf), sizeBytes: buf.length };
}

export async function getArtifact(key) {
  return backend() === "s3" ? s3Get(key) : readFile(join(BASE, key));
}

export async function artifactExists(key) {
  if (backend() === "s3") { try { await s3Get(key); return true; } catch { return false; } }
  try { await stat(join(BASE, key)); return true; } catch { return false; }
}

/**
 * Mint a retrieval URL for an artifact, TTL-capped. Returns { url, expiresAt, capped }.
 *   - s3: a genuine SigV4 presigned URL (shareable, expires server-side).
 *   - fs: a file:// URL with an expiry hint (dev only; not a real signed URL —
 *         clients fetch bytes via GET /v1/artifacts/{id} in dev).
 */
export function signUrl(key, ttlSeconds = 604800, maxTtl = 2592000) {
  const ttl = Math.min(ttlSeconds, maxTtl);
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  if (backend() === "s3") {
    return { url: presignUrl(key, ttl, { method: "GET" }), expiresAt, capped: ttl < ttlSeconds };
  }
  return { url: `file://${join(BASE, key)}?expires=${encodeURIComponent(expiresAt)}`, expiresAt, capped: ttl < ttlSeconds };
}
