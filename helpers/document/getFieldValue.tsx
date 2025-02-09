import { FieldValue } from "@/components/content/RelatedTemplate";
import { Thumbnail } from "@/components/content/Thumbnail";
import { DateUtils } from "@/utils/dayjs";
import { CoreSchema, ReadFieldOutput, ReadRelationOutput } from "@directus/sdk";
import { Image } from "expo-image";
import { View } from "react-native";
import { parseTemplate } from "./template";
import { map } from "lodash";
import { useRelations } from "@/state/queries/directus/core";
import { useFields } from "@/state/queries/directus/collection";
import { Button } from "@/components/display/button";
import { Text } from "@/components/display/typography";
import { DropdownMenu } from "@/components/display/dropdown-menu";
import { Vertical } from "@/components/layout/Stack";

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
  },
  dateTime: {
    datetime: ({ value }) => (value ? DateUtils.format(value, "LL") : null),
  },
  boolean: {
    boolean: ({ value }) => (value ? "✓" : "✗"),
  },
  uuid: {
    "file-image": ({ value, transform }) => {
      if (transform === "$thumbnail") {
        return <Thumbnail id={value} style={{ width: 20, height: 20 }} />;
      }

      return value;
    },
  },
  default: ({ value }) => <Text>{value}</Text>,
} as const;

export const getFieldValue = (
  item: ReadFieldOutput<CoreSchema>,
  value: any,
  transform?: string
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
    typeHandlers.default;

  return interfaceHandler({ value, item, transform });
};

export const useFieldDisplayValue = (collection: string) => {
  const { data: relations } = useRelations();
  const { data: fields } = useFields(collection as keyof CoreSchema);

  const parse = ({
    item,
    data,
  }: {
    item: ReadFieldOutput<CoreSchema>;
    data?: Record<string, any>;
  }) => {
    switch (item.type) {
      case "integer":
        switch (item.meta.interface) {
          case "select-dropdown-m2o":
            switch (item.meta.display) {
              case "related-values":
                return data?.[item.field] ? (
                  <FieldValue
                    collection={item.schema.foreign_key_table as string}
                    id={data?.[item.field]}
                    template={item.meta.display_options?.template}
                    item={item}
                  />
                ) : null;
            }
        }

      case "alias":
        switch (item.meta.display) {
          case "related-values": {
            const junction = relations?.find(
              (r) =>
                r.related_collection === item.collection &&
                r.meta.one_field === item.field
            );
            return !!data?.[item.field].length && junction ? (
              <DropdownMenu>
                <DropdownMenu.Trigger>
                  {data?.[item.field].length} items
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <Vertical>
                    {map(data?.[item.field], (id) => {
                      return (
                        <FieldValue
                          collection={junction?.collection as string}
                          id={id}
                          item={item}
                          template={item.meta.display_options?.template}
                        />
                      );
                    })}
                  </Vertical>
                </DropdownMenu.Content>
              </DropdownMenu>
            ) : null;
          }
        }

      default:
        return getFieldValue(item, data?.[item.field]);
    }
  };

  return { parse };
};
