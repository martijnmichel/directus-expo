import { View, Text, StyleSheet, ScrollView } from "react-native";
import {
  KeyboardAwareLayout,
  KeyboardAwareScrollView,
  Layout,
} from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { H1 } from "@/components/display/typography";
import UserCollections from "@/components/content/UserCollections";
import {
  router,
  Stack,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import { DocumentEditor } from "@/components/content/DocumentEditor";
import { map } from "lodash";
import { CoreSchema, createItem, readItem } from "@directus/sdk";
import { useDocumentDisplayTemplate } from "@/hooks/useDocumentDisplayTemplate";
import { useCollection } from "@/state/queries/directus/collection";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import EventBus from "@/utils/mitt";
import { useAuth } from "@/contexts/AuthContext";
import { mutateDocument } from "@/state/actions/mutateItem";
export default function Collection() {
  const { collection, id, junction_collection, related_field } =
    useLocalSearchParams();
  const { data } = useCollection(collection as keyof CoreSchema);
  const navigation = useNavigation();
  const headerTitle = useDocumentDisplayTemplate({
    collection: collection as keyof CoreSchema,
    docId: id as string,
    template: data?.meta.display_template || "",
  });
  const { directus } = useAuth();
  const { mutate } = mutateDocument(
    junction_collection as keyof CoreSchema,
    id as string
  );

  const headerStyles = useHeaderStyles();

  return (
    <KeyboardAwareLayout>
      <Stack.Screen
        options={{
          headerTitle,
          ...headerStyles,
          presentation: "modal",
        }}
      />
      <KeyboardAwareScrollView>
        <Container>
          <Section>
            <DocumentEditor
              collection={collection as keyof CoreSchema}
              id={id as string}
              onSave={async (document) => {
                const data = {
                  [related_field as string]: document.id as number,
                };
                mutate(data, {
                  onSuccess: (newData) => {
                    router.dismiss();
                    EventBus.emit("m2m:add", {
                      data: newData,
                      field: related_field,
                    });
                  },
                });
              }}
            />
          </Section>
        </Container>
      </KeyboardAwareScrollView>
    </KeyboardAwareLayout>
  );
}
