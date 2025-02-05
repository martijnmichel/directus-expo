import { Cube, Home } from "@/components/icons";
import { Cog } from "@/components/icons/Cog";
import { Users } from "@/components/icons/Users";
import { useAuth } from "@/contexts/AuthContext";
import { Link, Redirect, Tabs, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import { Text } from "@/components/display/typography";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Pressable } from "react-native";
import { DirectusIcon } from "@/components/display/directus-icon";
import { Folder } from "@/components/icons/Folder";
export default function TabsLayout() {
  const { t } = useTranslation();
  const { styles } = useStyles(stylesheet);
  const { isAuthenticated, isLoading, user } = useAuth();
  const { theme } = useStyles();
  const { bottom } = useSafeAreaInsets();

  const router = useRouter();

  // Add loading check
  if (isLoading) {
    return null; // or return a loading spinner
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.8)",
        popToTopOnBlur: true,
        headerShown: false,

        tabBarIconStyle: {
          height: 36,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          color: "rgba(255, 255, 255, 0.8)",
        },
        tabBarStyle: {
          backgroundColor: theme.colors.backgroundInvert,
          borderTopWidth: 0,
          height: 60 + bottom,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("components.tabs.content"),
          tabBarIcon: ({ color }) => <Cube size={32} color={color} />,
        }}
      />
      <Tabs.Screen
        name="files"
        options={{
          title: t("components.tabs.files"),
          tabBarIcon: ({ color }) => <Folder size={32} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("components.tabs.settings"),
          tabBarIcon: ({ color }) => <Cog size={32} color={color} />,
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  tabBar: {
    backgroundColor: theme.colors.backgroundInvert,
    height: 98,
  },
  item: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingTop: 16,
    paddingBottom: 12,
    color: "white",
  },
  icon: {
    width: 24,
    height: 24,
  },
}));
