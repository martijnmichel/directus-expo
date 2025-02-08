import { Thumbnail } from "@/components/content/Thumbnail";
import { DateUtils } from "@/utils/dayjs";
import { CoreSchema, ReadFieldOutput } from "@directus/sdk";
import { Image } from "expo-image";
import { View } from "react-native";

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
    default: ({ value }) => value,
  },
  uuid: {
    "file-image": ({ value, transform }) => {
      if (transform === "$thumbnail") {
        return <Thumbnail id={value} style={{ width: 20, height: 20 }} />;
      }

      return value;
    },
    default: ({ value }) => value,
  },
  default: ({ value }) => value,
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
