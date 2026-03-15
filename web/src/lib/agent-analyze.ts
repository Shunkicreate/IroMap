import sharp from "sharp";
import { unstable_checkRateLimit as checkRateLimit } from "@vercel/firewall";
import { rgbToHex } from "@/domain/color/color-format";
import { rgbToHsl } from "@/domain/color/color-conversion";
import { toRgbColor, type RgbColor } from "@/domain/color/color-types";
import { analyzePhoto, type PhotoAnalysisResult } from "@/domain/photo-analysis/photo-analysis";
import type {
  AnalyzeErrorCode,
  AnalyzeErrorResponse,
  AnalyzeSuccessResponse,
  RateLimitPolicy,
} from "@/lib/agent-analyze-schema";

const supportedMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const maxBodyBytes = 4_000_000;
const maxPixels = 12_000_000;
const timeoutMs = 15_000;
const defaultSliceAxis = "r";
const defaultSliceValue = 128;
const rateLimitId = "ai-agent-analyze";
const maxExplanationPoints = 3;
const percentScale = 100;
const brightnessDivisor = 255;
const shadowLightnessThreshold = 35;
const highlightLightnessThreshold = 70;
const saturationLowThreshold = 28;
const saturationMidThreshold = 55;
const contrastLowThreshold = 18;
const contrastHighThreshold = 42;
const warmHueMin = 330;
const warmHueMax = 60;
const neutralThreshold = 0.12;
const minimumSamples = 1;
const desiredSummarySamples = 20_000;

type AnalyzePhotoInput = {
  bytes: Uint8Array;
  mimeType: string;
};

type SummarySampleStats = {
  avgBrightness: number;
  avgSaturation: number;
  brightnessSpread: number;
  temperatureBias: "warm" | "cool" | "neutral";
  shadowColorBias: "warm" | "cool" | "neutral";
  highlightColorBias: "warm" | "cool" | "neutral";
};

