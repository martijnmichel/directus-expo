import { getPrimaryKey } from "@/hooks/usePrimaryKey";
import { CoreSchema } from "@directus/sdk";

import { ReadFieldOutput } from "@directus/sdk";
import { map } from "lodash";

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

type FieldValueBase = {
  type: "string" | "transform";
  value?: string;
};

type FieldValueString = FieldValueBase & {
  type: "string";
  value: string;
};

type FieldValueTransform = FieldValueBase & {
  name: string;
  type: "transform";
  path?: string;
  transformation?: string;
};

export type FieldTransform = FieldValueString | FieldValueTransform;

export const getFieldsFromTemplate = (template?: string): FieldTransform[] => {
  if (!template) return [];

  const segments: FieldTransform[] = [];
  let lastIndex = 0;

  // Modified regex to be more precise about capturing
  const regex = /(\{\{[^}]+\}\})/g; // Capture the entire match including braces
  let match;

  while ((match = regex.exec(template)) !== null) {
    // Add text before the match if it exists
    if (match.index > lastIndex) {
      segments.push({
        type: "string",
        value: template.slice(lastIndex, match.index),
      });
    }

    // Process the field transform - only trim the inner content
    const field = match[1].replace(/^\{\{|\}\}$/g, "").trim();
    const split = field.split(".");

    if (split.length === 1) {
      segments.push({ type: "transform", name: field });
    } else if (field.includes("$")) {
      segments.push({
        type: "transform",
        name: split[0],
        path: field,
        transformation: split[split.length - 1],
      });
    } else if (split[0] === "m2m") {
      segments.push({
        type: "transform",
        name: field.replace("m2m.", ""),
        path: field.replace("m2m.", ""),
      });
    } else {
      segments.push({
        type: "transform",
        name: field,
      });
    }

    lastIndex = match.index + match[1].length; // Use the exact match length
  }

  // Add remaining text after last match if it exists
  if (lastIndex < template.length) {
    segments.push({
      type: "string",
      value: template.slice(lastIndex),
    });
  }

  return segments;
};
