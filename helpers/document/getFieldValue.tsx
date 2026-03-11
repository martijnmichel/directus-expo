import { FieldValue } from "@/components/content/RelatedTemplate";
import { Thumbnail } from "@/components/content/Thumbnail";
import { DateUtils } from "@/utils/dayjs";
import { CoreSchema, ReadFieldOutput, ReadRelationOutput } from "@directus/sdk";
import { Image } from "expo-image";
import { View } from "react-native";
import { toM2AReadPath, toM2AReadPathEntryRelative } from "@/helpers/collections/getDisplayTemplate";
import { getAllPathsFromTemplate, getPathFromTemplate, getValuesAtPath, parseTemplate } from "./template";
import { get, map } from "lodash";
import { useRelations } from "@/state/queries/directus/core";
import { useCollection, useFields } from "@/state/queries/directus/collection";
import { Button } from "@/components/display/button";
import { Text } from "@/components/display/typography";
import { DropdownMenu } from "@/components/display/dropdown-menu";
import { Horizontal, Vertical } from "@/components/layout/Stack";
import { useStyles } from "react-native-unistyles";
import { tableStylesheet } from "@/components/display/table";

type InterfaceArgs = {
  value: any;
  item: ReadFieldOutput<CoreSchema>;
  transform?: string;
};

const fieldValueMap: {
  [x: string]:
    | { [y: string]: (args: InterfaceArgs) => any }
    | ((args: InterfaceArgs) => any);
} = {
  string: {
    "select-color": ({ value, item }) =>
      item?.meta?.display === "color" ? (
        <View
          style={{
            backgroundColor: value,
            width: 10,
            borderRadius: 9999,
            height: 10,
          }}
        />
      ) : (
        value
      ),
    default: ({ value }) => value,
  },
  dateTime: {
    datetime: ({ value }) => (value ? DateUtils.format(value, "LL") : null),
    default: ({ value }) => value,
  },
  boolean: {
    boolean: ({ value }) => (value ? "✓" : "✗"),
    default: ({ value }) => value?.toString(),
  },
  uuid: {
    "file-image": ({ value, transform }) => {
      if (transform === "$thumbnail" || transform === "thumbnail") {
        return (
          <Thumbnail
            id={value}
            style={{
              width: 30,
              height: 30,
              borderRadius: 5,
              objectFit: "cover",
            }}
          />
        );
      }
      return value;
    },
    default: ({ value }) => value,
  },
  default: ({ value }) => {
    if (!value) return <Text>-</Text>;
    else if (typeof value === "object") {
      return <Text>{JSON.stringify(value)}</Text>;
    } else if (!!value && typeof value === "string")
      return <Text>{value}</Text>;
    else return <Text>{value?.toString()}</Text>;
  },
} as const;

export const getFieldValue = (
  item: ReadFieldOutput<CoreSchema>,
  value: any,
  transform?: string,
) => {
  if (!item) return;
  const typeHandlers =
    fieldValueMap[item.type as keyof typeof fieldValueMap] ??
    fieldValueMap.default;

  if (typeof typeHandlers === "function") {
    return typeHandlers({ value, item, transform });
  }

  const interfaceHandler =
    typeHandlers[item.meta.interface as keyof typeof typeHandlers] ??
    (typeHandlers as any).default;

  return interfaceHandler({ value, item, transform });
};

