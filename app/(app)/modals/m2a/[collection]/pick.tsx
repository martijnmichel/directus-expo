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
import { useEffect } from "react";
import { getPrimaryKey, usePrimaryKey } from "@/hooks/usePrimaryKey";
import { useDocumentsFilters } from "@/hooks/useDocumentsFilters";
import { FloatingToolbar } from "@/components/display/floating-toolbar";
import { Pagination } from "@/components/content/filters/pagination";
import { SearchFilter } from "@/components/content/filters/search-filter-modal";
import { Horizontal } from "@/components/layout/Stack";
import { useCollectionTableFields } from "@/hooks/useCollectionTableFields";
import { DataTableColumn } from "@/components/content/DataTableColumn";

export default function Collection() {
  const {
    collection,
    related_field,
    current_value,
    item_field,
    document_session_id,
  } = useLocalSearchParams();

  const primaryKey = usePrimaryKey(collection as keyof CoreSchema);
  const pagination = useDocumentsFilters();
  const { page, limit, search } = pagination;

  const { data: fields } = useFields(collection as keyof CoreSchema);

  const { data: presets } = usePresets();

  const preset = presets?.find((p) => p.collection === collection);

  const value = (current_value as string)?.split(",").filter((v) => !!v);

  const tableFields = useCollectionTableFields({
    collection: collection as keyof CoreSchema,
  });

  const { data: options, refetch } = useDocuments(
    collection as keyof CoreSchema,
    {
      fields: [
        primaryKey as string,
        ...tableFields.filter((f: string) => !f.includes(".")),
      ],

      page,
      limit,
      search,
      filter: {
        ...(value?.length > 0
          ? {
              [getPrimaryKey(fields) as any]: {
                _nin: value,
              },
            }
          : {}),
      },
    },
  );

  const nestedFields = tableFields.filter((f: string) => f.includes("."));
  const expandedFields = nestedFields.map((f: string) =>
    f.includes(".$") ? f.split(".$")[0] : f,
  );

  const relatedIds =
    map(options?.items, (doc) => doc[primaryKey as string]) ?? [];
  const hasRelatedIds = relatedIds.length > 0;

  const { data: relatedDocuments, refetch: refetchRelatedDocuments } =
    useDocuments(
      collection as keyof CoreSchema,
      {
        fields: [...expandedFields, primaryKey as any],
        limit: -1,
        filter: hasRelatedIds
          ? { [primaryKey as any]: { _in: relatedIds } }
          : { [primaryKey as any]: { _eq: null } },
      },
      {
        enabled: hasRelatedIds && nestedFields.length > 0,
      },
    );

  useEffect(() => {
    refetch();
    refetchRelatedDocuments?.();
  }, [current_value, refetch, refetchRelatedDocuments]);

  const headerStyles = useHeaderStyles({ isModal: true });
  const { label } = useFieldMeta(collection as keyof CoreSchema);
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Layout>
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
          (prev, curr) => ({
            ...prev,
            [curr]: label(curr.split(".")[curr.split(".").length - 1]) || "",
          }),
          {},
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
          map(tableFields, (f) => {
            const relatedDoc = (
              relatedDocuments?.items as Record<string, unknown>[] | undefined
            )?.find(
              (r) => r[primaryKey as string] === doc[primaryKey as string],
            );
            return (
              <DataTableColumn
                template={f}
                document={doc}
                relatedDocument={relatedDoc}
                collection={collection as keyof CoreSchema}
                key={`table-${collection}-column-${f}`}
              />
            );
          })
        }
        onRowPress={(doc) => {
          console.log(doc);
          router.dismiss();
          requestAnimationFrame(() => {
            EventBus.emit("m2a:add", {
              data: {
                [primaryKey as string]: doc[primaryKey as string],
              } as CoreSchemaDocument,
              document_session_id: document_session_id as string | number,
              field: item_field as string,
              collection: collection as keyof CoreSchema,
              __id: doc[primaryKey as string] as string,
            });
          });
        }}
      />
    </Layout>
  );
}
