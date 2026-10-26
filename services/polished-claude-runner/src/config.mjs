import path from "node:path";

// Every setting comes from the environment so no secret ever lives in the
// repository. The Claude Code token is handed only to the Claude Code child
// process; this server never logs it or returns it.
/**
 * The token as Claude Code needs it. Pasting it into a dashboard often brings
 * along extra text: quotes, a trailing newline, line breaks where the terminal
 * wrapped it, "CLAUDE_CODE_OAUTH_TOKEN=" or the line `claude setup-token`
 * prints before it. Tokens never contain whitespace, so all of it is removed
 * and the token itself (sk-ant-oat01-…) is picked out when it's there.
 */
export function cleanToken(raw) {
  const lines = String(raw ?? "").split(/\r?\n/).map((l) => l.trim());
  const at = lines.findIndex((l) => /sk-ant-oat\d{2}-/.test(l));
  if (at >= 0) {
    let tok = /sk-ant-oat\d{2}-[A-Za-z0-9_-]*/.exec(lines[at])[0];
    // A terminal-wrapped token continues on lines made only of token characters.
    for (let i = at + 1; i < lines.length && /^[A-Za-z0-9_-]+$/.test(lines[i]); i++) tok += lines[i];
    return tok;
  }
  return String(raw ?? "").replace(/\s+/g, "").replace(/^(export)?CLAUDE_CODE_OAUTH_TOKEN=/i, "").replace(/^["']+|["']+$/g, "");
}

/** What kind of value the token is, for the Studio page (never the token itself). */
export function tokenShape(token) {
  if (!token) return "missing";
  if (/^sk-ant-oat\d{2}-[A-Za-z0-9_-]{40,}$/.test(token)) return "subscription";
  if (/^sk-ant-api\d{2}-/.test(token)) return "api-key";
  return "unrecognised";
}

const list = (v) => String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export function loadConfig(env = process.env) {
  const dataDir = path.resolve(env.DATA_DIR || "./data");
  return {
    port: Number(env.PORT || 8787),
    dataDir,
    supabaseUrl: String(env.SUPABASE_URL || "").replace(/\/+$/, ""),
    supabaseAnonKey: env.SUPABASE_ANON_KEY || "",
    adminUserIds: new Set(list(env.RUNNER_ADMIN_USER_IDS)),
    allowedOrigins: new Set(list(env.ALLOWED_ORIGINS)),
    claudeBin: env.CLAUDE_BIN || "claude",
    claudeModel: env.CLAUDE_MODEL || "",
    claudeToken: cleanToken(env.CLAUDE_CODE_OAUTH_TOKEN),
    jobTimeoutMs: Number(env.JOB_TIMEOUT_MIN || 240) * 60_000,
    maxUploadBytes: Number(env.MAX_UPLOAD_MB || 40) * 1024 * 1024,
  };
}

export function configProblems(cfg) {
  const p = [];
  if (!cfg.supabaseUrl) p.push("SUPABASE_URL is not set");
  if (!cfg.supabaseAnonKey) p.push("SUPABASE_ANON_KEY is not set");
  if (cfg.adminUserIds.size === 0) p.push("RUNNER_ADMIN_USER_IDS is not set");
  if (cfg.allowedOrigins.size === 0) p.push("ALLOWED_ORIGINS is not set");
  return p;
}
