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
import { useTrackedPath, useTrackPath } from "@/hooks/useTrackPath";
import { Pressable } from "react-native";
import { DirectusIcon } from "@/components/display/directus-icon";
export default function TabsLayout() {
  const { t } = useTranslation();
  const { styles } = useStyles(stylesheet);
  const { isAuthenticated, isLoading, user } = useAuth();
  const { theme } = useStyles();
  const { bottom } = useSafeAreaInsets();
  const { data } = useTrackedPath();
  const router = useRouter();

  useTrackPath();

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
        {/**<Pressable
          style={[styles.item, { paddingBottom: bottom }]}
          onPress={() => {
            router.push(data || "/");
          }}
        >
          <Home size={24} color={theme.colors.textPrimary} />
          <Text>Content</Text>
        </Pressable> */}

        <TabTrigger
          style={[styles.item, { paddingBottom: bottom }]}
          name="content"
          href="/"
        >
          <Cube size={32} color={"white"} />
          <Text style={{ color: "white" }}>{t("components.tabs.content")}</Text>
        </TabTrigger>

        <TabTrigger
          style={[styles.item, { paddingBottom: bottom }]}
          name="files"
          href="/files"
        >
          <DirectusIcon name="image" size={32} color={"white"} />
          <Text style={{ color: "white" }}>{t("components.tabs.gallery")}</Text>
        </TabTrigger>
        <TabTrigger
          style={[styles.item, { paddingBottom: bottom }]}
          name="settings"
          href="/settings"
        >
          <Cog size={32} color={"white"} />
          <Text style={{ color: "white" }}>
            {t("components.tabs.settings")}
          </Text>
        </TabTrigger>

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
    backgroundColor: theme.colors.backgroundInvert,
  },
  item: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
    color: "white",
  },
  icon: {
    width: 24,
    height: 24,
  },
}));
