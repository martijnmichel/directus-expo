import { Redirect, Slot, Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { UnistylesRegistry, useInitialTheme } from "react-native-unistyles";
import { lightTheme, darkTheme } from "@/unistyles/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider, useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { breakpoints } from "@/unistyles/theme";
import { PortalHost, PortalProvider } from "@/components/layout/Portal";
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
import Toast from "react-native-toast-message";
import { DateUtils } from "@/utils/dayjs";
import { useEffect } from "react";
import { EventProvider } from "react-native-outside-press";
import { OTAUpdate } from "@/components/OTAUpdate";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
// Register your breakpoints
UnistylesRegistry.addBreakpoints(breakpoints).addThemes({
  light: lightTheme,
  dark: darkTheme,
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <Preload>
            <ConfirmDialogProvider>
              <AuthProvider>
                <PortalProvider>
                  <EventProvider>
                    <Slot />
                  </EventProvider>
                  <Toast />
                  <OTAUpdate />
                </PortalProvider>
              </AuthProvider>
            </ConfirmDialogProvider>
          </Preload>
        </QueryClientProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}

const Preload = ({ children }: { children: React.ReactNode }) => {
  const { data, isLoading, refetch } = useLocalStorage<AppSettings>(
    LocalStorageKeys.APP_SETTINGS,
    {
      enabled: false,
    }
  );

  const { i18n } = useTranslation();

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (data?.locale && !i18n.initializedLanguageOnce) {
      i18n.changeLanguage(data.locale);
      DateUtils.setLocale(data?.locale ?? "en");
    }
  }, [data?.locale]);

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

  if (!fontsLoaded || isLoading) {
    return null;
  }

  UnistylesRegistry.addConfig({
    initialTheme: data?.theme ?? "light",
  });

  return children;
};
