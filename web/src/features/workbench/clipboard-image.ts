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

export type ClipboardImageReadStage = "unsupported" | "clipboard-read" | "image-data";

export class ClipboardImageReadError extends Error {
  constructor(
    readonly stage: ClipboardImageReadStage,
    readonly originalError?: unknown
  ) {
    super(`clipboard-image-${stage}`);
    this.name = "ClipboardImageReadError";
  }
}

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

export const getClipboardImageFileFromItems = async (): Promise<File | null> => {
  if (!navigator.clipboard?.read) throw new ClipboardImageReadError("unsupported");
  // Start reading inside the button's user gesture, before any asynchronous work.
  let clipboardItems: ClipboardItem[];
  try {
    clipboardItems = await navigator.clipboard.read();
  } catch (error) {
    throw new ClipboardImageReadError("clipboard-read", error);
  }
  let lastError: unknown;
  let hasImageReadError = false;
  for (const item of clipboardItems) {
    const types = item.types.filter((type) => type.startsWith("image/"));
    const orderedTypes = types.includes("image/png")
      ? ["image/png", ...types.filter((type) => type !== "image/png")]
      : types;
    for (const type of orderedTypes) {
      try {
        const blob = await item.getType(type);
        return new File(
          [blob],
          `clipboard-image.${type === "image/jpeg" ? "jpg" : type.split("/")[1]}`,
          {
            type,
            lastModified: Date.now(),
          }
        );
      } catch (error) {
        lastError = error;
        hasImageReadError = true;
      }
    }
  }
  if (hasImageReadError) throw new ClipboardImageReadError("image-data", lastError);
  return null;
};
