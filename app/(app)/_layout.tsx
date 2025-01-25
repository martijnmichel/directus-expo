import { Text } from "@/components/display/typography";
import { Center } from "@/components/layout/Center";
import { useAuth } from "@/contexts/AuthContext";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import { Redirect, Slot, Stack, Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const headerStyle = useHeaderStyles();
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
        name="modals/repeater"
        options={{ presentation: "modal", headerShown: false }}
      />
    </Stack>
  );
}
