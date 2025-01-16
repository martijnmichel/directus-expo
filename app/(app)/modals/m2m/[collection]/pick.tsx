import { View, Text, StyleSheet, ScrollView } from "react-native";
import {
  KeyboardAwareLayout,
  KeyboardAwareScrollView,
  Layout,
} from "@/components/layout/Layout";
import {
  router,
  Stack,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import { DocumentEditor } from "@/components/content/DocumentEditor";
import { map, reduce } from "lodash";
import { CoreSchema, createItem, readItem, readItems } from "@directus/sdk";
import { useDocumentDisplayTemplate } from "@/hooks/useDocumentDisplayTemplate";
import {
  useCollection,
  useFields,
  usePresets,
} from "@/state/queries/directus/collection";
import { useHeaderStyles } from "@/unistyles/useHeaderStyles";
import EventBus from "@/utils/mitt";
import { useAuth } from "@/contexts/AuthContext";
import { mutateDocument } from "@/state/actions/mutateItem";
import { useQuery } from "@tanstack/react-query";
import { Table } from "@/components/display/table";
import { useFieldMeta } from "@/helpers/document/fieldLabel";
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

  const { data: fields } = useFields(related_collection as keyof CoreSchema);

  const { data: presets } = usePresets();

  const preset = presets?.find((p) => p.collection === related_collection);

  console.log({ preset });

  const tableFields =
    (preset && preset.layout_query?.tabular.fields) ||
    fields?.map((f) => f.field) ||
    [];

  const value = (current_value as string)?.split(",");

  const { directus } = useAuth();
  const { data: options, refetch } = useQuery({
    queryKey: ["options", related_collection, related_field],
    queryFn: () =>
      directus!.request(
        readItems(related_collection as any, {
          fields: [`*`],
          filter: {
            _and: [
              ...(value?.length > 0
                ? [
                    {
                      id: {
                        _nin: value,
                      },
                    },
                  ]
                : []),
              {
                [`$FOLLOW(${junction_collection},${related_field})`]: {
                  _none: {
                    [junction_field as any]: {
                      _eq: doc_id,
                    },
                  },
                },
              },
            ],
          },
        })
      ),
  });

  const headerStyles = useHeaderStyles();
  const { label } = useFieldMeta(related_collection as keyof CoreSchema);

  return (
    <Layout>
      <Stack.Screen
        options={{
          headerTitle: "Pick an item in " + related_collection,
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
        fields={tableFields}
        items={(options as Record<string, unknown>[]) || []}
        widths={preset?.layout_options?.tabular.widths}
        renderRow={(doc) =>
          map(tableFields, (f) => doc[f] as number | string | null)
        }
        onRowPress={(doc) => {
          console.log(doc);
          router.dismiss();
          EventBus.emit("m2m:add", {
            data: doc,
            field: item_field as string,
          });
        }}
      />
    </Layout>
  );
}
