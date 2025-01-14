import { mutateLocalStorage } from "@/state/local/useLocalStorage";
import { UnistylesRuntime, useStyles } from "react-native-unistyles";

export const useThemeToggle = () => {
  const { mutate: setTheme } = mutateLocalStorage("@app-settings");
  const currentTheme = UnistylesRuntime.themeName;
  const toggleTheme = async () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    UnistylesRuntime.setTheme(newTheme);
    setTheme({ theme: newTheme });
  };

  return { toggleTheme, currentTheme };
};
