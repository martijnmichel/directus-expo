import { CoreSchema, ReadUserPermissionsOutput } from "@directus/sdk";
import { Actions } from "./actions";

export const isActionAllowed = (
  collection: keyof CoreSchema,
  action: Actions,
  permissions?: ReadUserPermissionsOutput
) => {
  if (!permissions?.[collection]) return false;
  if (permissions?.[collection][action].access === "full") return true;
  if (permissions?.[collection][action].access === "none") return false;
};
