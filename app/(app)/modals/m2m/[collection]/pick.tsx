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
import { getPrimaryKey } from "@/hooks/usePrimaryKey";
import { useDocumentsFilters } from "@/hooks/useDocumentsFilters";
import { FloatingToolbar } from "@/components/display/floating-toolbar";
import { Pagination } from "@/components/content/filters/pagination";
import { SearchFilter } from "@/components/content/filters/search-filter-modal";
export default function Collection() {
  const {
    related_collection,
    related_field,
    current_value,
    junction_collection,
    junction_field,
    doc_id,
    item_field,
  } = useLocalSearchParams();

  const pagination = useDocumentsFilters();
  const { page, limit, search } = pagination;

  const { data: fields } = useFields(related_collection as keyof CoreSchema);

  const { data: presets } = usePresets();

  const preset = presets?.find((p) => p.collection === related_collection);

  console.log({ preset });

  const tableFields =
    (preset && preset.layout_query?.tabular?.fields) ||
    fields?.map((f) => f.field) ||
    [];

  const value = (current_value as string)?.split(",").filter((v) => !!v);

  const { data: options, refetch } = useDocuments(
    related_collection as keyof CoreSchema,
    {
      fields: [`*`],

      page,
      limit,
      search,
      filter: {
        _and: [
          ...(value?.length > 0
            ? [
                {
                  [getPrimaryKey(fields) as any]: {
                    _nin: value,
                  },
                },
              ]
            : []),
          ...(doc_id &&
          doc_id !== "+" &&
          junction_collection &&
          related_field &&
          junction_field
            ? [
                {
                  [`$FOLLOW(${junction_collection},${related_field})`]: {
                    _none: {
                      [junction_field as any]: {
                        _eq: doc_id,
                      },
                    },
                  },
                },
              ]
            : []),
        ],
      },
    }
  );

  useEffect(() => {
    refetch();
  }, [current_value]);

  const headerStyles = useHeaderStyles({ isModal: true });
  const { label } = useFieldMeta(related_collection as keyof CoreSchema);
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
      <ScrollView>
        <Table
          headers={reduce(
            tableFields,
            (prev, curr) => ({ ...prev, [curr]: label(curr) || "" }),
            {}
          )}
          fields={tableFields}
          items={(options?.items as Record<string, unknown>[]) || []}
          widths={preset?.layout_options?.tabular?.widths}
          renderRow={(doc) =>
            map(tableFields, (f) => doc[f] as number | string | null)
          }
          onRowPress={(doc) => {
            console.log(doc);
            router.dismiss();
            requestAnimationFrame(() => {
              EventBus.emit("m2m:add", {
                data: doc as CoreSchemaDocument,
                field: item_field as string,
              });
            });
          }}
        />
        <View style={{ paddingBottom: bottom + 80 }} />
      </ScrollView>

      <FloatingToolbar>
        <Pagination {...pagination} total={options?.total || 0} />
        <SearchFilter {...pagination} />
      </FloatingToolbar>
    </Layout>
  );
}
