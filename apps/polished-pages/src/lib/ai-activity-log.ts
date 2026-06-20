export interface AiActivity {
  id: string;
  tool: string;
  description: string;
  status: "ok" | "error";
  ts: number;
}

const KEY = "pp_ai_activity";
const MAX = 20;

function read(): AiActivity[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

export function logAiActivity(entry: Omit<AiActivity, "id" | "ts">) {
  try {
    const all = read();
    all.unshift({ ...entry, id: Math.random().toString(36).slice(2), ts: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(all.slice(0, MAX)));
  } catch { /* ignore storage errors */ }
}

export function getAiActivity(): AiActivity[] {
  return read();
}
