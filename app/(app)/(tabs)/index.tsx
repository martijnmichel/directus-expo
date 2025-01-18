import { H1 } from "@/components/display/typography";
import CollectionLayout from "@/components/layout/CollectionLayout";
import { Container } from "@/components/layout/Container";
import { Layout } from "@/components/layout/Layout";
import { PortalOutlet } from "@/components/layout/Portal";
import { Section } from "@/components/layout/Section";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function Home() {
  return (
    <CollectionLayout>
      <Stack.Screen
        options={{
          headerTitle: "Dashboard",
          headerShown: true,
        }}
      />
      <Layout>
        <Container>
          <Section>
            <H1>Dash</H1>
          </Section>
        </Container>
      </Layout>
    </CollectionLayout>
  );
}
