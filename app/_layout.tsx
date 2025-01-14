import { Redirect, Slot, Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { UnistylesRegistry } from "react-native-unistyles";
import { lightTheme, darkTheme } from "@/unistyles/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { breakpoints } from "@/unistyles/theme";
import { PortalProvider } from "@/components/layout/Portal";

const queryClient = new QueryClient();

// Register your breakpoints
UnistylesRegistry.addBreakpoints(breakpoints)
  .addThemes({
    light: lightTheme,
    dark: darkTheme,
  })
  .addConfig({
    initialTheme: "dark",
  });

export default function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <PortalProvider>
            <Slot />
          </PortalProvider>
        </QueryClientProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}
