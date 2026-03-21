import { useQuery } from "@tanstack/react-query";
import { useLocalStorage } from "@/state/local/useLocalStorage";
import { LocalStorageKeys } from "@/state/local/useLocalStorage";
import { resolveActiveSessionContext } from "@/state/auth/resolveActiveSession";

/**
 * Resolves `@directus-active-session-id` + `directus_session:<id>` + `@directus-apis` for UI (settings, etc.).
 */
export function useResolvedActiveSession() {
  const { data: sessionId = "" } = useLocalStorage<string>(
    LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID,
    undefined,
    "",
  );

  return useQuery({
    queryKey: ["resolved-active-session", sessionId],
    queryFn: () => resolveActiveSessionContext(),
    enabled: !!sessionId?.trim(),
    staleTime: 5_000,
  });
}
