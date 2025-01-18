import {
  CoreSchema,
  ReadPermissionOutput,
  ReadUserPermissionsOutput,
} from "@directus/sdk";

export const getCanCreate = ({
  field,
  collection,
  permissions = {},
  docId,
}: {
  field: string;
  collection: keyof CoreSchema;
  permissions?: ReadUserPermissionsOutput;
  docId?: number | string | "+";
}) => {
  const collectionPermissions = permissions?.[collection as keyof CoreSchema];
  return (
    docId === "+" &&
    collectionPermissions?.create.access !== "none" &&
    collectionPermissions?.create.fields?.includes(field)
  );
};

export const getCanUpdate = ({
  field,
  collection,
  permissions = {},
  docId,
}: {
  field: string;
  collection: keyof CoreSchema;
  permissions?: ReadUserPermissionsOutput;
  docId?: number | string | "+";
}) => {
  const collectionPermissions = permissions?.[collection as keyof CoreSchema];
  return (
    docId !== "+" &&
    collectionPermissions?.update.access !== "none" &&
    collectionPermissions?.update.fields?.includes(field)
  );
};

export const getCanDelete = ({
  collection,
  permissions = {},
}: {
  collection: keyof CoreSchema;
  permissions?: ReadUserPermissionsOutput;
}) => {
  const collectionPermissions = permissions?.[collection as keyof CoreSchema];
  return collectionPermissions?.delete.access !== "none";
};
