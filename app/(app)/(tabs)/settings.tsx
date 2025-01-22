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
import { useServerInfo } from "@/state/queries/directus/server";
import { APISelect } from "@/components/APISelect";
import { Divider } from "@/components/layout/divider";
import { useLocalStorage } from "@/state/local/useLocalStorage";
import { LocalStorageKeys } from "@/state/local/useLocalStorage";
import { API } from "@/components/APIForm";
import { Toggle } from "@/components/interfaces/toggle";
import { LocaleSelect } from "@/components/settings/locale-switch";
import { DirectusIcon } from "@/components/display/directus-icon";
import { View } from "react-native";

export default function TabTwoScreen() {
  const { logout, user } = useAuth();
  const { toggleTheme, currentTheme } = useThemeToggle();
  const { data: serverInfo } = useServerInfo();
  const { directus } = useAuth();
  const { data: api } = useLocalStorage<API>(
    LocalStorageKeys.DIRECTUS_API_ACTIVE
  );

  const info = [
    {
      label: "Server",
      type: "heading",
      icon: <DirectusIcon name="msDatabase" />,
    },
    {
      label: "API",
      value: api?.name,
    },
    {
      label: "URL",
      value: directus?.url.origin,
    },
    {
      type: "spacing",
    },
    {
      label: "User",
      type: "heading",
      icon: <DirectusIcon name="verified_user" />,
    },
    {
      label: "Username",
      value: user?.first_name,
    },
    {
      label: "Email",
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
          variant="danger"
        >
          Logout
        </Button>
      ),
    },
    {
      type: "spacing",
    },
    {
      label: "Options",
      type: "heading",
      icon: <DirectusIcon name="settings" />,
    },
    {
      type: "component",
      label: "Locale",
      component: <LocaleSelect />,
    },
    {
      type: "component",
      label: "Dark Mode",
      component: (
        <Toggle value={currentTheme === "dark"} onValueChange={toggleTheme} />
      ),
    },
  ];

  return (
    <Layout>
      <Container>
        <Section>
          <Vertical spacing="lg">
            <Vertical spacing="lg">
              {info.map((item, index) => {
                switch (item.type) {
                  case "heading":
                    return (
                      <Vertical key={item.label} spacing="xs">
                        <Horizontal>
                          {item.icon}
                          <H3>{item.label}</H3>
                        </Horizontal>
                        <Divider />
                      </Vertical>
                    );
                  case "spacing":
                    return (
                      <View key={`space-${index}`} style={{ height: 18 }} />
                    );
                  case "component":
                    return (
                      <Horizontal
                        key={item.label}
                        style={{ alignItems: "center" }}
                      >
                        {item.label && (
                          <Text style={{ flex: 1 }}>{item.label}</Text>
                        )}
                        <View style={{ flex: 3 }}>{item.component}</View>
                      </Horizontal>
                    );
                  default:
                    return (
                      <Horizontal key={item.label}>
                        <Text style={{ flex: 1 }}>{item.label}</Text>
                        <Text style={{ flex: 3 }}>{item.value}</Text>
                      </Horizontal>
                    );
                }
              })}
            </Vertical>
          </Vertical>
        </Section>
      </Container>
    </Layout>
  );
}
