import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Layout } from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { H1 } from "@/components/display/typography";
import UserCollections from "@/components/content/UserCollections";
import { Stack, useLocalSearchParams } from "expo-router";
import { DocumentEditor } from "@/components/content/DocumentEditor";
import { map } from "lodash";
import { CoreSchema, readItem } from "@directus/sdk";
import { useDocumentDisplayTemplate } from "@/hooks/useDocumentDisplayTemplate";
import { useCollection } from "@/state/queries/directus/collection";
export default function Collection() {
  const { collection, id } = useLocalSearchParams();
  const { data } = useCollection(collection as keyof CoreSchema);

  const headerTitle = useDocumentDisplayTemplate({
    collection: collection as keyof CoreSchema,
    docId: Number(id),
    template: data?.meta.display_template || "",
  });

  return (
    <Layout>
      <Stack.Screen
        options={{
          headerTitle,
          presentation: "modal",
        }}
      />
      <ScrollView>
        <Container>
          <Section>
            <DocumentEditor
              collection={collection as keyof CoreSchema}
              id={Number(id)}
            />
          </Section>
        </Container>
      </ScrollView>
    </Layout>
  );
}
