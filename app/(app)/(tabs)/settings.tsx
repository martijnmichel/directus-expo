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

export default function TabTwoScreen() {
  const { logout, user } = useAuth();
  const { toggleTheme, currentTheme } = useThemeToggle();
  const { data: serverInfo } = useServerInfo();
  const { data: api } = useLocalStorage<API>(
    LocalStorageKeys.DIRECTUS_API_ACTIVE
  );
  return (
    <Layout>
      <Container>
        <Section>
          <Vertical spacing="xl">
            <H3>User & Server</H3>
            <Vertical>
              <Horizontal>
                <Text style={{ flex: 1 }}>API </Text>
                <Text style={{ flex: 3 }}>
                  {api?.name} ({api?.url})
                </Text>
              </Horizontal>

              <Horizontal>
                <Text style={{ flex: 1 }}>Name</Text>
                <Text style={{ flex: 3 }}>
                  {user?.first_name} {user?.last_name}
                </Text>
              </Horizontal>

              <Horizontal>
                <Text style={{ flex: 1 }}>Email</Text>
                <Text style={{ flex: 3 }}>{user?.email}</Text>
              </Horizontal>
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
