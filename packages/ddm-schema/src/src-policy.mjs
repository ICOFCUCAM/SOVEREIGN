// Sovereign Dispatch — image source SSRF policy (part of R-P1-3).
//
// The PDF renderer turns DDM into HTML that headless Chromium loads SERVER-SIDE.
// An attacker-supplied <img src="http://169.254.169.254/…"> would therefore make
// the rendering host fetch internal/metadata endpoints (SSRF). This pure gate
// decides whether a remote image src may be embedded as a fetchable <img>.
//
// Secure default: DO NOT fetch remote src. Blocked images render an accessible
// placeholder + a warning (never a silent fetch). Prefer `evidenceId` (our own
// storage, resolved without an attacker-controlled URL).
//
// Opt-in via env:
//   DISPATCH_ALLOW_REMOTE_IMAGES=1     allow http(s) src that passes the IP/host checks
//   DISPATCH_IMAGE_ALLOWLIST=a.com,b.com   only these hosts (suffix match); if set,
//                                          implies allow-remote but restricted to them
//
// Always blocked regardless of the above: non-http(s) schemes; private,
// loopback, link-local, unique-local, and cloud-metadata addresses; credentials
// in the URL; and (conservatively) bare-IP hosts unless explicitly allowlisted.

const META = "169.254.169.254"; // cloud instance metadata (AWS/GCP/Azure)

function allowlist() {
  return (process.env.DISPATCH_IMAGE_ALLOWLIST || "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}
function remoteAllowed() {
  return process.env.DISPATCH_ALLOW_REMOTE_IMAGES === "1" || allowlist().length > 0;
}

// IPv4 private/loopback/link-local/CGNAT ranges + obvious IPv6 private/loopback.
function isBlockedIp(host) {
  const h = host.toLowerCase();
  if (h === META) return true;
  // IPv6
  if (h.includes(":")) {
    const x = h.replace(/^\[|\]$/g, "");
    if (x === "::1" || x === "::") return true;                 // loopback / unspecified
    if (/^f[cd][0-9a-f]{2}:/.test(x)) return true;              // fc00::/7 unique-local
    if (/^fe80:/.test(x)) return true;                          // link-local
    if (/^::ffff:/.test(x)) return isBlockedIp(x.split(":").pop()); // IPv4-mapped
    return false;
  }
  // IPv4
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (!m) return false; // not a bare IPv4
  const o = m.slice(1).map(Number);
  if (o.some((n) => n > 255)) return true;                      // malformed → block
  const [a, b] = o;
  if (a === 127) return true;                                   // loopback
  if (a === 10) return true;                                    // private
  if (a === 0) return true;                                     // "this" network
  if (a === 169 && b === 254) return true;                      // link-local (+ metadata)
  if (a === 172 && b >= 16 && b <= 31) return true;             // private
  if (a === 192 && b === 168) return true;                      // private
  if (a === 100 && b >= 64 && b <= 127) return true;            // CGNAT
  return false;
}

function isBareIp(host) {
  const h = host.replace(/^\[|\]$/g, "");
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.includes(":");
}

/**
 * Decide whether an image `src` may be embedded as a server-fetchable <img>.
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function imageSrcAllowed(src) {
  if (!src || typeof src !== "string") return { allowed: false, reason: "no src" };
  let u;
  try { u = new URL(src); } catch { return { allowed: false, reason: "unparseable url" }; }

  if (u.protocol !== "http:" && u.protocol !== "https:") return { allowed: false, reason: `scheme ${u.protocol} not allowed` };
  if (u.username || u.password) return { allowed: false, reason: "credentials in url" };
  if (!remoteAllowed()) return { allowed: false, reason: "remote images disabled (use evidenceId or DISPATCH_ALLOW_REMOTE_IMAGES)" };

  const host = u.hostname.toLowerCase();
  if (isBlockedIp(host)) return { allowed: false, reason: "blocked address (private/loopback/link-local/metadata)" };

  const list = allowlist();
  if (list.length) {
    const okHost = list.some((d) => host === d || host.endsWith("." + d));
    return okHost ? { allowed: true } : { allowed: false, reason: "host not in allowlist" };
  }
  // allow-remote with no allowlist: permit named hosts, but never a bare IP
  // (a bare IP can't be allowlisted and is the usual SSRF vector).
  if (isBareIp(host)) return { allowed: false, reason: "bare IP host not allowed (use a hostname or allowlist)" };
  return { allowed: true };
}
