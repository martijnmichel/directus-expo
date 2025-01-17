import { DateUtils } from "@/utils/dayjs";
import { CoreSchema, ReadFieldOutput } from "@directus/sdk";

const fieldValueMap = {
  dateTime: {
    datetime: (value: any) => (value ? DateUtils.format(value, "LL") : null),
    default: (value: any) => value,
  },
  boolean: {
    boolean: (value: any) => (value ? "✓" : "✗"),
    default: (value: any) => value,
  },
  default: (value: any) => value,
} as const;

export const getFieldValue = (
  item: ReadFieldOutput<CoreSchema>,
  doc: Record<string, any>
) => {
  const typeHandlers =
    fieldValueMap[item.type as keyof typeof fieldValueMap] ??
    fieldValueMap.default;

  if (typeof typeHandlers === "function") {
    return typeHandlers(doc[item.field]);
  }

  const interfaceHandler =
    typeHandlers[item.meta.interface as keyof typeof typeHandlers] ??
    typeHandlers.default;
  return interfaceHandler(doc[item.field]);
};
