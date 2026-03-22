import { useFields } from "@/state/queries/directus/collection";
import { CoreSchema } from "@directus/sdk";
import {
  getPrimaryKey,
  getPrimaryKeyFromAllFields,
  getPrimaryKeyValue,
} from "./primaryKeyUtils";

export { getPrimaryKey, getPrimaryKeyFromAllFields, getPrimaryKeyValue };

export const usePrimaryKey = (collection: string) => {
  const { data: fields } = useFields(collection as keyof CoreSchema);
  const primaryKey = getPrimaryKey(fields);
  return primaryKey;
};
