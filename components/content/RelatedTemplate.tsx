import { getFieldsFromTemplate } from "@/helpers/document/template";
import { useDocument, useFields } from "@/state/queries/directus/collection";
import { CoreSchema } from "@directus/sdk";

import { ReadFieldOutput } from "@directus/sdk";
import { filter, get } from "lodash";
import { map } from "lodash";
import { Text } from "../display/typography";
import { getFieldValue } from "@/helpers/document/getFieldValue";
import { useEffect } from "react";

export const FieldValue = ({
  collection,
  id,
  template,
  item,
}: {
  collection: string;
  id: string | number;
  template: string;
  item: ReadFieldOutput<CoreSchema>;
}) => {
  const fieldTemplate = getFieldsFromTemplate(template);
  const { data: fields } = useFields(collection as any);
  const { data, refetch } = useDocument({
    collection: collection as any,
    id,
    options: {
      fields: map(
        filter(fieldTemplate, (f) => f.type === "transform"),
        (field) => field.name
      ),
    },
    query: {
      retry: false,
      enabled: false,
    },
  });

  useEffect(() => {
    if (id) {
      refetch();
    }
  }, [id]);

  console.log({
    fieldTemplate,
    id,
    collection,
    data,
  });

  return map(fieldTemplate, (templatePart) => {
    console.log({ item });

    if (templatePart?.type === "string")
      return <Text>{templatePart.value}</Text>;
    else
      return !!item
        ? getFieldValue(
            item,
            get(data, templatePart?.name),
            templatePart?.transformation
          ) || "--"
        : "--";
  });
};
