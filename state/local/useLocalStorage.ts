import { queryClient } from "@/app/_layout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, UseQueryResult } from "@tanstack/react-query";

export enum LocalStorageKeys {
  APP_SETTINGS = "@app-settings",
  DIRECTUS_APIS = "@directus-apis",
  DIRECTUS_API_ACTIVE = "@directus-api-active",
  CONTENT_PATH = "@content-path",
}

export const useLocalStorage = <T extends any = undefined>(
  key: LocalStorageKeys,
  fallbackValue?: any
): UseQueryResult<T, Error> => {
  return useQuery({
    queryKey: ["local-storage", key],
    staleTime: 1,
    queryFn: async () => {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value === null) return fallbackValue;
        if (value === "undefined") return undefined;

        try {
          return JSON.parse(value) as T;
        } catch {
          // If JSON parsing fails, return the raw value
          return value as T;
        }
      } catch (error) {
        console.error("Error reading from storage:", error);
        return fallbackValue;
      }
    },
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
    },
  });
};
