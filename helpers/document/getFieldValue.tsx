import { DateUtils } from "@/utils/dayjs";
import { CoreSchema, ReadFieldOutput } from "@directus/sdk";
import { View } from "react-native";

type InterfaceArgs = {
  value: any;
  item: ReadFieldOutput<CoreSchema>;
};

const fieldValueMap = {
  string: {
    "select-color": ({ value, item }: InterfaceArgs) =>
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
    default: ({ value }: InterfaceArgs) => value,
  },
  dateTime: {
    datetime: ({ value }: InterfaceArgs) =>
      value ? DateUtils.format(value, "LL") : null,
    default: ({ value }: InterfaceArgs) => value,
  },
  boolean: {
    boolean: ({ value }: InterfaceArgs) => (value ? "✓" : "✗"),
    default: ({ value }: InterfaceArgs) => value,
  },
  default: ({ value }: InterfaceArgs) => value,
} as const;

export const getFieldValue = (
  item: ReadFieldOutput<CoreSchema>,
  doc: Record<string, any>
) => {
  const typeHandlers =
    fieldValueMap[item.type as keyof typeof fieldValueMap] ??
    fieldValueMap.default;

  if (typeof typeHandlers === "function") {
    return typeHandlers({ value: doc[item.field], item });
  }

  const interfaceHandler =
    typeHandlers[item.meta.interface as keyof typeof typeHandlers] ??
    typeHandlers.default;

  return interfaceHandler({ value: doc[item.field], item });
};
