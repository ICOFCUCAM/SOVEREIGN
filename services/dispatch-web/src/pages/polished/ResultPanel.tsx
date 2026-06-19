import React, { useState } from "react";
import { Button, Card } from "../../lib/ui";

// Shared output surface for the Polished Pages department. The engine returns
// Markdown; we present it as readable preformatted text with copy + download,
// rather than pulling in a Markdown renderer (the standalone product keeps the
// rich preview — this department is the in-console authoring surface).
const ResultPanel: React.FC<{ title: string; content: string; filename: string }> = ({ title, content, filename }) => {
  const [copied, setCopied] = useState(false);

  const copy = async (): Promise<void> => {
    try { await navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };
  const download = (): void => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">{title}</h3>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={copy}>{copied ? "Copied ✓" : "Copy"}</Button>
          <Button variant="ghost" onClick={download}>Download .md</Button>
        </div>
      </div>
      <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-md bg-ink-900/70 p-4 font-sans text-sm leading-relaxed text-white/85">{content}</pre>
    </Card>
  );
};

export default ResultPanel;
