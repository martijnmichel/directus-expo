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
import { getJoinedLeafValuesAtPath } from "@/helpers/document/pathValue";

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
    let path = fieldInfo?.path ?? "";
    // Normalize Directus M2A colon syntax to dots so path reads work (e.g. items.item:block_card.x → items.item.block_card.x)
    const norm = (p: string) => p.replace(/(\w+):/g, "$1.");
    path = norm(path);
    const valuePath = norm(fieldInfo?.valuePath ?? "");
    const valuePathParts = valuePath.split(".").filter(Boolean);
    const pathToArray =
      valuePathParts.length > 1 ? valuePathParts.slice(0, -1).join(".") : "";
    const lastSegment = valuePathParts[valuePathParts.length - 1] ?? valuePath;

    const pathSegments = path.split(".").filter(Boolean);
    const isNestedRelationPath = pathSegments.length > 1;

    const joined = getJoinedLeafValuesAtPath(relatedDocument, path);
    if (joined) {
      return (
        <View style={{ width: "100%", minWidth: 0, overflow: "hidden" }}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.cellText, styles.truncate, { width: "100%" }]}
          >
            {joined}
          </Text>
        </View>
      );
    }

    let relatedValue: unknown = null;
    const parentFieldPathNorm = fieldInfo?.parentFieldPath ? norm(fieldInfo.parentFieldPath) : undefined;
    if (parentFieldPathNorm) {
      relatedValue = get(relatedDocument, parentFieldPathNorm);
    }
    const skipFallback =
      isNestedRelationPath &&
      parentFieldPathNorm != null &&
      (relatedValue === null || relatedValue === undefined);

    const pathToArrayNorm = pathToArray ? norm(pathToArray) : "";
    if (
      !skipFallback &&
      !Array.isArray(relatedValue) &&
      pathToArrayNorm &&
      pathToArrayNorm !== valuePath
    ) {
      relatedValue = get(relatedDocument, pathToArrayNorm);
    }
    if (!skipFallback && !Array.isArray(relatedValue)) {
      relatedValue = get(relatedDocument, valuePath);
    }

    if (skipFallback && (relatedValue === null || relatedValue === undefined)) {
      return <Text style={[styles.cellText]}>–</Text>;
    }

    if (Array.isArray(relatedValue)) {
      const parentPath = parentFieldPathNorm ?? "";
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
    return getFieldValue(fieldInfo.field, value, fieldInfo.transform);
  } else if (fieldInfo?.field) {
    const isRelatedValuesAlias =
      fieldInfo.field.type === "alias" &&
      fieldInfo.field.meta?.display === "related-values";
    return (
      <Text numberOfLines={1} style={[styles.cellText, styles.truncate]}>
        {parse({
          item: fieldInfo.field,
          // For `related-values` aliases (m2m/o2m lists), the base row often contains the populated relation
          // while the "relatedDocument" query may omit the needed expansion depending on fields selection.
          data: (isRelatedValuesAlias
            ? document
            : relatedDocument ?? document) as Record<string, unknown>,
        })}
      </Text>
    );
  } else return <Text>{value?.toString()}</Text>;
};
