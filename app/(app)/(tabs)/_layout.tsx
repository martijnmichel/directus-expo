import { Cube, Home } from "@/components/icons";
import { Cog } from "@/components/icons/Cog";
import { Users } from "@/components/icons/Users";
import { useAuth } from "@/contexts/AuthContext";
import { Link, Redirect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Tabs, TabList, TabTrigger, TabSlot } from "expo-router/ui";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import { Text } from "@/components/display/typography";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTrackedPath } from "@/hooks/useTrackPath";
import { Pressable } from "react-native";
export default function TabsLayout() {
  const { t } = useTranslation();
  const { styles } = useStyles(stylesheet);
  const { isAuthenticated, isLoading, user } = useAuth();
  const { theme } = useStyles();
  const { bottom } = useSafeAreaInsets();
  const { data } = useTrackedPath();
  const router = useRouter();
  // Add loading check
  if (isLoading) {
    return null; // or return a loading spinner
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs>
      <TabSlot />
      <TabList style={styles.tabBar}>
        <Pressable
          style={[styles.item, { paddingBottom: bottom }]}
          onPress={() => {
            router.push(data || "/");
          }}
        >
          <Home size={24} color={theme.colors.textPrimary} />
          <Text>Content</Text>
        </Pressable>
        <TabTrigger
          style={[styles.item, { paddingBottom: bottom }]}
          name="profile"
          href="/profile"
        >
          <Users size={24} color={theme.colors.textPrimary} />
          <Text>Profile</Text>
        </TabTrigger>
        <TabTrigger
          style={[styles.item, { paddingBottom: bottom }]}
          name="settings"
          href="/settings"
        >
          <Cog size={24} color={theme.colors.textPrimary} />
          <Text>Settings</Text>
        </TabTrigger>

        <TabTrigger
          style={[styles.item, { display: "none" }]}
          name="content"
          href="/"
        />

        <TabTrigger
          style={[styles.item, { display: "none" }]}
          name="collection"
          href="/content/[collection]"
        />
      </TabList>
    </Tabs>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  tabBar: {
    backgroundColor: theme.colors.background,
  },
  item: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
  },
  icon: {
    width: 24,
    height: 24,
  },
}));
