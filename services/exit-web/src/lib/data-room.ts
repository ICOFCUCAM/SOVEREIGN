// Data Room API client. Calls the Supabase edge functions
// exit-doc-upload + exit-doc-list. The SPA holds no service-role
// credentials. Each call carries the signed-in user's own access token;
// the functions take the tenant from that token, so each account sees
// only its own room. Without a live session there is no data room.

import { liveUserToken } from "./exit-api";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  ?? "https://qvjdivcdefuprnenedje.supabase.co";

// Public anon key — safe to embed; only grants the anon role.
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2amRpdmNkZWZ1cHJuZW5lZGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjMwMjYsImV4cCI6MjA5NTIzOTAyNn0.2cKjQRxnspeySCRwsOGz0ntKZ9LD3BVKR80H1mPOu_c";

// The demo tenant, still used by telemetry and calibration (not by the data room).
export const DEMO_TENANT_ID = "00000000-0000-0000-0000-000000000099";

export type RoomKind =
  | "financial" | "market" | "user_growth" | "technical_architecture"
  | "security" | "legal" | "commercial";

export interface DataRoomDocument {
  readonly id: string;
  readonly room_kind: RoomKind;
  readonly filename: string;
  readonly mime: string;
  readonly bytes: number;
  readonly storage_path: string;
  readonly classification: "unclassified" | "sensitive" | "confidential";
  readonly uploaded_at: string;
  readonly description?: string | null;
  readonly downloadUrl?: string | null;
}

interface UploadResponse { ok: boolean; document?: DataRoomDocument; error?: string }
interface ListResponse   { ok: boolean; items?: DataRoomDocument[];   error?: string }

export const NO_ROOM = "The data room needs a live account session; it is not available in this browser-only mode.";

/** Headers for a data-room call, as the signed-in user; throws without one. */
async function headers(): Promise<Record<string, string>> {
  const token = await liveUserToken();
  if (!token) throw new Error(NO_ROOM);
  return { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY, "content-type": "application/json" };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return reject(new Error("read failed"));
      const idx = result.indexOf(",");
      resolve(idx === -1 ? result : result.slice(idx + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

export async function uploadDocument(input: {
  roomKind: RoomKind;
  file: File;
  description?: string;
  classification?: DataRoomDocument["classification"];
}): Promise<DataRoomDocument> {
  const h = await headers();
  const base64 = await fileToBase64(input.file);
  const res = await fetch(`${SUPABASE_URL}/functions/v1/exit-doc-upload`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      roomKind: input.roomKind,
      filename: input.file.name,
      mime: input.file.type || "application/octet-stream",
      bytes: input.file.size,
      base64,
      ...(input.description ? { description: input.description } : {}),
      ...(input.classification ? { classification: input.classification } : {}),
    }),
  });
  const json = (await res.json()) as UploadResponse;
  if (!res.ok || !json.ok || !json.document) {
    throw new Error(json.error ?? `upload failed: ${res.status}`);
  }
  return json.document;
}

export async function listDocuments(roomKind?: RoomKind): Promise<DataRoomDocument[]> {
  const h = await headers();
  const url = new URL(`${SUPABASE_URL}/functions/v1/exit-doc-list`);
  if (roomKind) url.searchParams.set("roomKind", roomKind);
  const res = await fetch(url, { headers: h });
  const json = (await res.json()) as ListResponse;
  if (!res.ok || !json.ok) throw new Error(json.error ?? `list failed: ${res.status}`);
  return json.items ?? [];
}

export function fmtBytes(n: number): string {
  if (n < 1024)            return `${n} B`;
  if (n < 1024 * 1024)     return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
