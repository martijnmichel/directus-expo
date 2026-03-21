import type { API } from "@/components/APIForm";
import { LoginFormData } from "@/components/LoginForm";
import { AppSettings } from "@/hooks/useAppSettings";
import { queryClient } from "@/utils/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useMutation,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";

export enum LocalStorageKeys {
  APP_SETTINGS = "@app-settings",
  DIRECTUS_APIS = "@directus-apis",
  /** Active login: plain session UUID (see `directus_session:<id>`) */
  DIRECTUS_ACTIVE_SESSION_ID = "@directus-active-session-id",
  CONTENT_PATH = "@content-path",
}

export type LocalStorageTyp = {
  [LocalStorageKeys.APP_SETTINGS]: AppSettings;
  [LocalStorageKeys.DIRECTUS_APIS]: API[];
  [LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID]: string;
  [LocalStorageKeys.CONTENT_PATH]: string;
};

/** Default value when storage is empty so React Query never receives undefined. */
function getDefaultForKey(key: LocalStorageKeys): Record<string, unknown> | [] | string | null {
  switch (key) {
    case LocalStorageKeys.APP_SETTINGS:
      return {};
    case LocalStorageKeys.DIRECTUS_APIS:
      return [];
    case LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID:
      return "";
    case LocalStorageKeys.CONTENT_PATH:
      return "";
    default:
      return null;
  }
}

export const useLocalStorage = <T extends any = undefined>(
  key: LocalStorageKeys,
  options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">,
  fallbackValue?: any
): UseQueryResult<T, Error> => {
  return useQuery({
    queryKey: ["local-storage", key],
    staleTime: 1,
    queryFn: async (): Promise<T> => {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value === null) {
          const resolved = fallbackValue ?? getDefaultForKey(key);
          return resolved as T;
        }
        if (value === "undefined") {
          const resolved = fallbackValue ?? getDefaultForKey(key);
          return resolved as T;
        }

        try {
          const parsed = JSON.parse(value) as T;
          return (parsed !== undefined && parsed !== null ? parsed : getDefaultForKey(key)) as T;
        } catch {
          return (value as T) ?? (getDefaultForKey(key) as T);
        }
      } catch (error) {
        console.error("Error reading from storage:", error);
        const resolved = fallbackValue ?? getDefaultForKey(key);
        return resolved as T;
      }
    },
    ...options,
  });
};

export const mutateLocalStorage = (key: LocalStorageKeys) => {
  return useMutation({
    mutationFn: (value: any) => {
      // If value is undefined, remove the item from storage
      if (value === undefined) {
        return AsyncStorage.removeItem(key);
      }

      const stringValue =
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
          ? String(value)
          : JSON.stringify(value);
      return AsyncStorage.setItem(key, stringValue);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["local-storage", key] });
      if (
        key === LocalStorageKeys.DIRECTUS_APIS ||
        key === LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID
      ) {
        queryClient.invalidateQueries({
          queryKey: ["resolved-active-session"],
        });
      }
    },
  });
};
