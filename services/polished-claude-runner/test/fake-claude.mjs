#!/usr/bin/env node
// Stand-in for the Claude Code CLI in tests: records its arguments and
// environment, emits stream-json like the real CLI (paced a little), and
// writes outputs the way the prompts ask.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const prompt = args[args.indexOf("-p") + 1] || "";
fs.writeFileSync(path.join(process.cwd(), "..", "last-call.json"), JSON.stringify({ args, env: process.env, cwd: process.cwd() }));
const sid = args.includes("--resume") ? args[args.indexOf("--resume") + 1] : args[args.indexOf("--session-id") + 1];
const out = (o) => process.stdout.write(JSON.stringify(o) + "\n");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const tool = (name, input) => out({ type: "assistant", message: { content: [{ type: "tool_use", name, input }] } });
const say = (text) => out({ type: "assistant", message: { content: [{ type: "text", text }] } });
const paceFile = path.join(process.env.HOME || ".", "pace");
const pace = Number(fs.existsSync(paceFile) ? fs.readFileSync(paceFile, "utf8") : 0) || 0;

out({ type: "system", subtype: "init", session_id: sid, cwd: process.cwd(), tools: [] });
if (prompt.includes("AUTHFAIL")) {
  out({ type: "result", subtype: "success", is_error: true, result: "Invalid API key · Please run /login", session_id: sid });
  process.exit(1);
}
if (prompt.includes("LIMITHIT")) {
  out({ type: "rate_limit_event", rate_limit_info: { status: "rejected", resetsAt: Math.floor(Date.now() / 1000) + 3600 } });
  out({ type: "result", subtype: "success", is_error: true, result: "Claude AI usage limit reached", session_id: sid });
  process.exit(1);
}
const toolOut = /Write \.\/out\/([\w./-]+\.md)/.exec(prompt);
if (toolOut && !/^(Rewrite|Summarise|Add citations|Create a book|Write Chapter|Improve Chapter)/.test(prompt)) {
  fs.mkdirSync(path.dirname(`out/${toolOut[1]}`), { recursive: true });
  fs.writeFileSync(`out/${toolOut[1]}`, `# Tool output\n\n${prompt.split("\n")[0]}`);
  say(`Wrote out/${toolOut[1]}.`);
  out({ type: "result", subtype: "success", is_error: false, result: "", session_id: sid });
  process.exit(0);
}
if (prompt.includes("SLOW")) { process.on("SIGTERM", () => process.exit(143)); setTimeout(() => {}, 60_000); }
else {
  const cwd = process.cwd();
  fs.mkdirSync("out/rewrite", { recursive: true });
  tool("Read", { file_path: path.join(cwd, "source", "book.txt") }); await wait(pace);
  tool("WebSearch", { query: "oslo capital" }); await wait(pace);
  out({ type: "user", message: { content: [{ type: "tool_result", is_error: true, content: "File is in a directory that is denied by your permission settings." }] } });
  if (prompt.startsWith("Rewrite")) {
    for (const [n, t] of [["01", "Beginnings"], ["02", "The Journey"], ["03", "Home"]]) {
      tool("Read", { file_path: path.join(cwd, "INSTRUCTIONS.md") }); await wait(pace);
      fs.writeFileSync(`out/rewrite/${n}-${t.toLowerCase().replace(/ /g, "-")}.md`, `## ${t}\n\n*In one sentence: chapter ${Number(n)}.*\n\nRewritten text of ${t.toLowerCase()}, warm and modern, keeping **every reference** (John 3:16).`);
      tool("Write", { file_path: path.join(cwd, `out/rewrite/${n}-${t.toLowerCase().replace(/ /g, "-")}.md`) }); await wait(pace);
    }
    fs.writeFileSync("out/rewrite-notes.md", "# Rewrite notes\n\n- All instructions followed.\n");
    say("Rewrote all **3 chapters**. Wrote `out/rewrite/01–03`, the full book and notes.");
  } else if (prompt.startsWith("Summarise")) {
    fs.writeFileSync("out/summary.md", "# The Long Road — Summary\n\nA journey from doubt to faith.\n\n## Key points\n\n- Faith grows through hardship\n- Community matters\n\n| Chapter | Summary |\n| --- | --- |\n| 1 | Beginnings |\n| 2 | The journey |\n\nSee https://example.org/source for background. <script>alert(1)</script>");
    tool("Write", { file_path: path.join(cwd, "out/summary.md") }); await wait(pace);
    say("Summary written to `out/summary.md`.");
  } else if (prompt.startsWith("Add citations")) {
    tool("WebFetch", { url: "https://www.britannica.com/place/Oslo" }); await wait(pace);
    fs.writeFileSync("out/cited.md", "# The Long Road\n\nOslo is the capital of Norway (Britannica, 2024).\n\n## References\n\n- Britannica. (2024). *Oslo*. https://www.britannica.com/place/Oslo (accessed 26 October 2026).\n");
    fs.writeFileSync("out/references.md", "- Britannica. (2024). *Oslo*.\n");
    say("Added 1 citation; 0 claims left as [citation needed].");
  } else if (prompt.startsWith("Create a book outline")) {
    const brief = fs.readFileSync("book/BRIEF.md", "utf8");
    const title = /- Title: (.*)/.exec(brief)[1];
    fs.mkdirSync("out/book", { recursive: true });
    fs.writeFileSync("out/book/outline.json", JSON.stringify({ title, subtitle: "A Claude Code outline", description: "d", targetAudience: "adults", positioning: "p", keywords: ["k"], categories: ["c"], coverDirection: { style: "s", colors: "c", typography: "t" }, frontMatter: "f", backMatter: "b",
      chapters: [1, 2, 3].map((n) => ({ title: `Part ${n}`, summary: `Summary ${n}`, keyPoints: ["a", "b"], hook: "h" })) }));
    tool("Write", { file_path: path.join(cwd, "out/book/outline.json") }); await wait(pace);
    say("Outline written.");
  } else if (prompt.startsWith("Write Chapter")) {
    const n = /^Write Chapter (\d+), "([^"]*)"/.exec(prompt);
    const prior = fs.existsSync("out/book/chapters") ? fs.readdirSync("out/book/chapters").length : 0;
    fs.mkdirSync("out/book/chapters", { recursive: true });
    fs.writeFileSync(`out/book/chapters/${n[1].padStart(2, "0")}.md`, `## ${n[2]}\n\nChapter ${n[1]} by Claude Code (saw ${prior} earlier chapters).`);
    tool("Write", { file_path: path.join(cwd, `out/book/chapters/${n[1].padStart(2, "0")}.md`) }); await wait(pace);
    say(`Chapter ${n[1]} written.`);
  } else if (prompt.startsWith("Improve Chapter")) {
    const target = /\.\/out\/(book\/improved\/[^ ]+\.md)/.exec(prompt)[1];
    const input = /current chapter is in \.\/(book\/improve-\d+\.md)/.exec(prompt)[1];
    fs.mkdirSync("out/book/improved", { recursive: true });
    if (!fs.readFileSync(input, "utf8").includes("FORGET")) fs.writeFileSync(`out/${target}`, fs.readFileSync(input, "utf8") + "\n\n*(improved)*");
    say("Improved.");
  } else say("Chapter 3 quotes **John 3:16** and *Psalm 23*. Want me to list them all in a file?");
  out({ type: "result", subtype: "success", is_error: false, result: "", session_id: sid, num_turns: 3, duration_ms: 10 });
}
