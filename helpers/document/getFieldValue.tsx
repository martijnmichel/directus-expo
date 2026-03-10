import { FieldValue } from "@/components/content/RelatedTemplate";
import { Thumbnail } from "@/components/content/Thumbnail";
import { DateUtils } from "@/utils/dayjs";
import { CoreSchema, ReadFieldOutput, ReadRelationOutput } from "@directus/sdk";
import { Image } from "expo-image";
import { View } from "react-native";
import { parseTemplate } from "./template";
import { get, map } from "lodash";
import { useRelations } from "@/state/queries/directus/core";
import { useFields } from "@/state/queries/directus/collection";
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
  console.log({ item, value, transform });
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

          console.log({ junction, value: data?.[item.field], template });

          return !!data?.[item.field].length && junction ? (
            <Horizontal spacing="xs">
              {map(data?.[item.field], (id) => {
                return <Text>{get(id, template) || id},</Text>;
              })}
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

              return !!data?.[item.field].length && junction ? (
                <DropdownMenu>
                  <DropdownMenu.Trigger>
                    {data?.[item.field].length} items
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content>
                    <Vertical>
                      {map(data?.[item.field], (id) => {
                        console.log({ id, item, data });
                        return (
                          <Text>
                            {parseTemplate(
                              item.meta.display_options?.template,
                              id,
                            )}
                          </Text>
                        );
                      })}
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
