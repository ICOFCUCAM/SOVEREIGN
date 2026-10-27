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
if (prompt.includes("copy and art direction for its printed cover")) {
  const book = fs.readFileSync("cover/book.md", "utf8");
  fs.writeFileSync("out/cover-copy.json", JSON.stringify({ tagline: "A road worth walking", backHeadline: "Every journey begins in doubt.", blurb: `A book about ${/^# (.+)$/m.exec(book)?.[1] ?? "something"}.\n\nSecond paragraph.`, bio: "The author lives in [city].", category: "Religion / Christian Living", template: "devotional", frontArt: "A lone path at dawn", backArt: "Soft dawn sky" }));
  say("Wrote out/cover-copy.json.");
  out({ type: "result", subtype: "success", is_error: false, result: "done", session_id: sid });
  process.exit(0);
}
if (prompt.includes("include scanned pages or images")) {
  fs.mkdirSync("out/scanned", { recursive: true });
  const words = "The oneness of God is taught throughout the scriptures from Genesis to Revelation, and this book sets out that teaching plainly for every reader. ";
  for (const f of fs.readdirSync("source").filter((x) => /\.pdf$/i.test(x))) fs.writeFileSync(`out/scanned/${f.replace(/\.[^.]+$/, "")}.txt`, words.repeat(3));
  fs.writeFileSync("out/scanned-text.md", "# scans\n\n<!-- page 1 -->\n" + words);
  out({ type: "result", subtype: "success", is_error: false, result: "Read.", session_id: sid });
  process.exit(0);
}
if (prompt.includes("Design a new, professional book")) {
  const sources = fs.existsSync("source") ? fs.readdirSync("source") : [];
  fs.writeFileSync("out/book-design-inventory.md", `# Inventory\n\n${sources.join(", ")}`);
  fs.writeFileSync("out/book-design.json", JSON.stringify({ title: "Rebuilt", subtitle: "", reader: "Students", rationale: prompt.includes("Course textbook") ? "A course." : "A book.", sections: [{ kind: "introduction", title: "Introduction", summary: "Using the book.", keyPoints: [], draws: sources.join(", "), apparatus: "" }, { kind: "chapter", title: "One", summary: "First.", keyPoints: [], draws: prompt.includes("./manuscript/") ? "the manuscript" : "the source", apparatus: "Review questions" }], unplaced: [], missing: [] }));
  out({ type: "result", subtype: "success", is_error: false, result: "Designed.", session_id: sid });
  process.exit(0);
}
if (prompt.includes("turn it into a book series")) {
  fs.mkdirSync("out/volumes", { recursive: true }); fs.mkdirSync("out/planned", { recursive: true });
  fs.writeFileSync("out/volumes/01-beginnings.md", "# Beginnings\n\n## One\n\nFirst.");
  fs.writeFileSync("out/volumes/02-the-road.md", "# The Road\n\n## Previously\n\nRecap.\n\n## Two\n\nSecond.");
  fs.writeFileSync("out/planned/01-home.md", "# Home\n\nA premise.\n\n## Arrival\n\nThey arrive.\n\n## Rest\n\nThey rest.");
  fs.writeFileSync("out/series-plan.md", "# The Long Road series\n\nPremise.");
  fs.writeFileSync("out/series.json", JSON.stringify({ title: "The Long Road", premise: "A journey.", volumes: [{ title: "Beginnings", file: "volumes/01-beginnings.md" }, { title: "The Road", file: "volumes/02-the-road.md" }], planned: [{ title: "Home", file: "planned/01-home.md" }] }));
  out({ type: "result", subtype: "success", is_error: false, result: "Series planned.", session_id: sid });
  process.exit(0);
}
const sectionOut = /to \.\/out\/(sections\/[\w-]+\.md)/.exec(prompt);
if (sectionOut) {
  const file = /The section to work on is \.\/(manuscript\/[^\s]+\.md)/.exec(prompt)[1];
  const before = fs.readFileSync(file, "utf8").replace(/^## .*\n\n/, "").trim();
  const voice = fs.existsSync("VOICE.md") ? " [voice used]" : "";
  fs.mkdirSync("out/sections", { recursive: true });
  const rules = /Rules for the whole book[^\n]*\n(.+)/.exec(prompt)?.[1];
  const pageNote = /notes on particular pages[^\n]*\n- (Page [^\n]+)/.exec(prompt)?.[1];
  const notesOut = /Then write \.\/out\/(sections\/[\w-]+-notes\.md)/.exec(prompt)?.[1];
  if (notesOut) fs.writeFileSync(`out/${notesOut}`, `### From your book\n\n${fs.readdirSync("source").join(", ")}${pageNote ? `\n\n### Your notes and rules\n\n${pageNote}` : ""}`);
  if (/^Enhance the writing quality|Tighten this content/m.test(prompt)) { fs.writeFileSync(`out/${sectionOut[1]}`, `${before} (improved)`); out({ type: "result", subtype: "success", is_error: false, result: "Section done.", session_id: sid }); process.exit(0); }
  fs.writeFileSync(`out/${sectionOut[1]}`, sectionOut[1].endsWith("-summary.md") ? `It says: ${before}` : `${before}${rules ? ` [rules: ${rules}]` : " (expanded by Claude Code)"}${voice}`);
  out({ type: "result", subtype: "success", is_error: false, result: "Section done.", session_id: sid });
  process.exit(0);
}
const toolOut = /write \.\/out\/([\w./-]+\.md)/i.exec(prompt);
if (toolOut && !/^(Summarise|Add citations|Create a book|Write Chapter|Improve Chapter)/.test(prompt) && !prompt.includes("following ./INSTRUCTIONS.md")) {
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
  if (prompt.startsWith("Rewrite") && prompt.includes("following ./INSTRUCTIONS.md")) {
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
    const prior = fs.existsSync("out/book/chapters") ? fs.readdirSync("out/book/chapters").filter((f) => /^\d+\.md$/.test(f)).length : 0;
    fs.mkdirSync("out/book/chapters", { recursive: true });
    fs.writeFileSync(`out/book/chapters/${n[1].padStart(2, "0")}.md`, `## ${n[2]}\n\nChapter ${n[1]} by Claude Code (saw ${prior} earlier chapters).`);
    tool("Write", { file_path: path.join(cwd, `out/book/chapters/${n[1].padStart(2, "0")}.md`) }); await wait(pace);
    const notes = /Write \.\/out\/(book\/chapters\/\d+-notes\.md)/.exec(prompt)?.[1];
    if (notes) fs.writeFileSync(`out/${notes}`, `### From your book\n\n${fs.readdirSync("source").join(", ")}\n\nApproach: ${/Polish the owner's own book/.test(prompt) ? "polish" : /mainly from research/.test(prompt) ? "research" : /strengthen it with other sources/.test(prompt) ? "mine-and-research" : "mine"}`);
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
