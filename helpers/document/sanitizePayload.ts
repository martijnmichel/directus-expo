/**
 * Normalize form values for the Directus Items API.
 * Empty strings are invalid for JSON/UUID columns (MySQL/MariaDB JSON_VALID CHECK).
 * Directus Admin sends null for cleared optional fields instead of "".
 */
export function sanitizeDocumentPayload(value: unknown): unknown {
  if (value === "") {
    return null;
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDocumentPayload(item));
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return Object.keys(obj).reduce(
      (acc, key) => {
        if (key.startsWith("__")) {
          return acc;
        }
        acc[key] = sanitizeDocumentPayload(obj[key]);
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }

  return value;
}
