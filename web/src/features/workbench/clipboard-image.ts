const imageMimeTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  tif: "image/tiff",
  tiff: "image/tiff",
  bmp: "image/bmp",
};

const asImageFile = (file: File | null): File | null => {
  if (!file) return null;
  if (file.type.startsWith("image/")) return file;
  if (file.type) return null;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const type = imageMimeTypes[extension];
  return type ? new File([file], file.name, { type, lastModified: file.lastModified }) : null;
};

export const getClipboardImageFile = (
  clipboardData: DataTransfer | null | undefined
): File | null => {
  for (const item of Array.from(clipboardData?.items ?? [])) {
    if (item.kind !== "file") continue;
    const file = asImageFile(item.getAsFile());
    if (file) return file;
  }
  for (const candidate of Array.from(clipboardData?.files ?? [])) {
    const file = asImageFile(candidate);
    if (file) return file;
  }
  return null;
};
