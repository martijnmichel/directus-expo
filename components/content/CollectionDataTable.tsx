import { useCollection, usePresets } from "@/state/queries/directus/collection";
import { map, reduce } from "lodash";
import { Table } from "../display/table";
import { Container } from "../layout/Container";
import { useFields } from "@/state/queries/directus/collection";
import { useDocuments } from "@/state/queries/directus/collection";
import { CoreSchema } from "@directus/sdk";
import { useTranslation } from "react-i18next";
import { useFieldMeta } from "@/helpers/document/fieldLabel";
import { router } from "expo-router";

export function CollectionDataTable({ collection }: { collection: string }) {
  const { data } = useCollection(collection as keyof CoreSchema);
  const { data: fields } = useFields(collection as keyof CoreSchema);
  const { data: documents } = useDocuments(
    collection as keyof CoreSchema[keyof CoreSchema]
  );

  const { label } = useFieldMeta(collection);

  const { data: presets } = usePresets();

  const preset = presets?.find((p) => p.collection === collection);

  console.log({ preset });

  const tableFields =
    (preset && preset.layout_query?.tabular.fields) ||
    fields?.map((f) => f.field) ||
    [];

  return (
    <Table
      headers={reduce(
        tableFields,
        (prev, curr) => ({ ...prev, [curr]: label(curr) }),
        {}
      )}
      fields={tableFields}
      items={(documents as Record<string, unknown>[]) || []}
      widths={preset?.layout_options?.tabular.widths}
      renderRow={(doc) => map(tableFields, (f) => doc[f] as string)}
      onRowPress={(doc) => {
        console.log(doc);
        router.push(`/content/${collection}/${doc.id}`);
      }}
    />
  );
}
