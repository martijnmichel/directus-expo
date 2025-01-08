import { useEffect } from "react";
import { Redirect, Slot, Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { UnistylesRegistry } from "react-native-unistyles";
import { lightTheme, darkTheme } from "@/unistyles/theme";

// Register your themes
UnistylesRegistry.addThemes({
  light: lightTheme,
  dark: darkTheme,
}).addConfig({
  initialTheme: "light",
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
