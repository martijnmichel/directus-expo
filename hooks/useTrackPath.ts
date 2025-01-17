import { RelativePathString, usePathname } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  mutateLocalStorage,
  useLocalStorage,
} from "@/state/local/useLocalStorage";
import { LocalStorageKeys } from "@/state/local/useLocalStorage";
import { queryClient } from "@/utils/react-query";
import { useRouter } from "expo-router";

export type History = {
  paths: string[];
  current: string;
};

export function useTrackPath() {
  const pathname = usePathname();
  const { data } = useLocalStorage<History>(LocalStorageKeys.CONTENT_PATH);
  const { mutate: setContentPath } = mutateLocalStorage(
    LocalStorageKeys.CONTENT_PATH
  );

  useEffect(() => {
    if (
      pathname.startsWith("/content/") &&
      data?.current !== pathname &&
      !data?.paths.includes(pathname)
    ) {
      console.log("Adding to history:", {
        oldPaths: data?.paths || [],
        oldCurrent: data?.current,
        newPath: pathname,
      });

      setContentPath(
        {
          paths: data?.current
            ? [...(data?.paths || []), data.current]
            : data?.paths || [],
          current: pathname,
        },
        {
          onSuccess: () =>
            queryClient.invalidateQueries({
              queryKey: ["local-storage", LocalStorageKeys.CONTENT_PATH],
            }),
        }
      );
    }
  }, [pathname, data]);

  return { pathname };
}

export const useTrackedPath = () => {
  const { data } = useLocalStorage<History>(LocalStorageKeys.CONTENT_PATH);
  const router = useRouter();
  const { mutate: setContentPath } = mutateLocalStorage(
    LocalStorageKeys.CONTENT_PATH
  );

  const back = useCallback(
    (fallbackPath = "/content") => {
      if (!data?.paths.length) {
        router.push(fallbackPath as RelativePathString);
        return;
      }

      console.log("Going back:", {
        currentPaths: data.paths,
        currentCurrent: data.current,
      });

      const previousPath = data.paths[data.paths.length - 1];
      const remainingPaths = data.paths.slice(0, -1);

      setContentPath({
        paths: remainingPaths,
        current: previousPath,
      });

      router.push(previousPath as RelativePathString);
    },
    [data?.paths, router, setContentPath]
  );

  return { data, back };
};
