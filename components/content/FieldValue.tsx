import { getFieldValue } from "@/helpers/document/getFieldValue";
import { FieldTransform } from "@/helpers/document/template";
import { ReadFieldOutput, CoreSchema } from "@directus/sdk";

export const FieldValue = ({
  field,
  transform,
  data: value,
}: {
  transform?: FieldTransform;
  data?: any;
  field?: ReadFieldOutput<CoreSchema>;
}) => {
  if (transform?.type === "string") return transform.value;
  else
    return !!field
      ? getFieldValue(
          field,
          value?.[transform?.name as any],
          transform?.transformation
        ) || "--"
      : "--";
};
