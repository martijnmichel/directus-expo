export const parseTemplate = <T>(
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
      data?.id ||
      ""
    );
  });
};
