import { Button } from "@/components/display/button";
import { H1, H2, H3, Text } from "@/components/display/typography";
import { Container } from "@/components/layout/Container";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/layout/Section";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeToggle } from "@/unistyles/useThemeToggle";
import { router } from "expo-router";
import { Moon } from "@/components/icons/Moon";
import { Sun } from "@/components/icons/Sun";
import { Horizontal, Vertical } from "@/components/layout/Stack";
import Constants from "expo-constants";
import {
  useServerHealth,
  useServerInfo,
} from "@/state/queries/directus/server";
import { APISelect } from "@/components/APISelect";
import { Divider } from "@/components/layout/divider";
import { useLocalStorage } from "@/state/local/useLocalStorage";
import { LocalStorageKeys } from "@/state/local/useLocalStorage";
import { API } from "@/components/APIForm";
import { Toggle } from "@/components/interfaces/toggle";
import { LocaleSelect } from "@/components/settings/locale-switch";
import {
  DirectusIcon,
  DirectusIconName,
} from "@/components/display/directus-icon";
import { Platform, View } from "react-native";
import { DividerSubtitle } from "@/components/display/subtitle";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { ExternalLink } from "@/components/ExternalLink";
export default function TabTwoScreen() {
  const { logout, user } = useAuth();
  const { toggleTheme, currentTheme } = useThemeToggle();
  const { data: serverInfo } = useServerInfo();
  const { data: health } = useServerHealth();
  const { directus } = useAuth();
  const { data: api } = useLocalStorage<API>(
    LocalStorageKeys.DIRECTUS_API_ACTIVE
  );

  const { t } = useTranslation();

  const { currentlyRunning, isUpdateAvailable, isUpdatePending } =
    Updates.useUpdates();

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
    {
      label: t("settings.fields.api"),
      value: api?.name,
    },
    {
      label: t("settings.fields.url"),
      value: health?.serviceId,
    },
    {
      label: t("settings.fields.status"),
      value: health?.status,
    },
    {
      label: t("settings.fields.version"),
      value: health?.releaseId,
    },
    {
      type: "spacing",
    },
    {
      label: t("settings.sections.user"),
      type: "heading",
      icon: "verified_user",
    },
    {
      label: t("settings.fields.firstname"),
      value: user?.first_name,
    },
    {
      label: t("settings.fields.lastname"),
      value: user?.last_name,
    },
    {
      label: t("settings.fields.email"),
      value: user?.email,
    },
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
    {
      type: "spacing",
    },
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

    {
      type: "spacing",
    },
    {
      label: t("settings.sections.app"),
      type: "heading",
      icon: "mobile_friendly",
    },
    {
      label: t("settings.fields.runtime"),
      value: Constants.expoConfig?.runtimeVersion?.toString(),
    },
    {
      label: t("settings.fields.version"),
      value: Constants.expoConfig?.version,
    },
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
    {
      type: "spacing",
    },
  ];

  return (
    <Layout>
      <ScrollView>
        <Container>
          <Section>
            <Vertical spacing="lg">
              <Vertical spacing="lg">
                {info.map((item, index) => {
                  switch (item.type) {
                    case "heading":
                      return (
                        <DividerSubtitle
                          key={`heading-${index}`}
                          title={item.label!}
                          icon={item.icon as DirectusIconName}
                        />
                      );
                    case "spacing":
                      return (
                        <View key={`space-${index}`} style={{ height: 18 }} />
                      );
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
