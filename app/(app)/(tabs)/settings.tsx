import { Button } from "@/components/display/button";
import { H1 } from "@/components/display/typography";
import { Container } from "@/components/layout/Container";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/layout/Section";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeToggle } from "@/unistyles/useThemeToggle";
import { router } from "expo-router";
import { Moon } from "@/components/icons/Moon";
import { Sun } from "@/components/icons/Sun";
import { Toggle } from "@/components/form/toggle";
import { Vertical } from "@/components/layout/Stack";

export default function TabTwoScreen() {
  const { logout } = useAuth();
  const { toggleTheme, currentTheme } = useThemeToggle();
  return (
    <Layout>
      <Container>
        <Section>
          <Vertical spacing="xl">
            <Button
              onPress={async () => {
                await logout();
                router.push("/login");
              }}
            >
              Logout
            </Button>

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
