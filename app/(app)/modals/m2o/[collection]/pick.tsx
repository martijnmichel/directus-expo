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
import { FloatingToolbar } from "@/components/display/floating-toolbar";
import { Pagination } from "@/components/content/filters/pagination";
import { SearchFilter } from "@/components/content/filters/search-filter-modal";
import { useCollectionTableFields } from "@/hooks/useCollectionTableFields";

type PickModalParams = {
  collection: keyof CoreSchema;
  field: string;
  value: string;
};

export default function Collection() {
  const { data, collection } = useLocalSearchParams();
  const { field, value, filter } = base64ToObject(data as string);

  const { data: fields } = useFields(collection as keyof CoreSchema);

  const { data: presets } = usePresets();

  const pagination = useDocumentsFilters();
  const { page, limit, search } = pagination;
  const preset = presets?.find((p) => p.collection === collection);

  const { directus } = useAuth();
  const { data: options, refetch } = useDocuments(
    collection as keyof CoreSchema,
    {
      fields: [`*`],
      filter,
      page,
      limit,
      search,
    }
  );

  const tableFields = useCollectionTableFields({
    collection: collection as keyof CoreSchema,
    documents: options?.items,
  });
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
      <Table
        headers={reduce(
          tableFields,
          (prev, curr) => ({ ...prev, [curr]: label(curr) || "" }),
          {}
        )}
        toolbarItems={
          <>
            <Pagination {...pagination} total={options?.total || 0} />
            <SearchFilter {...pagination} />
          </>
        }
        fields={tableFields}
        items={(options?.items as Record<string, unknown>[]) || []}
        widths={preset?.layout_options?.tabular?.widths}
        renderRow={(doc) =>
          map(tableFields, (f) => doc[f] as number | string | null)
        }
        onRowPress={(doc) => {
          router.dismiss();
          EventBus.emit("m2o:pick", {
            data: doc as CoreSchemaDocument,
            field: field as string,
          });
        }}
      />
    </Layout>
  );
}
