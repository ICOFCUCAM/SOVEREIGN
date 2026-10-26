import { spawn } from "node:child_process";
import path from "node:path";
import { SYSTEM } from "./prompts.mjs";

// Runs the official Claude Code CLI headlessly in a thread's work folder.
//
// The fence, every layer of which was checked against the real CLI:
//   --restricted        removes every tool that runs commands or code and ignores settings files
//   --tools             the only tools that exist in the run
//   --permission-mode dontAsk + --permission-prompts none
//                        anything not pre-approved is refused, never asked
//   --settings          allows reading and writing only inside the work folder
//   --strict-mcp-config no MCP servers
// The child gets a fresh environment: the Claude Code token and a few switches,
// nothing else. In particular no ANTHROPIC_API_KEY (it would outrank the
// subscription token and bill the API) and none of this server's settings.
export const TOOLS = ["Read", "Write", "Edit", "Glob", "Grep", "WebSearch", "WebFetch", "TodoWrite"];

// Reading outside the work folder already needs approval, which dontAsk refuses;
// the deny list is a second wall around the places secrets live. A wall that
// would also cover the work folder itself (a runner kept under /home, say) is left out.
const SYSTEM_DIRS = ["/proc", "/etc", "/sys", "/root", "/home", "/var", "/run"];

export function settingsFor(cwd) {
  const walls = SYSTEM_DIRS.filter((d) => !(cwd === d || cwd.startsWith(d + "/"))).map((d) => `Read(/${d}/**)`);
  return {
    permissions: {
      allow: ["Read(./**)", "Edit(./**)", "Write(./**)", "Glob", "Grep", "WebSearch", "WebFetch", "TodoWrite"],
      deny: ["Edit(./source/**)", "Write(./source/**)", "Read(~/**)", ...walls],
    },
  };
}

export function claudeArgs({ prompt, sessionId, resume, model, cwd }) {
  const args = [
    "-p", prompt,
    "--output-format", "stream-json", "--verbose",
    "--restricted",
    "--tools", TOOLS.join(","),
    "--permission-mode", "dontAsk",
    "--permission-prompts", "none",
    "--strict-mcp-config",
    "--settings", JSON.stringify(settingsFor(cwd)),
    "--append-system-prompt", SYSTEM,
  ];
  if (model) args.push("--model", model);
  if (resume) args.push("--resume", resume);
  else if (sessionId) args.push("--session-id", sessionId);
  return args;
}

export function childEnv(cfg, home) {
  const env = {
    PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
    HOME: home,
    LANG: process.env.LANG || "C.UTF-8",
    DISABLE_AUTOUPDATER: "1",
    DISABLE_TELEMETRY: "1",
    // A whole book can need many searches; -p runs get no hourly refill otherwise.
    CLAUDE_CODE_WEB_SEARCH_REFILLS_PER_HOUR: "200",
  };
  if (cfg.claudeToken) env.CLAUDE_CODE_OAUTH_TOKEN = cfg.claudeToken;
  return env;
}

/** A short, human line for a tool call ("Searching the web: …"). Paths are shown relative to the work folder. */
export function describeTool(name, input = {}, cwd = "") {
  const rel = (p) => (p ? path.relative(cwd, String(p)) || String(p) : "");
  switch (name) {
    case "Read": return `Reading ${rel(input.file_path)}`;
    case "Write": return `Writing ${rel(input.file_path)}`;
    case "Edit": return `Editing ${rel(input.file_path)}`;
    case "Glob": return `Looking for files: ${input.pattern ?? ""}`;
    case "Grep": return `Searching the text for "${input.pattern ?? ""}"`;
    case "WebSearch": return `Searching the web: ${input.query ?? ""}`;
    case "WebFetch": return `Opening ${input.url ?? "a web page"}`;
    case "TodoWrite": return "Planning the next steps";
    default: return `Using ${name}`;
  }
}

