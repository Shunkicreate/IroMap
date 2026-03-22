import type { PhotoAnalysisResult } from "@/domain/photo-analysis/photo-analysis";
import { t } from "@/i18n/translate";

const hueDiverseThreshold = 8;
const hueModerateThreshold = 4;
const saturationHighThreshold = 0.55;
const saturationLowThreshold = 0.25;

export const getHueInsightLabel = (result: PhotoAnalysisResult): string => {
  const activeBins = result.hueHistogram.filter((bin) => bin.count > 0).length;
  if (activeBins >= hueDiverseThreshold) {
    return t("photoInsightHueBalanced");
  }
  if (activeBins >= hueModerateThreshold) {
    return t("photoInsightHueModerate");
  }
  return t("photoInsightHueNarrow");
};

export const getSaturationInsightLabel = (result: PhotoAnalysisResult): string => {
  const total = result.saturationHistogram.reduce((sum, bin) => sum + bin.count, 0);
  if (total === 0) {
    return t("photoInsightSatMid");
  }

  const weighted = result.saturationHistogram.reduce((sum, bin) => {
    const mid = (bin.start + bin.end) / 2;
    return sum + mid * bin.count;
  }, 0);

  const mean = weighted / total;
  if (mean >= saturationHighThreshold) {
    return t("photoInsightSatHigh");
  }
  if (mean <= saturationLowThreshold) {
    return t("photoInsightSatLow");
  }
  return t("photoInsightSatMid");
};
