import { Redirect, Slot, Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { UnistylesRegistry, useInitialTheme } from "react-native-unistyles";
import { lightTheme, darkTheme } from "@/unistyles/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { breakpoints } from "@/unistyles/theme";
import { PortalProvider } from "@/components/layout/Portal";
import {
  LocalStorageKeys,
  useLocalStorage,
} from "@/state/local/useLocalStorage";
import { AppSettings } from "@/hooks/useAppSettings";
import { ConfirmDialogProvider } from "@/hooks/useConfirmDialog";
import {
  useFonts,
  Inter_100Thin,
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from "@expo-google-fonts/inter";
import { queryClient } from "@/utils/react-query";

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
          <ConfirmDialogProvider>
            <AuthProvider>
              <PortalProvider>
                <Slot />
              </PortalProvider>
            </AuthProvider>
          </ConfirmDialogProvider>
        </Preload>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

const Preload = ({ children }: { children: React.ReactNode }) => {
  const { data, isLoading } = useLocalStorage<AppSettings>(
    LocalStorageKeys.APP_SETTINGS
  );

  let [fontsLoaded] = useFonts({
    Inter_100Thin,
    Inter_200ExtraLight,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  if (!fontsLoaded) {
    return null;
  }

  UnistylesRegistry.addConfig({
    initialTheme: data?.theme ?? "light",
  });
  return children;
};
