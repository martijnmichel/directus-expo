import { View, Text, StyleSheet, ScrollView } from "react-native";
import {
  KeyboardAwareLayout,
  KeyboardAwareScrollView,
  Layout,
} from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Stack, useLocalSearchParams } from "expo-router";
import { DocumentEditor } from "@/components/content/DocumentEditor";
import { map } from "lodash";
import { CoreSchema, readItem } from "@directus/sdk";
import { useDocumentDisplayTemplate } from "@/hooks/useDocumentDisplayTemplate";
import { useCollection } from "@/state/queries/directus/collection";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
export default function AddDocument() {
  const { collection } = useLocalSearchParams();
  const { data } = useCollection(collection as keyof CoreSchema);

  const headerTitle = useDocumentDisplayTemplate({
    collection: collection as keyof CoreSchema,
    docId: "+",
    template: data?.meta.display_template || "",
  });

  const headerStyles = useHeaderStyles();

  return (
    <KeyboardAwareLayout>
      <Stack.Screen
        options={{
          headerTitle,
          ...headerStyles,
        }}
      />
      <KeyboardAwareScrollView>
        <Container>
          <Section>
            <DocumentEditor
              collection={collection as keyof CoreSchema}
              id="+"
            />
          </Section>
        </Container>
      </KeyboardAwareScrollView>
    </KeyboardAwareLayout>
  );
}
