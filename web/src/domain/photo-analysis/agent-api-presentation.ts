import { rgbToHsl } from "@/domain/color/color-conversion";
import { rgbToHex } from "@/domain/color/color-format";
import { toRgbColor } from "@/domain/color/color-types";
import type {
  AnalyzeSuccessResponse,
  VisualizationExplanation,
} from "@/domain/photo-analysis/agent-api-contract";
import {
  analyzePhoto,
  type PhotoAnalysisResult,
  type PhotoAnalysisSummary,
} from "@/domain/photo-analysis/photo-analysis";

const defaultSliceAxis = "r";
const defaultSliceValue = 128;
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

const determineTemperatureBias = (
  warmCount: number,
  coolCount: number
): "warm" | "cool" | "neutral" => {
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

export const summarizeImageData = (imageData: ImageData): SummarySampleStats => {
  const pixels = imageData.data.length / 4;
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

  for (let index = 0; index < imageData.data.length; index += 4 * step) {
    const alpha = imageData.data[index + 3];
    if (alpha === 0) {
      continue;
    }

    const color = toRgbColor(imageData.data[index], imageData.data[index + 1], imageData.data[index + 2]);
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
): VisualizationExplanation[] => {
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

export const toAnalyzeSuccessResponse = ({
  analysis,
  mimeType,
  summary,
  width,
  height,
}: {
  analysis: PhotoAnalysisResult;
  mimeType: string;
  summary: PhotoAnalysisSummary;
  width: number;
  height: number;
}): AnalyzeSuccessResponse => {
  const saturationBias = determineSaturationBias(summary.avgSaturation);
  const contrastTrend = determineContrastTrend(summary.brightnessSpread);
  const description = buildSummaryDescription(
    summary.temperatureBias,
    saturationBias,
    contrastTrend,
    summary.shadowColorBias
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
        rgb: {
          r: area.rgb.r,
          g: area.rgb.g,
          b: area.rgb.b,
        },
      })),
      avgBrightness: summary.avgBrightness,
      avgSaturation: summary.avgSaturation,
      description,
    },
    analysis: {
      temperatureBias: summary.temperatureBias,
      saturationBias,
      contrastTrend,
      shadowColorBias: summary.shadowColorBias,
      highlightColorBias: summary.highlightColorBias,
    },
    visualization: {
      rgbCube: {
        sampleCount: analysis.sampledPixels,
        points: analysis.cubePoints.map((point) => ({
          rgb: {
            r: point.color.r,
            g: point.color.g,
            b: point.color.b,
          },
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
          rgb: {
            r: point.color.r,
            g: point.color.g,
            b: point.color.b,
          },
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
          rgb: {
            r: area.rgb.r,
            g: area.rgb.g,
            b: area.rgb.b,
          },
        })),
      },
    },
    explanations: buildExplanations(analysis, description),
  };
};

export const analyzePhotoForAgentApi = ({
  imageData,
  mimeType,
  width,
  height,
}: {
  imageData: ImageData;
  mimeType: string;
  width: number;
  height: number;
}): AnalyzeSuccessResponse => {
  const analysis = analyzePhoto(imageData);
  const summary = summarizeImageData(imageData);

  return toAnalyzeSuccessResponse({
    analysis,
    mimeType,
    summary,
    width,
    height,
  });
};
