import sharp from "sharp";
import { unstable_checkRateLimit as checkRateLimit } from "@vercel/firewall";
import type {
  AnalyzeErrorCode,
  AnalyzeErrorResponse,
  AnalyzeSuccessResponse,
  RateLimitPolicy,
} from "@/domain/photo-analysis/agent-api-contract";
import { analyzePhotoForAgentApi } from "@/domain/photo-analysis/agent-api-presentation";

const supportedMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const maxBodyBytes = 4_000_000;
const maxPixels = 12_000_000;
const timeoutMs = 15_000;
const rateLimitId = "ai-agent-analyze";

type AnalyzePhotoInput = {
  bytes: Uint8Array;
  mimeType: string;
};

const isSupportedMimeType = (mimeType: string): mimeType is (typeof supportedMimeTypes)[number] => {
  return supportedMimeTypes.includes(mimeType as (typeof supportedMimeTypes)[number]);
};

export const createErrorResponse = (
  code: AnalyzeErrorCode,
  message: string,
  details?: Record<string, number | string>,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  retryable = false
): AnalyzeErrorResponse => {
  return {
    error: {
      code,
      message,
      details,
      retryable,
    },
  };
};

const decodeImage = async (
  input: AnalyzePhotoInput
): Promise<{
  width: number;
  height: number;
  imageData: ImageData;
}> => {
  const image = sharp(input.bytes, { failOn: "error" }).rotate();
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (width <= 0 || height <= 0) {
    throw createErrorResponse("IMAGE_DECODE_FAILED", "Failed to decode image dimensions.");
  }

  if (width * height > maxPixels) {
    throw createErrorResponse("PIXEL_COUNT_EXCEEDED", "Image pixel count exceeds the limit.", {
      maxPixels,
      pixelCount: width * height,
    });
  }

  const raw = await image.ensureAlpha().raw().toBuffer();
  const data = new Uint8ClampedArray(raw);

  return {
    width,
    height,
    imageData: { data, width, height } as ImageData,
  };
};

const runWithTimeout = async <T>(work: Promise<T>): Promise<T> => {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        createErrorResponse(
          "ANALYSIS_TIMEOUT",
          "Analysis exceeded the time limit.",
          { timeoutMs },
          true
        )
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export const getAnalyzeLimits = (): RateLimitPolicy => {
  return {
    ipPerMinute: 10,
    maxBodyBytes,
    maxPixels,
    timeoutMs,
  };
};

export const checkAnalyzeRateLimit = async (request: Request): Promise<boolean> => {
  const host =
    request.headers.get("host") ?? request.headers.get("x-forwarded-host") ?? "localhost:3000";
  const result = await checkRateLimit(rateLimitId, {
    request,
    firewallHostForDevelopment: host,
  });

  return result.rateLimited;
};

export const validateAnalyzeRequest = (
  mimeType: string | null,
  bodySize?: number
): AnalyzeErrorResponse | null => {
  if (!mimeType || !isSupportedMimeType(mimeType)) {
    return createErrorResponse(
      "UNSUPPORTED_CONTENT_TYPE",
      "Supported content types are image/jpeg, image/png, and image/webp."
    );
  }

  if (bodySize !== undefined && bodySize <= 0) {
    return createErrorResponse("IMAGE_DECODE_FAILED", "Image body is empty.");
  }

  if (bodySize !== undefined && bodySize > maxBodyBytes) {
    return createErrorResponse(
      "PAYLOAD_TOO_LARGE",
      "Image body exceeds the maximum allowed size.",
      {
        maxBodyBytes,
        bodySize,
      }
    );
  }

  return null;
};

export const analyzeImageBytes = async (
  input: AnalyzePhotoInput
): Promise<AnalyzeSuccessResponse | AnalyzeErrorResponse> => {
  try {
    const decoded = await runWithTimeout(decodeImage(input));
    return await runWithTimeout(
      Promise.resolve(
        analyzePhotoForAgentApi({
          imageData: decoded.imageData,
          mimeType: input.mimeType,
          width: decoded.width,
          height: decoded.height,
        })
      )
    );
  } catch (error) {
    if (typeof error === "object" && error !== null && "error" in error) {
      return error as AnalyzeErrorResponse;
    }

    if (error instanceof Error && error.message.length > 0) {
      return createErrorResponse("IMAGE_DECODE_FAILED", "Failed to decode image bytes.");
    }

    return createErrorResponse(
      "INTERNAL_ERROR",
      "Unexpected server error during analysis.",
      undefined,
      true
    );
  }
};

export const renderHtmlFromAnalyzeResponse = (result: AnalyzeSuccessResponse): string => {
  const summaryItems = [
    ["Image size", `${result.input.width} x ${result.input.height}`],
    ["Color space", result.input.colorSpace],
    ["Dominant colors", result.summary.dominantColors.map((color) => color.hex).join(", ")],
    ["Average brightness", String(result.summary.avgBrightness)],
    ["Average saturation", String(result.summary.avgSaturation)],
    ["Description", result.summary.description],
  ];

  const escapeHtml = (value: string): string => {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  };

  const explanationSections = result.explanations
    .map((item) => {
      return `<section><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description)}</p><p>${escapeHtml(
        item.findings
      )}</p></section>`;
    })
    .join("");

  return `<!doctype html><html lang="en"><body><article><h1>IroMap image analysis result</h1><section><h2>Analysis summary</h2><dl>${summaryItems
    .map(([term, value]) => `<dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd>`)
    .join("")}</dl></section>${explanationSections}</article></body></html>`;
};
