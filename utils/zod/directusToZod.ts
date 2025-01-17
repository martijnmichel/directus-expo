import { z } from "zod";

type DirectusValidationRule = {
  _and?: DirectusValidationRule[];
  _or?: DirectusValidationRule[];
  _not?: DirectusValidationRule;
  _eq?: any;
  _neq?: any;
  _lt?: number;
  _lte?: number;
  _gt?: number;
  _gte?: number;
  _in?: any[];
  _nin?: any[];
  _null?: boolean;
  _nnull?: boolean;
  _contains?: string;
  _ncontains?: string;
  _starts_with?: string;
  _nstarts_with?: string;
  _ends_with?: string;
  _nends_with?: string;
  _empty?: boolean;
  _nempty?: boolean;
  _between?: [number, number];
  _nbetween?: [number, number];
  _regex?: string;
  _nregex?: string;
  _length?: number;
  _min_length?: number;
  _max_length?: number;
};

export function directusToZod(
  validation: DirectusValidationRule
): z.ZodTypeAny {
  // Start with a base schema that accepts any value
  let schema: z.ZodTypeAny = z.any();

  // Helper function to apply refinements
  const applyRules = (rules: DirectusValidationRule): z.ZodTypeAny => {
    let currentSchema = schema;

    for (const [key, value] of Object.entries(rules)) {
      switch (key) {
        case "_and":
          value?.forEach((rule: DirectusValidationRule) => {
            currentSchema = applyRules(rule);
          });
          break;

        case "_or":
          if (value) {
            const orSchemas = value.map((rule: DirectusValidationRule) =>
              applyRules(rule)
            );
            currentSchema = z.union(
              orSchemas as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]
            );
          }
          break;

        case "_not":
          if (value) {
            currentSchema = currentSchema.refine(
              (val) => !applyRules(value).safeParse(val).success,
              { message: "Validation failed for NOT condition" }
            );
          }
          break;

        case "_eq":
          currentSchema = currentSchema.refine((val) => val === value, {
            message: `Must equal ${value}`,
          });
          break;

        case "_neq":
          currentSchema = currentSchema.refine((val) => val !== value, {
            message: `Must not equal ${value}`,
          });
          break;

        case "_lt":
          currentSchema = currentSchema.refine((val) => val < value, {
            message: `Must be less than ${value}`,
          });
          break;

        case "_lte":
          currentSchema = currentSchema.refine((val) => val <= value, {
            message: `Must be less than or equal to ${value}`,
          });
          break;

        case "_gt":
          currentSchema = currentSchema.refine((val) => val > value, {
            message: `Must be greater than ${value}`,
          });
          break;

        case "_gte":
          currentSchema = currentSchema.refine((val) => val >= value, {
            message: `Must be greater than or equal to ${value}`,
          });
          break;

        case "_in":
          currentSchema = currentSchema.refine((val) => value.includes(val), {
            message: `Must be one of: ${value.join(", ")}`,
          });
          break;

        case "_nin":
          currentSchema = currentSchema.refine((val) => !value.includes(val), {
            message: `Must not be one of: ${value.join(", ")}`,
          });
          break;

        case "_null":
          if (value) {
            currentSchema = currentSchema.nullable();
          }
          break;

        case "_nnull":
          if (value) {
            currentSchema = currentSchema.refine((val) => val !== null, {
              message: "Value cannot be null",
            });
          }
          break;

        case "_contains":
          currentSchema = currentSchema.refine(
            (val) => typeof val === "string" && val.includes(value),
            { message: `Must contain "${value}"` }
          );
          break;

        case "_ncontains":
          currentSchema = currentSchema.refine(
            (val) => typeof val === "string" && !val.includes(value),
            { message: `Must not contain "${value}"` }
          );
          break;

        case "_starts_with":
          currentSchema = currentSchema.refine(
            (val) => typeof val === "string" && val.startsWith(value),
            { message: `Must start with "${value}"` }
          );
          break;

        case "_ends_with":
          currentSchema = currentSchema.refine(
            (val) => typeof val === "string" && val.endsWith(value),
            { message: `Must end with "${value}"` }
          );
          break;

        case "_empty":
          currentSchema = currentSchema.refine(
            (val) => !val || val.length === 0,
            { message: "Must be empty" }
          );
          break;

        case "_nempty":
          currentSchema = currentSchema.refine((val) => val && val.length > 0, {
            message: "Must not be empty",
          });
          break;

        case "_between":
          currentSchema = currentSchema.refine(
            (val) => val >= value[0] && val <= value[1],
            { message: `Must be between ${value[0]} and ${value[1]}` }
          );
          break;

        case "_regex":
          currentSchema = currentSchema.refine(
            (val) => new RegExp(value).test(String(val)),
            { message: `Must match pattern ${value}` }
          );
          break;

        case "_length":
          currentSchema = currentSchema.refine(
            (val) => String(val).length === value,
            { message: `Length must be exactly ${value}` }
          );
          break;

        case "_min_length":
          currentSchema = currentSchema.refine(
            (val) => String(val).length >= value,
            { message: `Minimum length is ${value}` }
          );
          break;

        case "_max_length":
          currentSchema = currentSchema.refine(
            (val) => String(val).length <= value,
            { message: `Maximum length is ${value}` }
          );
          break;
      }
    }

    return currentSchema;
  };

  return applyRules(validation);
}
