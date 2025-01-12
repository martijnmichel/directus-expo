import { useFields } from "@/state/queries/directus/collection";
import { CoreSchema } from "@directus/sdk";
import { useTranslation } from "react-i18next";

export const useFieldMeta = (collection: string) => {
  const { data: fields } = useFields(collection as keyof CoreSchema);
  const {
    i18n: { language },
  } = useTranslation();

  const label = (field: string) =>
    fields
      ?.find((f) => f.field === field)
      ?.meta.translations?.find((t) => t.language.startsWith(language))
      ?.translation || field;

  return { label };
};
