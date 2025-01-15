import { usePathname } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  mutateLocalStorage,
  useLocalStorage,
} from "@/state/local/useLocalStorage";
import { LocalStorageKeys } from "@/state/local/useLocalStorage";
import { queryClient } from "@/app/_layout";

export function useTrackPath() {
  const pathname = usePathname();
  const { data } = useLocalStorage<string>(LocalStorageKeys.CONTENT_PATH);
  const { mutate: setContentPath } = mutateLocalStorage(
    LocalStorageKeys.CONTENT_PATH
  );

  useEffect(() => {
    if (pathname.startsWith("/content/")) {
      setContentPath(pathname, {
        onSuccess: () =>
          queryClient.invalidateQueries({
            queryKey: ["local-storage", LocalStorageKeys.CONTENT_PATH],
          }),
      });
    }
  }, [pathname]);

  return { pathname };
}

export const useTrackedPath = () =>
  useLocalStorage(LocalStorageKeys.CONTENT_PATH);
