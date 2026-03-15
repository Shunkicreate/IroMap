export type AnalyzeErrorCode =
  | "UNSUPPORTED_CONTENT_TYPE"
  | "PAYLOAD_TOO_LARGE"
  | "PIXEL_COUNT_EXCEEDED"
  | "IMAGE_DECODE_FAILED"
  | "RATE_LIMITED"
  | "ANALYSIS_TIMEOUT"
  | "INTERNAL_ERROR";

export type AnalyzeErrorResponse = {
  error: {
    code: AnalyzeErrorCode;
    message: string;
    details?: Record<string, number | string>;
    retryable: boolean;
  };
};

export type AnalyzeSuccessResponse = {
  input: {
    mimeType: string;
    width: number;
    height: number;
    pixelCount: number;
    colorSpace: string;
  };
  summary: {
    dominantColors: Array<{
      hex: string;
      ratio: number;
      rgb: {
        r: number;
        g: number;
        b: number;
      };
    }>;
    avgBrightness: number;
    avgSaturation: number;
    description: string;
  };
  analysis: {
    temperatureBias: "warm" | "cool" | "neutral";
    saturationBias: "low" | "low_to_mid" | "mid" | "high";
    contrastTrend: "low" | "moderate" | "high";
    shadowColorBias: "warm" | "cool" | "neutral";
    highlightColorBias: "warm" | "cool" | "neutral";
  };
  visualization: {
    rgbCube: {
      sampleCount: number;
      points: Array<{
        rgb: { r: number; g: number; b: number };
        count: number;
        ratio: number;
      }>;
    };
    slice: {
      axis: "r" | "g" | "b";
      value: number;
      points: Array<{
        x: number;
        y: number;
        rgb: { r: number; g: number; b: number };
      }>;
    };
    labScatter: {
      sampleCount: number;
      points: Array<{
        x: number;
        y: number;
        rgb: { r: number; g: number; b: number };
      }>;
    };
    hueHistogram: {
      bins: Array<{ start: number; end: number; count: number }>;
    };
    saturationHistogram: {
      bins: Array<{ start: number; end: number; count: number }>;
    };
    colorAreaRatio: {
      colors: Array<{
        label: string;
        ratio: number;
        hex: string;
        rgb: { r: number; g: number; b: number };
      }>;
    };
  };
  explanations: Array<{
    id: string;
    title: string;
    colorSpace: string;
    axes: string[];
    description: string;
    findings: string;
  }>;
};

export type RateLimitPolicy = {
  ipPerMinute: number;
  maxBodyBytes: number;
  maxPixels: number;
  timeoutMs: number;
};
