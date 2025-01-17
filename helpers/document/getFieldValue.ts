import { DateUtils } from "@/utils/dayjs";
import { CoreSchema, ReadFieldOutput } from "@directus/sdk";

export const getFieldValue = (
  item: ReadFieldOutput<CoreSchema>,
  doc: Record<string, any>
) => {
  switch (item.type) {
    case "dateTime":
      switch (item.meta.interface) {
        case "datetime":
          return doc[item.field]
            ? DateUtils.format(doc[item.field], "LL")
            : null;
        default:
          return doc[item.field];
      }
    case "boolean":
      switch (item.meta.interface) {
        case "boolean":
          return doc[item.field] ? "✓" : "✗";
        default:
          return doc[item.field];
      }
    default:
      return doc[item.field];
  }
};
