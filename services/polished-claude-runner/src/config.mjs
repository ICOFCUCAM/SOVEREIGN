import path from "node:path";

// Every setting comes from the environment so no secret ever lives in the
// repository. The Claude Code token is handed only to the Claude Code child
// process; this server never logs it or returns it.
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
    claudeToken: env.CLAUDE_CODE_OAUTH_TOKEN || "",
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
