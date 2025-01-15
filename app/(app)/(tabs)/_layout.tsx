import { Cube } from "@/components/icons";
import { Cog } from "@/components/icons/Cog";
import { Users } from "@/components/icons/Users";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
export default function TabsLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const headerStyles = useHeaderStyles();

  // Add loading check
  if (isLoading) {
    return null; // or return a loading spinner
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs screenOptions={{}}>
      <Tabs.Screen
        name="index"
        options={{
          title: t("navigation.content"),
          ...headerStyles,
          tabBarIcon: ({ color, size }) => <Cube size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("navigation.users"),
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          ...headerStyles,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("navigation.settings"),
          tabBarIcon: ({ color, size }) => <Cog size={size} color={color} />,
          ...headerStyles,
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          headerShown: false,
          href: null,
          ...headerStyles,
        }}
      />

      <Tabs.Screen
        name="content/[collection]/index"
        options={{
          href: null,
          ...headerStyles,
        }}
      />
      <Tabs.Screen
        name="content/[collection]/[id]/index"
        options={{
          href: null,
          ...headerStyles,
        }}
      />
    </Tabs>
  );
}
