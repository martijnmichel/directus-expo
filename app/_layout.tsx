import { Redirect, Slot, Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { UnistylesRegistry, useInitialTheme } from "react-native-unistyles";
import { lightTheme, darkTheme } from "@/unistyles/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { breakpoints } from "@/unistyles/theme";
import { PortalProvider } from "@/components/layout/Portal";
import { useLocalStorage } from "@/state/local/useLocalStorage";

const queryClient = new QueryClient();

// Register your breakpoints
UnistylesRegistry.addBreakpoints(breakpoints).addThemes({
  light: lightTheme,
  dark: darkTheme,
});

export default function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <Preload>
          <AuthProvider>
            <PortalProvider>
              <Slot />
            </PortalProvider>
          </AuthProvider>
        </Preload>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

const Preload = ({ children }: { children: React.ReactNode }) => {
  const { data, isLoading } = useLocalStorage("@app-settings");

  console.log("theme", data?.theme);
  UnistylesRegistry.addConfig({
    initialTheme: data?.theme ?? "light",
  });
  return children;
};
