export const isImageType = (type: string) => {
  const validImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/tiff",
  ];
  return validImageTypes.includes(type.toLowerCase());
};