/**
 * Starts one Claude Code run. Calls onEvent with simplified events:
 *   {type:"session", sessionId} {type:"text", text} {type:"tool", name, line}
 *   {type:"denied", line} {type:"notice", line}
 * Resolves with {ok, result, sessionId, error, durationMs, turns}.
 */
export function runClaude({ cfg, cwd, home, prompt, sessionId, resume, onEvent, timeoutMs }) {
  const child = spawn(cfg.claudeBin, claudeArgs({ prompt, sessionId, resume, model: cfg.claudeModel, cwd }), {
    cwd, env: childEnv(cfg, home), stdio: ["ignore", "pipe", "pipe"],
  });
  let buf = "";
  let final = null;
  let sid = resume || sessionId || null;
  let stderr = "";

  const handle = (line) => {
    let e;
    try { e = JSON.parse(line); } catch { return; }
    if (e.type === "system" && e.subtype === "init" && e.session_id) { sid = e.session_id; onEvent({ type: "session", sessionId: sid }); }
    else if (e.type === "system" && e.subtype === "api_retry") onEvent({ type: "notice", line: "Claude is busy; retrying in a moment…" });
    else if (e.type === "assistant" && Array.isArray(e.message?.content)) {
      for (const b of e.message.content) {
        if (b.type === "text" && b.text?.trim()) onEvent({ type: "text", text: b.text });
        else if (b.type === "tool_use") onEvent({ type: "tool", name: b.name, line: describeTool(b.name, b.input, cwd) });
      }
    } else if (e.type === "user" && Array.isArray(e.message?.content)) {
      for (const b of e.message.content) {
        if (b.type === "tool_result" && b.is_error && /denied|not allowed|permission/i.test(String(b.content))) onEvent({ type: "denied", line: "A step outside Claude Studio's allowed area was refused." });
      }
    } else if (e.type === "rate_limit_event" && e.rate_limit_info?.status && e.rate_limit_info.status !== "allowed") {
      onEvent({ type: "notice", line: "Your Claude plan's usage limit has been reached for now." });
    } else if (e.type === "result") final = e;
  };

  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) { const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (l) handle(l); }
  });
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (d) => { if (stderr.length < 4000) stderr += d; });

  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; stop(); }, timeoutMs);
  function stop() {
    if (child.exitCode !== null) return;
    child.kill("SIGTERM");
    setTimeout(() => { if (child.exitCode === null) child.kill("SIGKILL"); }, 5000).unref();
  }

  const done = new Promise((resolve) => {
    child.on("error", (err) => { clearTimeout(timer); resolve({ ok: false, sessionId: sid, error: err.code === "ENOENT" ? "Claude Code is not installed on the runner." : "Claude Code could not be started." }); });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (buf.trim()) handle(buf.trim());
      if (final) {
        resolve({
          ok: final.subtype === "success" && !final.is_error,
          result: typeof final.result === "string" ? final.result : "",
          sessionId: final.session_id || sid,
          error: final.is_error || final.subtype !== "success" ? explain(final, stderr) : null,
          durationMs: final.duration_ms ?? null,
          turns: final.num_turns ?? null,
        });
      } else {
        resolve({ ok: false, sessionId: sid, error: timedOut ? "The run took longer than the time limit and was stopped." : signal ? "The run was stopped." : explain(null, stderr, code) });
      }
    });
  });
  return { done, stop };
}

function explain(final, stderr, code) {
  const text = `${final?.result ?? ""} ${final?.api_error_status ?? ""} ${stderr}`.toLowerCase();
  if (/invalid api key|oauth|401|unauthori[sz]ed|not logged in|login/.test(text)) return "Claude Code is not signed in on the runner. Set a fresh CLAUDE_CODE_OAUTH_TOKEN.";
  if (/rate limit|usage limit|429/.test(text)) return "Your Claude plan's usage limit has been reached. Try again later.";
  if (final?.subtype === "error_max_turns") return "Claude stopped after the maximum number of steps.";
  return final?.result?.trim() || `Claude Code ended unexpectedly${code != null ? ` (exit ${code})` : ""}.`;
}
