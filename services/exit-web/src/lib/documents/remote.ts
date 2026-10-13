import { useMemo } from "react";
import { useAuth } from "../auth";
import { authConfigFromEnv } from "../email-auth";
import type { Remote } from "./store";

/** The signed-in user's server access for documents, or undefined (development / signed out). */
export function useDocumentRemote(): Remote | undefined {
  const { session } = useAuth();
  return useMemo(() => {
    const cfg = authConfigFromEnv();
    return session?.verified && cfg ? { url: cfg.url, anonKey: cfg.anonKey, accessToken: session.verified.accessToken } : undefined;
  }, [session]);
}
