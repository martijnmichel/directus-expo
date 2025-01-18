import { CoreSchema, ReadUserPermissionsOutput } from "@directus/sdk";
import { Actions } from "./actions";

export const isFieldAllowed = (
  field: string,
  action: Actions,
  permission?: ReadUserPermissionsOutput[string]
) => {
  if (!permission?.[action].fields) return false;

  return (
    permission?.[action].fields.includes("*") ||
    permission?.[action].fields.includes(field)
  );
};
