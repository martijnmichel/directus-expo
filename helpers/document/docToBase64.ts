/**
 * Converts any object to a base64 string
 * @param obj - The object to convert
 * @returns base64 encoded string
 */
export const objectToBase64 = (obj: any): string => {
  try {
    const jsonString = JSON.stringify(obj);
    return btoa(jsonString);
  } catch (error: any) {
    throw new Error("Failed to convert object to base64: " + error.message);
  }
};

/**
 * Converts a base64 string back to an object
 * @param base64String - The base64 string to convert
 * @returns The decoded object
 */
export const base64ToObject = <T = any>(base64String: string): T => {
  try {
    const jsonString = atob(base64String);
    return JSON.parse(jsonString) as T;
  } catch (error: any) {
    throw new Error("Failed to convert base64 to object: " + error.message);
  }
};
