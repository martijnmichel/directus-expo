import { getPrimaryKey } from "@/hooks/usePrimaryKey";
import { CoreSchema } from "@directus/sdk";

import { ReadFieldOutput } from "@directus/sdk";

export const parseTemplate = <T>(
  template?: string,
  data?: T & { [key: string]: any },
  fields?: ReadFieldOutput<CoreSchema>[]
): string => {
  const pk = getPrimaryKey(fields as any);
  return (
    template?.replace(/\{\{(.*?)\}\}/g, (_, path) => {
      return (
        path
          .trim()
          .split(".")
          .reduce(
            (obj: unknown, key: string) =>
              (obj as Record<string, unknown>)?.[key],
            data as unknown
          ) ||
        data?.[pk as any] ||
        ""
      );
    }) ||
    data?.[pk as any] ||
    data?.id ||
    ""
  );
};

export const parseRepeaterTemplate = <T>(
  template: string,
  data: T & { id?: string }
): string => {
  return template.replace(/\{\{(.*?)\}\}/g, (_, path) => {
    return (
      path
        .trim()
        .split(".")
        .reduce(
          (obj: unknown, key: string) =>
            (obj as Record<string, unknown>)?.[key],
          data as unknown
        ) ||
      Object.values(data || {})[0] ||
      "-"
    );
  });
};
