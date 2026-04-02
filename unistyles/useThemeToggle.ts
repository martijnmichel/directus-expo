import {
  LocalStorageKeys,
  mutateLocalStorage,
} from "@/state/local/useLocalStorage";
import { setStatusBarStyle } from "expo-status-bar";
import { UnistylesRuntime, useStyles } from "react-native-unistyles";

export const useThemeToggle = () => {
  const { mutate: setTheme } = mutateLocalStorage(
    LocalStorageKeys.APP_SETTINGS
  );
  const currentTheme = UnistylesRuntime.themeName;
  setStatusBarStyle(currentTheme === "dark" ? "light" : "dark");
  const toggleTheme = async () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    UnistylesRuntime.setTheme(newTheme);
    setTheme({ theme: newTheme });
  };

  return { toggleTheme, currentTheme };
};
