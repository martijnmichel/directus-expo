import { Center } from "@/components/layout/Center";
import { Text } from "@/components/display/typography";
import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

export default function DeepLinkLoadingScreen() {
  const { styles, theme } = useStyles(stylesheet);
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    collection?: string;
    switching?: string;
    server?: string;
    account?: string;
  }>();
  const switching = params.switching === "1";
  const collection = typeof params.collection === "string" ? params.collection : "";
  const server = typeof params.server === "string" ? params.server : "";
  const account = typeof params.account === "string" ? params.account : "";

  const title = switching
    ? t("pages.deeplinkLoading.titleSwitching")
    : t("pages.deeplinkLoading.titleOpening");
  const subtitle = switching
    ? t("pages.deeplinkLoading.subtitleSwitching")
    : t("pages.deeplinkLoading.subtitleOpening");
  const detail = collection.trim()
    ? t("pages.deeplinkLoading.detailCollection", { collection })
    : t("pages.deeplinkLoading.detailMoment");
  const switchTarget = server.trim()
    ? t("pages.deeplinkLoading.switchTarget", {
        account: account.trim() || t("pages.deeplinkLoading.accountFallback"),
        server,
      })
    : null;

  return (
    <Center style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.spinnerWrap}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Text style={styles.detail}>{detail}</Text>
      {switchTarget ? <Text style={styles.detail}>{switchTarget}</Text> : null}
    </Center>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    gap: 12,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.background,
  },
  spinnerWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    textAlign: "center",
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: theme.colors.textSecondary,
  },
  detail: {
    fontSize: 12,
    textAlign: "center",
    color: theme.colors.textTertiary,
  },
}));
