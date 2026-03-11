import { useFields } from "@/state/queries/directus/collection";
import { get } from "lodash";
import { Text } from "../display/typography";
import { View } from "react-native";
import {
  getFieldValueString,
  useFieldDisplayValue,
} from "@/helpers/document/getFieldValue";
import { getFieldValue } from "@/helpers/document/getFieldValue";
import { tail } from "lodash";
import { CoreSchema } from "@directus/sdk";
import { useStyles } from "react-native-unistyles";
import { tableStylesheet } from "../display/table";

export const DataTableColumn = ({
  template,
  document,
  relatedDocument,
  collection,
}: {
  template?: string;
  field?: string;
  document: Record<string, unknown>;
  relatedDocument?: Record<string, unknown>;
  collection: keyof CoreSchema;
}) => {
  const { styles } = useStyles(tableStylesheet);
  const { parse } = useFieldDisplayValue(
    collection 
  );

  const { data: fields } = useFields(collection);
  const lookupField = () => {
    if (!template) return null;

    const parts = template.split(".");
    const rootField = fields?.find((fo) => fo.field === parts[0]);
    const deepField = fields?.find((fo) => fo.field === template);

    // Handle transforms (parts with $)
    const transformName = parts.find((p) => p.startsWith("$"))?.substring(1);
    const fieldPath = parts.filter((p) => !p.startsWith("$")).join(".");
    const parentFieldPath = parts
      .filter((p) => !p.startsWith("$"))
      .slice(0, -1)
      .join(".");
    const valuePath = tail(parts.filter((p) => !p.startsWith("$"))).join(".");

    return {
      field: rootField,
      deepField,
      path: fieldPath,
      transform: transformName,
      valuePath,
      parentFieldPath,
    };
  };

  const fieldInfo = lookupField();

  const rootValue = fieldInfo?.field
    ? get(document, fieldInfo.field.field)
    : null;
  const value = fieldInfo ? get(document, fieldInfo.path) : null;

  if (!value && !fieldInfo?.deepField && relatedDocument) {
    const path = fieldInfo?.path ?? "";
    const valuePath = fieldInfo?.valuePath ?? "";
    const valuePathParts = valuePath.split(".").filter(Boolean);
    const pathToArray =
      valuePathParts.length > 1 ? valuePathParts.slice(0, -1).join(".") : "";
    const lastSegment = valuePathParts[valuePathParts.length - 1] ?? valuePath;

    // Use parentFieldPath first so nested paths (e.g. category.translations) get the right array
    const pathSegments = path.split(".").filter(Boolean);
    const isNestedRelationPath = pathSegments.length > 1; // e.g. category.translations.title

    let relatedValue: unknown = null;
    if (fieldInfo?.parentFieldPath) {
      relatedValue = get(relatedDocument, fieldInfo.parentFieldPath);
    }
    // When path goes through a relation (e.g. category.translations.title), do NOT fall back
    // to pathToArray/valuePath.
    const skipFallback =
      isNestedRelationPath &&
      fieldInfo?.parentFieldPath != null &&
      (relatedValue === null || relatedValue === undefined);

    if (
      !skipFallback &&
      !Array.isArray(relatedValue) &&
      pathToArray &&
      pathToArray !== valuePath
    ) {
      relatedValue = get(relatedDocument, pathToArray);
    }
    if (!skipFallback && !Array.isArray(relatedValue)) {
      relatedValue = get(relatedDocument, valuePath);
    }

    if (skipFallback && (relatedValue === null || relatedValue === undefined)) {
      return <Text style={[styles.cellText]}>–</Text>;
    }

    if (Array.isArray(relatedValue)) {
      // Path within each array item (supports any nesting: "title", "meta.label", "a.b.c", etc.)
      const parentPath = fieldInfo?.parentFieldPath ?? "";
      const itemPath =
        parentPath && path.startsWith(parentPath + ".")
          ? path.slice(parentPath.length + 1)
          : lastSegment;

      const str = relatedValue
        .map((item: unknown) => {
          const v =
            typeof item === "object" && item !== null && itemPath
              ? get(item as object, itemPath)
              : item;
          return v != null ? getFieldValueString({ value: v }) : "";
        })
        .filter(Boolean)
        .join(", ");
      return (
        <View style={{ width: "100%", minWidth: 0, overflow: "hidden" }}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.cellText, styles.truncate, { width: "100%" }]}
          >
            {str}
          </Text>
        </View>
      );
    }
    if (relatedValue != null) {
      return getFieldValueString({ value: relatedValue });
    }
  } else if (fieldInfo?.transform && fieldInfo.field) {
    console.log({ value, fieldInfo, relatedDocument });
    return getFieldValue(fieldInfo.field, value, fieldInfo.transform);
  } else if (fieldInfo?.field) {
    return (
      <Text numberOfLines={1} style={[styles.cellText, styles.truncate]}>
        {parse({
          item: fieldInfo.field,
          data: document,
        })}
      </Text>
    );
  } else return <Text>{value?.toString()}</Text>;
};