export const useFieldDisplayValue = (collection: string) => {
  const { data: relations } = useRelations();
  const { data: fields } = useFields(collection as keyof CoreSchema);
  const { data: collectionMeta } = useCollection(collection);

  const parse = ({
    item,
    data,
    template,
  }: {
    item: ReadFieldOutput<CoreSchema>;
    data?: Record<string, any>;
    template?: string;
  }) => {
    switch (item.type) {
      case "integer":
        switch (item.meta.interface) {
          case "select-dropdown-m2o":
            switch (item.meta.display) {
              case "related-values":
                return data?.[item.field] ? null : null;
            }
        }

      case "alias": {
        if (template) {
          const junction = relations?.find(
            (r) =>
              r.related_collection === item.collection &&
              r.meta.one_field === item.field,
          );
          const templatePathsRaw = getAllPathsFromTemplate(template);
          const templatePaths = (
            templatePathsRaw.length > 0
              ? templatePathsRaw
              : [getPathFromTemplate(template).replace(/(\w+):/g, "$1.")].filter(Boolean)
          ).sort((a, b) => b.split(".").length - a.split(".").length);

          const formatEntry = (entry: unknown): string => {
            const prefix = item.field + ".";

            if (entry != null && typeof entry === "object") {
              for (const templatePath of templatePaths) {
                if (!templatePath) continue;
                const pathForEntry = templatePath.startsWith(prefix)
                  ? templatePath.slice(prefix.length)
                  : templatePath;

                let values = getValuesAtPath(entry, pathForEntry);
                let flattened = Array.isArray(values) ? values : [values];
                let leafValues = flattened.filter(
                  (v) => v != null && typeof v !== "object"
                );
                if (leafValues.length === 0 && pathForEntry.split(".").length >= 3) {
                  values = getValuesAtPath(entry, toM2AReadPathEntryRelative(pathForEntry));
                  flattened = Array.isArray(values) ? values : [values];
                  leafValues = flattened.filter(
                    (v) => v != null && typeof v !== "object"
                  );
                }
                if (leafValues.length > 0) {
                  return leafValues
                    .map((v) => getFieldValueString({ value: v }))
                    .filter(Boolean)
                    .join(", ");
                }
              }
              const pathForEntry = templatePaths[0]?.startsWith(prefix)
                ? templatePaths[0].slice(prefix.length)
                : templatePaths[0];
              return get(entry, pathForEntry || template) ?? String(entry ?? "");
            }
            return String(entry ?? "");
          };

          return !!data?.[item.field].length && junction ? (
            <Horizontal spacing="xs">
              {map(data?.[item.field], (entry) => (
                <Text key={String(entry && typeof entry === "object" ? (entry as any).id ?? "" : entry)}>
                  {formatEntry(entry)},
                </Text>
              ))}
            </Horizontal>
          ) : null;
        } else {
          switch (item.meta.display) {
            case "related-values": {
              const junction = relations?.find(
                (r) =>
                  r.related_collection === item.collection &&
                  r.meta.one_field === item.field,
              );
              const template =
                item.meta.display_options?.template ??
                (collectionMeta?.meta?.display_template as string | undefined);
              const templatePathsRaw = getAllPathsFromTemplate(template);
              const templatePaths = (
                templatePathsRaw.length > 0
                  ? templatePathsRaw
                  : [getPathFromTemplate(template).replace(/(\w+):/g, "$1.")].filter(Boolean)
              ).sort((a, b) => b.split(".").length - a.split(".").length);

              const formatEntry = (entry: unknown): string => {
                if (entry != null && typeof entry === "object") {
                  const prefix = item.field + ".";

                  for (const templatePath of templatePaths) {
                    if (!templatePath) continue;
                    const pathForEntry = templatePath.startsWith(prefix)
                      ? templatePath.slice(prefix.length)
                      : templatePath;

                    let values = getValuesAtPath(entry, pathForEntry);
                    let flattened = Array.isArray(values) ? values : [values];
                    let leafValues = flattened.filter(
                      (v) => v != null && typeof v !== "object"
                    );
                    if (leafValues.length === 0 && pathForEntry.split(".").length >= 3) {
                      const entryRelativePath = toM2AReadPathEntryRelative(pathForEntry);
                      values = getValuesAtPath(entry, entryRelativePath);
                      flattened = Array.isArray(values) ? values : [values];
                      leafValues = flattened.filter(
                        (v) => v != null && typeof v !== "object"
                      );
                    }
                    if (leafValues.length > 0) {
                      return leafValues
                        .map((v) => getFieldValueString({ value: v }))
                        .filter(Boolean)
                        .join(", ");
                    }
                  }
                }
                return parseTemplate(template, entry as Record<string, unknown>, fields) ?? "";
              };

              return !!data?.[item.field].length && junction ? (
                <DropdownMenu>
                  <DropdownMenu.Trigger>
                    {data?.[item.field].length} items
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content>
                    <Vertical>
                      {map(data?.[item.field], (entry) => (
                        <Text key={String(entry && typeof entry === "object" ? (entry as any).id ?? JSON.stringify(entry) : entry)}>
                          {formatEntry(entry)}
                        </Text>
                      ))}
                    </Vertical>
                  </DropdownMenu.Content>
                </DropdownMenu>
              ) : null;
            }
          }
        }
      }

      default: {
        const value = data?.[item.field];

        return getFieldValueString({ value });
      }
    }
  };

  return { parse };
};

export const getFieldValueString = ({ value }: { value: any }): string => {
  // Handle null/undefined
  if (value == null) {
    return "-";
  }

  // Handle arrays (including empty arrays)
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "-";
    }
    return map(value, (item, index) => (
      getFieldValueString({ value: item })
    )).join(", ");
  }

  // Handle objects (including Date)
  if (typeof value === "object") {
    if (value instanceof Date) {
      return value.toISOString();
    }
    try {
      return JSON.stringify(value);
    } catch (e) {
      return "[Complex Object]";
    }
  }

  // Handle primitives
  switch (typeof value) {
    case "string":
      return value.toString();
    case "number":
      return Number.isFinite(value) ? value.toString() : "Invalid Number";

    case "boolean":
      return value.toString();
    case "bigint":
      return value.toString() + "n";
    case "symbol":
      return value.toString();
    case "function":
      return "[Function]";
    default:
      return "-";
  }
};
