import { Text } from "@/components/display/typography";
import { Center } from "@/components/layout/Center";
import { PortalProvider } from "@/components/layout/Portal";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import { Redirect, Slot, Stack, Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";
import { UnistylesRuntime, useStyles } from "react-native-unistyles";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  // Add loading check
  if (isLoading) {
    return (
      <Center>
        <ActivityIndicator size="large" />
        <Text>{t("components.loading.text")}</Text>
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="modals/m2m"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="modals/m2o"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="modals/o2m"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="modals/repeater"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="modals/files"
        options={{ presentation: "modal", headerShown: false }}
      />
    </Stack>
  );
}
