import { View, Text, StyleSheet, ScrollView } from "react-native";
import {
  KeyboardAwareLayout,
  KeyboardAwareScrollView,
  Layout,
} from "@/components/layout/Layout";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import {
  router,
  Stack,
  useLocalSearchParams,
  useNavigation,
  usePathname,
} from "expo-router";
import { DocumentEditor } from "@/components/content/DocumentEditor";
import { map } from "lodash";
import { CoreSchema, createItem, readItem } from "@directus/sdk";
import { useDocumentDisplayTemplate } from "@/hooks/useDocumentDisplayTemplate";
import {
  useCollection,
  useDocument,
} from "@/state/queries/directus/collection";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import { EventBus } from "@/utils/mitt";
import { usePrimaryKey } from "@/hooks/usePrimaryKey";
export default function Collection() {
  const { collection, id, uuid } = useLocalSearchParams();
  const { data } = useCollection(collection as keyof CoreSchema);
  const path = usePathname();
  const headerTitle = useDocumentDisplayTemplate({
    collection: collection as keyof CoreSchema,
    docId: id as string,
    template: data?.meta.display_template || "",
  });

  const primaryKey = usePrimaryKey(collection as keyof CoreSchema);

  const headerStyles = useHeaderStyles({ isModal: true });

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
                router.dismiss();
                console.log({ collection, id });
                EventBus.emit("m2a:update", {
                  collection: collection as keyof CoreSchema,
                  docId: document[primaryKey as any] as string,
                  uuid: uuid as string,
                });
              }}
            />
          </Section>
        </Container>
      </KeyboardAwareScrollView>
    </KeyboardAwareLayout>
  );
}
