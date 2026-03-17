import { getValuesAtPath } from "@/helpers/document/template";
import { toM2AReadPath } from "@/helpers/collections/getDisplayTemplate";
import { getFieldValueString } from "@/helpers/document/getFieldValue";

/**
 * Get a comma-joined string of leaf values at a deep path, expanding arrays.
 * Mirrors the "array traversal" behavior used by `DataTableColumn`.
 */
export function getJoinedLeafValuesAtPath(
  obj: unknown,
  path: string
): string | null {
  if (!obj || !path) return null;

  // Normalize Directus M2A colon syntax to dots so path reads work.
  const norm = (p: string) => p.replace(/(\w+):/g, "$1.");
  const normalizedPath = norm(path);

  let valuesFromPath = getValuesAtPath(obj, normalizedPath);
  const pathSegs = normalizedPath.split(".").filter(Boolean);
  const isM2AStylePath = pathSegs.length >= 4;
  const flat = Array.isArray(valuesFromPath) ? valuesFromPath : [valuesFromPath];

  // M2A API returns items[].<junctionField> = { ... } without collection key; try read path without that segment.
  if (
    isM2AStylePath &&
    flat.every((v) => v == null || typeof v === "object")
  ) {
    valuesFromPath = getValuesAtPath(obj, toM2AReadPath(normalizedPath));
  }

  const flattened = Array.isArray(valuesFromPath) ? valuesFromPath : [valuesFromPath];
  const leafValues = flattened.filter((v) => v != null && typeof v !== "object");
  if (leafValues.length === 0) return null;

  const str = leafValues
    .map((v) => getFieldValueString({ value: v }))
    .filter(Boolean)
    .join(", ");
  return str.length ? str : null;
}

