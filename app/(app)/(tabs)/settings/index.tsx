import { Button } from "@/components/display/button";
import { Text } from "@/components/display/typography";
import { Container } from "@/components/layout/Container";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/layout/Section";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeToggle } from "@/unistyles/useThemeToggle";
import { router } from "expo-router";
import { Horizontal, Vertical } from "@/components/layout/Stack";
import Constants from "expo-constants";
import { useServerHealth, useServerInfo } from "@/state/queries/directus/server";
import { DividerSubtitle } from "@/components/display/subtitle";
import { useTranslation } from "react-i18next";
import { ScrollView, Platform, View } from "react-native";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { ExternalLink } from "@/components/ExternalLink";
import { PushNotifications } from "@/components/settings/PushNotifications";
import { Switch } from "@/components/icons/Switch";
import { WidgetConfigSection } from "@/components/settings/WidgetConfigSection";
import { useResolvedActiveSession } from "@/hooks/useResolvedActiveSession";
import { Toggle } from "@/components/interfaces/toggle";
import { LocaleSelect } from "@/components/settings/locale-switch";
import { DirectusIcon, DirectusIconName } from "@/components/display/directus-icon";

export default function SettingsScreen() {
  const { logout, user } = useAuth();
  const { toggleTheme, currentTheme } = useThemeToggle();
  const { data: health } = useServerHealth();
  const { data: resolved } = useResolvedActiveSession();
  const api = resolved?.api;
  const { t } = useTranslation();

  const { isUpdateAvailable } = Updates.useUpdates();

  useEffect(() => {
    if (Platform.OS !== "web") {
      Updates.fetchUpdateAsync();
    }
  }, []);

  const info = [
    {
      label: t("settings.sections.server"),
      type: "heading",
      icon: "msDatabase",
    },
    { label: t("settings.fields.api"), value: api?.name },
    { label: t("settings.fields.url"), value: health?.serviceId },
    { label: t("settings.fields.status"), value: health?.status },
    { label: t("settings.fields.version"), value: health?.releaseId },
    {
      type: "component",
      component: (
        <Button
          variant="soft"
          onPress={() => router.push("/login")}
          leftIcon={<Switch />}
        >
          {t("settings.actions.switchSession")}
        </Button>
      ),
    },
    { type: "spacing" },
    {
      label: t("settings.sections.user"),
      type: "heading",
      icon: "verified_user",
    },
    { label: t("settings.fields.firstname"), value: user?.first_name },
    { label: t("settings.fields.lastname"), value: user?.last_name },
    { label: t("settings.fields.email"), value: user?.email },
    {
      type: "component",
      component: (
        <Button
          onPress={async () => {
            await logout();
            router.push("/login");
          }}
          leftIcon={<DirectusIcon name="logout" />}
          variant="soft"
          colorScheme="error"
        >
          {t("settings.actions.logout")}
        </Button>
      ),
    },
    { type: "spacing" },
    { label: t("push.title"), type: "push" },
    { type: "spacing" },
    { label: "Widgets", type: "widgets" },
    {
      label: t("settings.sections.options"),
      type: "heading",
      icon: "settings",
    },
    {
      type: "component",
      label: t("settings.fields.darkMode"),
      component: (
        <Toggle value={currentTheme === "dark"} onValueChange={toggleTheme} />
      ),
    },
    {
      type: "component",
      label: t("settings.fields.locale"),
      component: <LocaleSelect />,
    },
    { type: "spacing" },
    {
      label: t("settings.sections.app"),
      type: "heading",
      icon: "mobile_friendly",
    },
    {
      label: t("settings.fields.runtime"),
      value: Constants.expoConfig?.runtimeVersion?.toString(),
    },
    { label: t("settings.fields.version"), value: Constants.expoConfig?.version },
    {
      label: t("settings.fields.support"),
      type: "component",
      component: (
        <ExternalLink href="https://github.com/martijnmichel/directus-expo/issues">
          {t("settings.actions.reportIssue")}
        </ExternalLink>
      ),
    },
    {
      label: t("settings.fields.sponsorship"),
      type: "component",
      component: (
        <ExternalLink href="https://github.com/sponsors/martijnmichel">
          {t("settings.actions.becomeSponsor")}
        </ExternalLink>
      ),
    },
    ...(isUpdateAvailable
      ? [
          {
            type: "component",
            component: (
              <Button onPress={() => Updates.reloadAsync()}>
                {t("settings.actions.updateAvailable")}
              </Button>
            ),
          },
        ]
      : []),
    { type: "spacing" },
  ];

  return (
    <Layout>
      <ScrollView>
        <Container>
          <Section>
            <Vertical spacing="lg">
              <Vertical spacing="lg">
                {info.map((item: any, index: number) => {
                  switch (item.type) {
                    case "push":
                      return (
                        <View key={`push-${index}`}>
                          <PushNotifications />
                        </View>
                      );
                    case "widgets":
                      return (
                        <View key={`widgets-${index}`}>
                          <WidgetConfigSection />
                        </View>
                      );
                    case "heading":
                      return (
                        <DividerSubtitle
                          key={`heading-${index}`}
                          title={item.label!}
                          icon={item.icon as DirectusIconName}
                        />
                      );
                    case "spacing":
                      return <View key={`space-${index}`} style={{ height: 18 }} />;
                    case "component":
                      return (
                        <Horizontal
                          key={`component-${index}`}
                          style={{ alignItems: "center" }}
                        >
                          {item.label && (
                            <Text style={{ flex: 2 }}>{item.label}</Text>
                          )}
                          <View style={{ flex: 5 }}>{item.component}</View>
                        </Horizontal>
                      );
                    default:
                      return !!item.value ? (
                        <Horizontal key={`default-${index}`}>
                          <Text style={{ flex: 2 }}>{item.label}</Text>
                          <Text style={{ flex: 5 }}>{item.value}</Text>
                        </Horizontal>
                      ) : null;
                  }
                })}
              </Vertical>
            </Vertical>
          </Section>
        </Container>
      </ScrollView>
    </Layout>
  );
}

