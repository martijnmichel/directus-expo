import { CoreSchema, ReadCollectionOutput } from "@directus/sdk";

export const getCollectionTranslation = (
  data: ReadCollectionOutput<CoreSchema> | undefined,
  language = "nl-NL"
) => {
  return data?.meta.translations?.find((t) => t.language === language)
    ?.translation;
};
