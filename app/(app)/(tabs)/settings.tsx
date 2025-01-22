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
  ];

  return (
    <Layout>
      <Container>
        <Section>
          <Vertical spacing="xl">
            <Vertical>
              {info.map((item) =>
                item.type === "heading" ? (
                  <Vertical style={{ marginTop: 16 }}>
                    <Horizontal>
                      {item.icon}
                      <H3>{item.label}</H3>
                    </Horizontal>
                    <Divider />
                  </Vertical>
                ) : (
                  <Horizontal>
                    <Text style={{ flex: 1 }}>{item.label}</Text>
                    <Text style={{ flex: 3 }}>{item.value}</Text>
                  </Horizontal>
                )
              )}
            </Vertical>

            <Button
              onPress={async () => {
                await logout();
                router.push("/login");
              }}
            >
              Logout
            </Button>
          </Vertical>
        </Section>
        <Divider />
        <Section>
          <Vertical>
            <H3>Options</H3>
            <LocaleSelect />
            <Toggle
              value={currentTheme === "dark"}
              label="Dark Mode"
              onValueChange={toggleTheme}
            />
          </Vertical>
        </Section>
      </Container>
    </Layout>
  );
}
