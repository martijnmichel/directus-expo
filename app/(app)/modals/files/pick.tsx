import { View, Text, StyleSheet, ScrollView } from "react-native";
import {
  KeyboardAwareLayout,
  KeyboardAwareScrollView,
  Layout,
} from "@/components/layout/Layout";
import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import { DocumentEditor } from "@/components/content/DocumentEditor";
import { map, reduce } from "lodash";
import { CoreSchema, createItem, readItem, readItems } from "@directus/sdk";
import { useDocumentDisplayTemplate } from "@/hooks/useDocumentDisplayTemplate";
import {
  useCollection,
  useDocuments,
  useFields,
  usePresets,
} from "@/state/queries/directus/collection";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import EventBus from "@/utils/mitt";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Table } from "@/components/display/table";
import { useFieldMeta } from "@/helpers/document/fieldLabel";
import { CoreSchemaDocument } from "@/types/directus";
import { Container } from "@/components/layout/Container";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { base64ToObject } from "@/helpers/document/docToBase64";
import { useDocumentsFilters } from "@/hooks/useDocumentsFilters";
import {
  FloatingToolbar,
  FloatingToolbarHost,
} from "@/components/display/floating-toolbar";
import { FileSelect } from "@/components/interfaces/file-select";

type PickFileModalParams = {
  multiple?: boolean;
  field: string;
};

export default function Collection() {
  const collection = "directus_files";
  const { data } = useLocalSearchParams();
  const { field, multiple } = base64ToObject<PickFileModalParams>(
    data as string
  );

  const headerStyles = useHeaderStyles({ isModal: true });
  const { label } = useFieldMeta(collection as keyof CoreSchema);
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <Layout safeArea={false}>
      <Stack.Screen
        options={{
          headerTitle: t("pages.modals.m2m.pick"),
          ...headerStyles,
          presentation: "modal",
        }}
      />
      <ScrollView>
        <Container>
          <FileSelect
            multiple={multiple}
            onSelect={(data) => {
              router.dismiss();

              requestAnimationFrame(() => {
                EventBus.emit("file:pick", {
                  data,
                  multiple: multiple || false,
                  field: field as string,
                });
              });
            }}
          />
          <View style={{ height: 80 }} />
        </Container>
      </ScrollView>
      <FloatingToolbarHost />
    </Layout>
  );
}
