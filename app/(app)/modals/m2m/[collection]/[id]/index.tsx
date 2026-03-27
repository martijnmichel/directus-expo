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
import { CoreSchemaDocument } from "@/types/directus";
export default function Collection() {
  const { collection, id, uuid, junction_id, item_field } = useLocalSearchParams();
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
              submitType="raw"
              onSave={async (document) => {
                router.dismiss();
                console.log({ collection, id });
                EventBus.emit("m2m:update", {
                  collection: collection as keyof CoreSchema,
                  uuid: uuid as string,
                  junction_id: junction_id as string | number,
                  field: item_field as string,
                  data: document as CoreSchemaDocument,
                });
              }}
            />
          </Section>
        </Container>
      </KeyboardAwareScrollView>
    </KeyboardAwareLayout>
  );
}
