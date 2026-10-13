// Data Room API client. Calls the Supabase edge functions
// exit-doc-upload + exit-doc-list. The SPA holds no service-role
// credentials. Each call carries the signed-in user's own access token;
// the functions take the tenant from that token, so each account sees
// only its own room. Without a live session there is no data room.

import type { ReviewState, RoomFile } from "@exit/engines";
import { liveUserToken } from "./exit-api";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  ?? "https://qvjdivcdefuprnenedje.supabase.co";

// Public anon key — safe to embed; only grants the anon role.
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2amRpdmNkZWZ1cHJuZW5lZGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjMwMjYsImV4cCI6MjA5NTIzOTAyNn0.2cKjQRxnspeySCRwsOGz0ntKZ9LD3BVKR80H1mPOu_c";

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
  /** The diligence artifact this file is meant to satisfy (null: untagged, counts for nothing). */
  readonly artifact_id?: string | null;
  readonly company_id?: string | null;
  readonly review_state?: ReviewState;
  readonly reviewed_at?: string | null;
  readonly review_note?: string | null;
  /** seller_only (default) or post_nda: visible to a buyer only under an executed, unexpired NDA */
  readonly disclosure?: "seller_only" | "post_nda";
}

/** The engine's view of a file, for completeness (diligence/room.ts). */
export const toRoomFile = (d: DataRoomDocument): RoomFile => ({
  id: d.id, artifactId: d.artifact_id ?? null, companyId: d.company_id ?? null,
  reviewState: d.review_state ?? "submitted", filename: d.filename, uploadedAt: d.uploaded_at,
});

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
  /** The artifact the file satisfies; it must belong to roomKind. */
  artifactId?: string;
  companyId?: string | null;
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
      ...(input.artifactId ? { artifactId: input.artifactId } : {}),
      ...(input.companyId ? { companyId: input.companyId } : {}),
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

async function rpc(fn: string, args: Record<string, unknown>, what: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: await headers(), body: JSON.stringify(args) });
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { message?: string } | null;
    throw new Error(`${what}: ${body?.message ?? res.status}`);
  }
}

/** Tag (or re-tag) one of your files with the artifact it satisfies; re-tagging returns it to "submitted". */
export const tagFile = (documentId: string, artifactId: string | null, companyId: string | null): Promise<void> =>
  rpc("exit_data_room_tag", { p_document: documentId, p_artifact: artifactId, p_company: companyId }, "Tagging the file");

/** Accept or reject a tagged file: only accepted files count towards completeness. */
export const reviewFile = (documentId: string, state: "accepted" | "rejected", note?: string): Promise<void> =>
  rpc("exit_data_room_review", { p_document: documentId, p_state: state, p_note: note ?? null }, "Reviewing the file");

export function fmtBytes(n: number): string {
  if (n < 1024)            return `${n} B`;
  if (n < 1024 * 1024)     return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
