import { View, Text, StyleSheet } from "react-native";
import { Layout } from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { H1 } from "@/components/display/typography";
import UserCollections from "@/components/content/UserCollections";
import { Stack, useLocalSearchParams } from "expo-router";
import { DocumentEditor } from "@/components/content/DocumentEditor";
import { map } from "lodash";
import { CoreSchema } from "@directus/sdk";
export default function Collection() {
  const { collection, id } = useLocalSearchParams();

  return (
    <Layout>
      <Stack.Screen
        options={{ headerTitle: collection as string, presentation: "modal" }}
      />
      <Container>
        <Section>
          <H1>{collection}</H1>
          <DocumentEditor
            collection={collection as keyof CoreSchema}
            id={Number(id)}
          />
        </Section>
      </Container>
    </Layout>
  );
}
