import { Button } from "@/components/display/button";
import { H1 } from "@/components/display/typography";
import { Container } from "@/components/layout/Container";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/layout/Section";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
export default function TabTwoScreen() {
  const { logout } = useAuth();
  return (
    <Layout>
      <Container>
        <Section>
          <Button
            onPress={async () => {
              await logout();
              router.push("/login");
            }}
          >
            Logout
          </Button>
        </Section>
      </Container>
    </Layout>
  );
}
