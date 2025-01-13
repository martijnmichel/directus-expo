import { usePathname } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useTrackPath() {
  const pathname = usePathname();

  useEffect(() => {
    // Save to AsyncStorage
    const savePath = async () => {
      try {
        await AsyncStorage.setItem("last_path", pathname);
      } catch (error) {
        console.error("Error saving path:", error);
      }
    };

    savePath();
  }, [pathname]);

  return { pathname };
}

export function useTrackedPath() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<string>("");

  useEffect(() => {
    const loadInitialPath = async () => {
      try {
        const savedPath = await AsyncStorage.getItem("last_path");
        if (savedPath) {
          setPage(savedPath);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading initial path:", error);
      }
    };

    loadInitialPath();
  }, []);

  return { page, loading };
}
