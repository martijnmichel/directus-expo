import { getFieldValue } from "@/helpers/document/getFieldValue";
import { FieldTransform } from "@/helpers/document/template";
import { ReadFieldOutput, CoreSchema } from "@directus/sdk";
import { Text } from "../display/typography";

export const FieldValue = ({
  field,
  transform,
  data: value,
}: {
  transform?: FieldTransform;
  data?: any;
  field?: ReadFieldOutput<CoreSchema>;
}) => {
  if (transform?.type === "string") return <Text>{transform.value}</Text>;
  else
    return !!field
      ? getFieldValue(
          field,
          value?.[transform?.name as any],
          transform?.transformation
        ) || "--"
      : "--";
};