const roundTo = (value: number, precision: number): number => {
  const scale = 10 ** precision;
  return Math.round(value * scale) / scale;
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

const determineTemperatureBias = (warmCount: number, coolCount: number): "warm" | "cool" | "neutral" => {
  const total = warmCount + coolCount;
  if (total <= 0) {
    return "neutral";
  }

  const warmRatio = warmCount / total;
  if (warmRatio >= 0.5 + neutralThreshold) {
    return "warm";
  }
  if (warmRatio <= 0.5 - neutralThreshold) {
    return "cool";
  }
  return "neutral";
};

const isWarmHue = (hue: number): boolean => {
  return hue >= warmHueMin || hue < warmHueMax;
};

const computeSummaryStats = (rgba: Uint8ClampedArray): SummarySampleStats => {
  const pixels = rgba.length / 4;
  const step = Math.max(minimumSamples, Math.ceil(pixels / desiredSummarySamples));

  let sampled = 0;
  let brightnessTotal = 0;
  let saturationTotal = 0;
  let brightnessSquares = 0;
  let warmCount = 0;
  let coolCount = 0;
  let shadowWarm = 0;
  let shadowCool = 0;
  let highlightWarm = 0;
  let highlightCool = 0;

  for (let index = 0; index < rgba.length; index += 4 * step) {
    const alpha = rgba[index + 3];
    if (alpha === 0) {
      continue;
    }

    const color = toRgbColor(rgba[index], rgba[index + 1], rgba[index + 2]);
    const hsl = rgbToHsl(color);
    const brightness = ((color.r + color.g + color.b) / 3 / brightnessDivisor) * percentScale;
    const saturation = hsl.s;

    brightnessTotal += brightness;
    saturationTotal += saturation;
    brightnessSquares += brightness * brightness;
    sampled += 1;

    if (saturation > 10) {
      if (isWarmHue(hsl.h)) {
        warmCount += 1;
        if (hsl.l <= shadowLightnessThreshold) {
          shadowWarm += 1;
        }
        if (hsl.l >= highlightLightnessThreshold) {
          highlightWarm += 1;
        }
      } else {
        coolCount += 1;
        if (hsl.l <= shadowLightnessThreshold) {
          shadowCool += 1;
        }
        if (hsl.l >= highlightLightnessThreshold) {
          highlightCool += 1;
        }
      }
    }
  }

  if (sampled === 0) {
    return {
      avgBrightness: 0,
      avgSaturation: 0,
      brightnessSpread: 0,
      temperatureBias: "neutral",
      shadowColorBias: "neutral",
      highlightColorBias: "neutral",
    };
  }

  const avgBrightness = brightnessTotal / sampled;
  const avgSaturation = saturationTotal / sampled;
  const variance = brightnessSquares / sampled - avgBrightness * avgBrightness;

  return {
    avgBrightness: roundTo(avgBrightness, 1),
    avgSaturation: roundTo(avgSaturation, 1),
    brightnessSpread: roundTo(Math.sqrt(Math.max(0, variance)), 1),
    temperatureBias: determineTemperatureBias(warmCount, coolCount),
    shadowColorBias: determineTemperatureBias(shadowWarm, shadowCool),
    highlightColorBias: determineTemperatureBias(highlightWarm, highlightCool),
  };
};

const determineSaturationBias = (avgSaturation: number): "low" | "low_to_mid" | "mid" | "high" => {
  if (avgSaturation < saturationLowThreshold) {
    return "low";
  }
  if (avgSaturation < saturationMidThreshold) {
    return "low_to_mid";
  }
  if (avgSaturation < 72) {
    return "mid";
  }
  return "high";
};

const determineContrastTrend = (spread: number): "low" | "moderate" | "high" => {
  if (spread < contrastLowThreshold) {
    return "low";
  }
  if (spread < contrastHighThreshold) {
    return "moderate";
  }
  return "high";
};

const colorToPlainRgb = (color: RgbColor): { r: number; g: number; b: number } => {
  return { r: color.r, g: color.g, b: color.b };
};

const describeTemperature = (bias: "warm" | "cool" | "neutral"): string => {
  if (bias === "warm") {
    return "暖色寄り";
  }
  if (bias === "cool") {
    return "寒色寄り";
  }
  return "中立寄り";
};

const describeSaturation = (bias: "low" | "low_to_mid" | "mid" | "high"): string => {
  if (bias === "low") {
    return "低彩度中心";
  }
  if (bias === "low_to_mid") {
    return "低から中彩度中心";
  }
  if (bias === "mid") {
    return "中彩度中心";
  }
  return "高彩度中心";
};

const describeContrast = (trend: "low" | "moderate" | "high"): string => {
  if (trend === "low") {
    return "コントラストは穏やか";
  }
  if (trend === "high") {
    return "コントラストは強め";
  }
  return "コントラストは中程度";
};

const buildSummaryDescription = (
  temperatureBias: "warm" | "cool" | "neutral",
  saturationBias: "low" | "low_to_mid" | "mid" | "high",
  contrastTrend: "low" | "moderate" | "high",
  shadowColorBias: "warm" | "cool" | "neutral"
): string => {
  const fragments = [
    describeSaturation(saturationBias),
    describeTemperature(temperatureBias),
    describeContrast(contrastTrend),
  ];

  if (shadowColorBias !== "neutral") {
    fragments.push(`暗部は${describeTemperature(shadowColorBias).replace("寄り", "")}`);
  }

  return fragments.join("、");
};

const buildExplanations = (
  analysis: PhotoAnalysisResult,
  description: string
): AnalyzeSuccessResponse["explanations"] => {
  const topCube = analysis.cubePoints
    .slice(0, maxExplanationPoints)
    .map((point) => rgbToHex(point.color))
    .join(", ");

  return [
    {
      id: "summary",
      title: "解析サマリー",
      colorSpace: "sRGB",
      axes: ["dominant colors", "brightness", "saturation"],
      description: "主要色と統計値から画像全体の色傾向を要約する",
      findings: description,
    },
    {
      id: "rgb-cube",
      title: "RGB Cube 分布",
      colorSpace: "RGB",
      axes: ["R", "G", "B"],
      description: "RGB立方体内で色の分布密度を見る",
      findings: topCube ? `主要な量子化色は ${topCube}` : "分布は限定的",
    },
    {
      id: "lab-scatter",
      title: "Lab Scatter",
      colorSpace: "Lab",
      axes: ["a*", "b*"],
      description: "色相方向の広がりとクラスタ偏りを見る",
      findings:
        analysis.scatter.length > 0
          ? `有効サンプル ${analysis.scatter.length} 点で色分布を確認できる`
          : "有効サンプルが少ない",
    },
  ];
};

const toSuccessResponse = (
  analysis: PhotoAnalysisResult,
  mimeType: string,
  width: number,
  height: number,
  summaryStats: SummarySampleStats
): AnalyzeSuccessResponse => {
  const saturationBias = determineSaturationBias(summaryStats.avgSaturation);
  const contrastTrend = determineContrastTrend(summaryStats.brightnessSpread);
  const description = buildSummaryDescription(
    summaryStats.temperatureBias,
    saturationBias,
    contrastTrend,
    summaryStats.shadowColorBias
  );

  return {
    input: {
      mimeType,
      width,
      height,
      pixelCount: width * height,
      colorSpace: "sRGB",
    },
    summary: {
      dominantColors: analysis.colorAreas.map((area) => ({
        hex: rgbToHex(area.rgb),
        ratio: roundTo(area.ratio / percentScale, 4),
        rgb: colorToPlainRgb(area.rgb),
      })),
      avgBrightness: summaryStats.avgBrightness,
      avgSaturation: summaryStats.avgSaturation,
      description,
    },
    analysis: {
      temperatureBias: summaryStats.temperatureBias,
      saturationBias,
      contrastTrend,
      shadowColorBias: summaryStats.shadowColorBias,
      highlightColorBias: summaryStats.highlightColorBias,
    },
    visualization: {
      rgbCube: {
        sampleCount: analysis.sampledPixels,
        points: analysis.cubePoints.map((point) => ({
          rgb: colorToPlainRgb(point.color),
          count: point.count,
          ratio: roundTo(point.ratio, 4),
        })),
      },
      slice: {
        axis: defaultSliceAxis,
        value: defaultSliceValue,
        points: [],
      },
      labScatter: {
        sampleCount: analysis.scatter.length,
        points: analysis.scatter.map((point) => ({
          x: roundTo(point.x, 2),
          y: roundTo(point.y, 2),
          rgb: colorToPlainRgb(point.color),
        })),
      },
      hueHistogram: {
        bins: analysis.hueHistogram.map((bin) => ({
          start: roundTo(bin.start, 2),
          end: roundTo(bin.end, 2),
          count: bin.count,
        })),
      },
      saturationHistogram: {
        bins: analysis.saturationHistogram.map((bin) => ({
          start: roundTo(bin.start, 2),
          end: roundTo(bin.end, 2),
          count: bin.count,
        })),
      },
      colorAreaRatio: {
        colors: analysis.colorAreas.map((area) => ({
          label: area.label,
          ratio: roundTo(area.ratio / percentScale, 4),
          hex: rgbToHex(area.rgb),
          rgb: colorToPlainRgb(area.rgb),
        })),
      },
    },
    explanations: buildExplanations(analysis, description),
  };
};

const decodeImage = async (input: AnalyzePhotoInput): Promise<{
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
      reject(createErrorResponse("ANALYSIS_TIMEOUT", "Analysis exceeded the time limit.", { timeoutMs }, true));
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
  const host = request.headers.get("host") ?? request.headers.get("x-forwarded-host") ?? "localhost:3000";
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
    return createErrorResponse("PAYLOAD_TOO_LARGE", "Image body exceeds the maximum allowed size.", {
      maxBodyBytes,
      bodySize,
    });
  }

  return null;
};

export const analyzeImageBytes = async (
  input: AnalyzePhotoInput
): Promise<AnalyzeSuccessResponse | AnalyzeErrorResponse> => {
  try {
    const decoded = await runWithTimeout(decodeImage(input));
    const summaryStats = computeSummaryStats(decoded.imageData.data);
    const analysis = await runWithTimeout(Promise.resolve(analyzePhoto(decoded.imageData)));

    return toSuccessResponse(analysis, input.mimeType, decoded.width, decoded.height, summaryStats);
  } catch (error) {
    if (typeof error === "object" && error !== null && "error" in error) {
      return error as AnalyzeErrorResponse;
    }

    if (error instanceof Error && error.message.length > 0) {
      return createErrorResponse("IMAGE_DECODE_FAILED", "Failed to decode image bytes.");
    }

    return createErrorResponse("INTERNAL_ERROR", "Unexpected server error during analysis.", undefined, true);
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
