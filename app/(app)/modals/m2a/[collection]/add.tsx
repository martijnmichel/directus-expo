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
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  usePathname,
} from "expo-router";
import { DocumentEditor } from "@/components/content/DocumentEditor";
import { map } from "lodash";
import { CoreSchema, createItem, readItem } from "@directus/sdk";
import { useDocumentDisplayTemplate } from "@/hooks/useDocumentDisplayTemplate";
import { useCollection } from "@/state/queries/directus/collection";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import EventBus from "@/utils/mitt";
import { useAuth } from "@/contexts/AuthContext";
import { CoreSchemaDocument } from "@/types/directus";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect } from "react";
export default function Collection() {
  const { collection, item_field } = useLocalSearchParams();
  const id = "+";
  const { data } = useCollection(collection as keyof CoreSchema);
  const path = usePathname();
  const headerTitle = useDocumentDisplayTemplate({
    collection: collection as keyof CoreSchema,
    docId: id as string,
    template: data?.meta.display_template || "",
  });
  const { directus } = useAuth();

  const headerStyle = useHeaderStyles({ isModal: true });
  const { t } = useTranslation();

  return (
    <KeyboardAwareLayout>
      <Stack.Screen
        key={`${path}-${collection}-${id}`}
        getId={() => `${path}-${collection}-${id}`}
        options={{
          headerTitle,

          ...headerStyle,
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
                EventBus.emit("m2a:add", {
                  data: document as CoreSchemaDocument,
                  field: item_field as string,
                  collection: collection as keyof CoreSchema,
                });
              }}
            />
          </Section>
        </Container>
      </KeyboardAwareScrollView>
    </KeyboardAwareLayout>
  );
}
