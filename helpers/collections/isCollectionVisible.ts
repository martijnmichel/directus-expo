import {
  CoreSchema,
  ReadPermissionOutput,
  ReadUserPermissionsOutput,
} from "@directus/sdk";
import { some } from "lodash";

export const isCollectionVisible = (
  permissions: ReadUserPermissionsOutput | undefined,
  collection: string
) => {
  if (!permissions) return false;
  return (
    some(permissions?.[collection as string], (p) => p.access !== "none") ??
    false
  );
};
