import { CoreSchema, ReadCollectionOutput } from "@directus/sdk";
import { useTranslation } from "react-i18next";

export const useCollectionMeta = (
  data: ReadCollectionOutput<CoreSchema> | undefined
) => {
  const {
    i18n: { language },
  } = useTranslation();
  return {
    label: getCollectionTranslation(data, language),
  };
};

export const getCollectionTranslation = (
  data: ReadCollectionOutput<CoreSchema> | undefined,
  locale: string
) =>
  data?.meta.translations?.find((t) => t.language.startsWith(locale))
    ?.translation || data?.collection;
