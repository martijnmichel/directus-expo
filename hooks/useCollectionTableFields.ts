import { useFields, usePresets } from "@/state/queries/directus/collection";
import { CoreSchemaDocument } from "@/types/directus";
import { CoreSchema, ReadFieldOutput, ReadPresetOutput } from "@directus/sdk";
import { some } from "lodash";

export const useCollectionTableFields = ({
  documents,
  collection,
}: {
  collection: keyof CoreSchema;
  documents?: CoreSchemaDocument[];
}) => {
  const { data: presets } = usePresets();
  const { data: fields } = useFields(collection as keyof CoreSchema);
  const preset = presets?.find((p) => p.collection === collection);
  return (
    (preset && preset.layout_query?.tabular?.fields) ||
    /** or headers from fields that have values in the documents */
    (!preset &&
      fields
        ?.filter(
          (f) =>
            !!some(documents, (doc) => !!doc?.[f.field as keyof typeof doc])
        )
        .map((f) => f.field)) ||
    /** or headers from all fields */
    fields?.map((f) => f.field) ||
    []
  );
};
