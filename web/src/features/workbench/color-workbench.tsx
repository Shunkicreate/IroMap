"use client";

import NextImage from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { GraphFrame } from "@/components/graph/graph-frame";
import { PanelHeader } from "@/components/workbench/panel-header";
import { ColorSwatch } from "@/components/workbench/color-swatch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatHsl, formatRgb, rgbToHex } from "@/domain/color/color-format";
import { deltaE76, rgbToLab } from "@/domain/color/color-conversion";
import {
  toRgbColor,
  type ColorSpace3d,
  type RgbColor,
  type SliceAxis,
} from "@/domain/color/color-types";
import {
  buildCubePointsFromSamples,
  buildHistogramBins,
  buildMetricRows,
  buildPointSelection,
  buildRectangleSelection,
  getScopedSamples,
  serializeHistogramBins,
  serializeMetricRows,
  type ExportFormat,
  type PhotoAnalysisResult,
  type PhotoSample,
  type SelectionScope,
  type SelectionSlot,
  type TargetSelectionState,
  type WorkbenchHistogramMetric,
  type WorkbenchMetricRow,
} from "@/domain/photo-analysis/photo-analysis";
import {
  analyzePhotoInWorker,
  readFileAsImageData,
} from "@/features/photo-analysis/photo-analysis-client";
import { ColorInspector } from "@/features/inspector/color-inspector";
import { RgbCubeCanvas } from "@/features/rgb-cube/rgb-cube-canvas";
import { SliceCanvas } from "@/features/slice/slice-canvas";
import { t } from "@/i18n/translate";

type Rotation = {
  x: number;
  y: number;
};

type RgbCubeOverlayMode = "grid" | "image" | "both";

type WorkbenchTarget = {
  targetId: string;
  label: string;
  file: File | null;
  result: PhotoAnalysisResult | null;
  previewUrl: string;
  statusMessage: string;
  error: string;
  isAnalyzing: boolean;
};

type HoverState = {
  targetId: string;
  sample: PhotoSample | null;
  source: "preview" | "cube" | "slice";
};

type SelectionDraft = {
  originXRatio: number;
  originYRatio: number;
  currentXRatio: number;
  currentYRatio: number;
} | null;

const defaultSliceValue = 128;
const defaultRotation: Rotation = { x: -0.7, y: 0.6 };
const defaultCubeSize = 520;
const clipboardImageFileName = "clipboard-image.png";
const histogramHeightPercent = 100;
const histogramMinHeightPercent = 3;
const fileSummaryPrecision = 1;
const ratioFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const defaultSelectionState: TargetSelectionState = {
  activeSelectionSlot: "A",
  selectionA: null,
  selectionB: null,
};
const histogramChartViewboxWidth = 100;
const histogramChartViewboxHeight = 100;

const emptyTarget = (targetId: string, label: string): WorkbenchTarget => ({
  targetId,
  label,
  file: null,
  result: null,
  previewUrl: "",
  statusMessage: "",
  error: "",
  isAnalyzing: false,
});

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const getAxisRange = (axis: SliceAxis): { min: number; max: number } => {
  if (axis === "h") {
    return { min: 0, max: 360 };
  }
  if (axis === "s" || axis === "l" || axis === "lab-l") {
    return { min: 0, max: 100 };
  }
  if (axis === "lab-a" || axis === "lab-b") {
    return { min: -128, max: 127 };
  }
  return { min: 0, max: 255 };
};

const mapAxisValue = (
  value: number,
  sourceRange: { min: number; max: number },
  targetRange: { min: number; max: number }
): number => {
  const sourceSpan = sourceRange.max - sourceRange.min;
  if (sourceSpan === 0) {
    return targetRange.min;
  }
  const ratio = (value - sourceRange.min) / sourceSpan;
  return Math.round(targetRange.min + (targetRange.max - targetRange.min) * ratio);
};

const createBucketKey = (color: RgbColor): string => {
  return `${Math.floor(color.r / 16)}-${Math.floor(color.g / 16)}-${Math.floor(color.b / 16)}`;
};

const buildSampleBuckets = (result: PhotoAnalysisResult | null): Map<string, PhotoSample[]> => {
  const buckets = new Map<string, PhotoSample[]>();
  if (!result) {
    return buckets;
  }
  for (const sample of result.samples) {
    const key = createBucketKey(sample.color);
    const current = buckets.get(key);
    if (current) {
      current.push(sample);
    } else {
      buckets.set(key, [sample]);
    }
  }
  return buckets;
};

const findNearestSampleByColor = (
  result: PhotoAnalysisResult | null,
  buckets: Map<string, PhotoSample[]>,
  color: RgbColor | null
): PhotoSample | null => {
  if (!result || !color) {
    return null;
  }

  const bucket = buckets.get(createBucketKey(color)) ?? result.samples.slice(0, 256);
  if (bucket.length === 0) {
    return null;
  }

  const targetLab = rgbToLab(color);
  let nearest = bucket[0] ?? null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const sample of bucket) {
    const distance = deltaE76(sample.lab, targetLab);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = sample;
    }
  }

  return nearest;
};

const findNearestSampleByCoordinate = (
  result: PhotoAnalysisResult | null,
  x: number,
  y: number
): PhotoSample | null => {
  if (!result) {
    return null;
  }

  let nearest = result.samples[0] ?? null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const sample of result.samples) {
    const dx = sample.x - x;
    const dy = sample.y - y;
    const distance = dx * dx + dy * dy;
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = sample;
    }
  }
  return nearest;
};

const getSelectionBySlot = (
  selectionState: TargetSelectionState | undefined,
  slot: SelectionSlot
) => {
  return slot === "A" ? (selectionState?.selectionA ?? null) : (selectionState?.selectionB ?? null);
};

const formatMetricValue = (row: WorkbenchMetricRow, value: number | null): string => {
  if (value == null) {
    return "N/A";
  }
  if (row.unit === "%") {
    return `${value.toFixed(row.precision)}%`;
  }
  return value.toFixed(row.precision);
};

const getHueInsightLabel = (result: PhotoAnalysisResult): string => {
  const activeBins = result.hueHistogram.filter((bin) => bin.count > 0).length;
  if (activeBins >= 8) {
    return t("photoInsightHueBalanced");
  }
  if (activeBins >= 4) {
    return t("photoInsightHueModerate");
  }
  return t("photoInsightHueNarrow");
};

const getSaturationInsightLabel = (result: PhotoAnalysisResult): string => {
  const total = result.saturationHistogram.reduce((sum, bin) => sum + bin.count, 0);
  if (total === 0) {
    return t("photoInsightSatMid");
  }

  const weighted = result.saturationHistogram.reduce((sum, bin) => {
    return sum + ((bin.start + bin.end) / 2) * bin.count;
  }, 0);
  const mean = weighted / total;
  if (mean >= 0.55) {
    return t("photoInsightSatHigh");
  }
  if (mean <= 0.25) {
    return t("photoInsightSatLow");
  }
  return t("photoInsightSatMid");
};

const renderHistogramChart = ({
  bins,
  className = "",
}: {
  bins: ReturnType<typeof buildHistogramBins>;
  className?: string;
}) => {
  const maxCount = Math.max(1, ...bins.map((bin) => bin.count));
  const barWidth = histogramChartViewboxWidth / Math.max(1, bins.length);

  const renderSeries = (
    series: typeof bins,
    fill: string,
    opacity: number,
    widthRatio: number,
    xOffset: number
  ) =>
    series.map((bin, index) => {
      const height = Math.max(
        histogramMinHeightPercent,
        (bin.count / maxCount) * histogramHeightPercent
      );

      return (
        <rect
          key={`${fill}-${bin.metric}-${bin.binIndex}`}
          className="histogramBar"
          x={index * barWidth + xOffset}
          y={histogramChartViewboxHeight - height}
          width={Math.max(barWidth * widthRatio, 1)}
          height={height}
          fill={fill}
          opacity={opacity}
          rx="0.5"
          ry="0.5"
        >
          <title>{`${bin.start.toFixed(2)}-${bin.end.toFixed(2)}: ${bin.count}`}</title>
        </rect>
      );
    });

  return (
    <svg
      viewBox={`0 0 ${histogramChartViewboxWidth} ${histogramChartViewboxHeight}`}
      className={`histogramBars${className ? ` ${className}` : ""}`}
      role="img"
      preserveAspectRatio="none"
    >
      {renderSeries(bins, "#7bf0b8", 0.85, 0.8, barWidth * 0.1)}
    </svg>
  );
};

type PreviewPanelProps = {
  target: WorkbenchTarget;
  hoverSample: PhotoSample | null;
  selectedSamples: PhotoSample[];
  selectionState: TargetSelectionState;
  selectionDraft: SelectionDraft;
  onHoverSampleChange: (sample: PhotoSample | null) => void;
  onSelectionDraftChange: (draft: SelectionDraft) => void;
  onSelectionCommit: (bounds: { x: number; y: number; width: number; height: number }) => void;
  onSampleSelect: (sample: PhotoSample) => void;
  onSourceFileSelected: (file: File | null) => void;
  onPaste: (event: React.ClipboardEvent<HTMLButtonElement>) => void;
};

function PreviewPanel({
  target,
  hoverSample,
  selectedSamples,
  selectionState,
  selectionDraft,
  onHoverSampleChange,
  onSelectionDraftChange,
  onSelectionCommit,
  onSampleSelect,
  onSourceFileSelected,
  onPaste,
}: PreviewPanelProps) {
  const imageWrapRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const getPreviewBounds = (): DOMRect | null => {
    if (imageRef.current) {
      return imageRef.current.getBoundingClientRect();
    }
    return imageWrapRef.current?.getBoundingClientRect() ?? null;
  };

  const mapPointerToSample = (
    event: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
  ): PhotoSample | null => {
    if (!target.result) {
      return null;
    }
    const bounds = getPreviewBounds();
    if (!bounds) {
      return null;
    }
    const x = ((event.clientX - bounds.left) / bounds.width) * target.result.width;
    const y = ((event.clientY - bounds.top) / bounds.height) * target.result.height;
    return findNearestSampleByCoordinate(target.result, x, y);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!target.result) {
      return;
    }
    const bounds = getPreviewBounds();
    if (!bounds) {
      return;
    }
    onSelectionDraftChange({
      originXRatio: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
      originYRatio: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
      currentXRatio: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
      currentYRatio: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    const sample = mapPointerToSample(event);
    onHoverSampleChange(sample);

    if (!selectionDraft) {
      return;
    }
    const bounds = getPreviewBounds();
    if (!bounds) {
      return;
    }
    onSelectionDraftChange({
      ...selectionDraft,
      currentXRatio: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
      currentYRatio: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
    });
  };

  const commitDraft = (
    event: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
  ): void => {
    if (!selectionDraft || !target.result) {
      return;
    }
    const leftRatio = Math.min(selectionDraft.originXRatio, selectionDraft.currentXRatio);
    const topRatio = Math.min(selectionDraft.originYRatio, selectionDraft.currentYRatio);
    const widthRatio = Math.abs(selectionDraft.currentXRatio - selectionDraft.originXRatio);
    const heightRatio = Math.abs(selectionDraft.currentYRatio - selectionDraft.originYRatio);

    onSelectionDraftChange(null);
    if (widthRatio * target.result.width < 4 || heightRatio * target.result.height < 4) {
      const sample = mapPointerToSample(event);
      if (sample) {
        onSampleSelect(sample);
      }
      return;
    }

    onSelectionCommit({
      x: leftRatio * target.result.width,
      y: topRatio * target.result.height,
      width: widthRatio * target.result.width,
      height: heightRatio * target.result.height,
    });
  };

  const renderSelectionBox = (slot: SelectionSlot) => {
    const selection = getSelectionBySlot(selectionState, slot);
    if (!selection?.bounds || !target.result) {
      return null;
    }
    return (
      <rect
        key={slot}
        className={`previewSelectionBox previewSelectionBox${slot}`}
        x={selection.bounds.x}
        y={selection.bounds.y}
        width={selection.bounds.width}
        height={selection.bounds.height}
        rx="4"
        ry="4"
      />
    );
  };
  const draftRect =
    selectionDraft && target.result
      ? {
          x:
            Math.min(selectionDraft.originXRatio, selectionDraft.currentXRatio) *
            target.result.width,
          y:
            Math.min(selectionDraft.originYRatio, selectionDraft.currentYRatio) *
            target.result.height,
          width:
            Math.abs(selectionDraft.currentXRatio - selectionDraft.originXRatio) *
            target.result.width,
          height:
            Math.abs(selectionDraft.currentYRatio - selectionDraft.originYRatio) *
            target.result.height,
        }
      : null;
  const hoverMarker =
    hoverSample && target.result
      ? {
          x: hoverSample.x,
          y: hoverSample.y,
        }
      : null;
  const previewResult = target.result;
  const selectedMarkers = previewResult
    ? selectedSamples.map((sample) => ({
        sampleId: sample.sampleId,
        x: sample.x,
        y: sample.y,
      }))
    : [];
  const markerRadius = previewResult
    ? Math.max(4, Math.min(previewResult.width, previewResult.height) * 0.01)
    : 5;

  return (
    <section className="panel previewWorkbenchPanel">
      <PanelHeader titleKey="photoPreviewTitle" requirementsKey="panelPhotoAnalysisRequirements" />
      <div className="photoUploadCta">
        <div className="photoUploadCtaCopy">
          <strong>{t("photoUploadCtaTitle")}</strong>
          <p>{t("photoUploadCtaDescription")}</p>
          {target.file ? (
            <p className="photoUploadCtaStatus">
              {t("photoUploadSelected", { fileName: target.file.name })}
            </p>
          ) : null}
        </div>
        <label className="photoUploadButton">
          <span>{t("photoUploadButton")}</span>
          <input
            type="file"
            accept="image/*"
            aria-label={t("photoUploadLabel")}
            className="srOnly"
            onChange={(event) => onSourceFileSelected(event.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      <div className="previewAuxActions">
        <button
          type="button"
          className="photoPasteZone"
          onPaste={onPaste}
          aria-label={t("photoPasteZoneLabel")}
        >
          <strong>{t("photoPasteZoneTitle")}</strong>
          <p>{t("photoPasteZoneHint")}</p>
        </button>
      </div>

      <div
        ref={imageWrapRef}
        className="previewImageStage"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={commitDraft}
        onPointerLeave={() => {
          onHoverSampleChange(null);
          onSelectionDraftChange(null);
        }}
      >
        {target.previewUrl ? (
          <NextImage
            src={target.previewUrl}
            alt={t("photoPreviewAlt", { fileName: target.file?.name ?? t("photoUploadLabel") })}
            className="photoPreviewImage"
            ref={imageRef}
            width={640}
            height={480}
            unoptimized
          />
        ) : (
          <div className="photoPreviewEmpty">{t("photoPreviewEmpty")}</div>
        )}
        <svg
          viewBox={`0 0 ${previewResult?.width ?? 100} ${previewResult?.height ?? 100}`}
          className="previewOverlay"
          aria-hidden="true"
        >
          {renderSelectionBox("A")}
          {renderSelectionBox("B")}
          {draftRect ? (
            <rect
              className="previewSelectionDraft"
              x={draftRect.x}
              y={draftRect.y}
              width={draftRect.width}
              height={draftRect.height}
              rx="4"
              ry="4"
            />
          ) : null}
          {hoverMarker ? (
            <circle
              className="previewHoverMarker"
              cx={hoverMarker.x}
              cy={hoverMarker.y}
              r={markerRadius * 0.75}
            />
          ) : null}
          {selectedMarkers.map((marker) => (
            <circle
              key={marker.sampleId}
              className="previewSelectedMarker"
              cx={marker.x}
              cy={marker.y}
              r={markerRadius}
            />
          ))}
        </svg>
      </div>

      <div className="previewStatusGrid">
        <div>
          <strong>{t("workbenchBaselineLabel")}</strong>
          <p className="muted previewStatusLine">
            {target.statusMessage || (target.file ? t("photoAnalyzing") : t("photoPreviewEmpty"))}
          </p>
          {target.error ? <p className="errorText">{target.error}</p> : null}
        </div>
      </div>
    </section>
  );
}

export function ColorWorkbench() {
  const [baselineTarget, setBaselineTarget] = useState<WorkbenchTarget>(() =>
    emptyTarget("baseline", "Baseline")
  );
  const [selectionStateByTarget, setSelectionStateByTarget] = useState<
    Record<string, TargetSelectionState>
  >({
    baseline: { ...defaultSelectionState },
  });
  const [hoverState, setHoverState] = useState<HoverState>({
    targetId: "baseline",
    sample: null,
    source: "preview",
  });
  const [selectedColor, setSelectedColor] = useState<RgbColor | null>(null);
  const [selectionScope, setSelectionScope] = useState<SelectionScope>("full-image");
  const [sliceMappingScope, setSliceMappingScope] = useState<SelectionScope>("full-image");
  const [copyFormat, setCopyFormat] = useState<ExportFormat>("markdown");
  const [histogramMetric, setHistogramMetric] = useState<WorkbenchHistogramMetric>("luminance");
  const [sliceAxis, setSliceAxis] = useState<SliceAxis>("r");
  const [sliceValue, setSliceValue] = useState<number>(defaultSliceValue);
  const [space, setSpace] = useState<ColorSpace3d>("rgb");
  const [isAxisGuideVisible, setIsAxisGuideVisible] = useState<boolean>(true);
  const [isCubeSizeSliderVisible, setIsCubeSizeSliderVisible] = useState<boolean>(true);
  const [cubeSize, setCubeSize] = useState<number>(defaultCubeSize);
  const [rotation, setRotation] = useState<Rotation>(defaultRotation);
  const [cubeOverlayMode, setCubeOverlayMode] = useState<RgbCubeOverlayMode>("both");
  const [manualR, setManualR] = useState<number>(128);
  const [manualG, setManualG] = useState<number>(128);
  const [manualB, setManualB] = useState<number>(128);
  const [liveMessage, setLiveMessage] = useState<string>("");
  const [selectionDraft, setSelectionDraft] = useState<SelectionDraft>(null);

  const baselineBuckets = useMemo(
    () => buildSampleBuckets(baselineTarget.result),
    [baselineTarget.result]
  );

  useEffect(() => {
    const file = baselineTarget.file;
    let objectUrl = "";
    let isStale = false;
    const loadTarget = async (): Promise<void> => {
      if (!file) {
        setBaselineTarget((current) => ({ ...emptyTarget("baseline", current.label), file: null }));
        return;
      }

      objectUrl = URL.createObjectURL(file);
      setBaselineTarget((current) => ({
        ...current,
        file,
        previewUrl: objectUrl,
        isAnalyzing: true,
        statusMessage: t("photoAnalyzing"),
        error: "",
        result: null,
      }));

      try {
        const imageData = await readFileAsImageData(file);
        const result = await analyzePhotoInWorker(imageData);
        if (isStale) {
          return;
        }
        const success = t("photoSummary", {
          fileName: file.name,
          sampledPixels: result.sampledPixels,
          elapsedMs: result.elapsedMs.toFixed(fileSummaryPrecision),
        });
        setBaselineTarget((current) => ({
          ...current,
          file,
          previewUrl: objectUrl,
          result,
          isAnalyzing: false,
          statusMessage: success,
          error: "",
        }));
      } catch {
        if (isStale) {
          return;
        }
        setBaselineTarget((current) => ({
          ...current,
          file,
          previewUrl: objectUrl,
          result: null,
          isAnalyzing: false,
          statusMessage: t("photoError"),
          error: t("photoError"),
        }));
      }
    };

    void loadTarget();
    return () => {
      isStale = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [baselineTarget.file]);

  const baselineSelectionState = selectionStateByTarget.baseline ?? defaultSelectionState;
  const activeBaselineSelection = getSelectionBySlot(
    baselineSelectionState,
    baselineSelectionState.activeSelectionSlot
  );
  const scopedBaselineSamples = useMemo(
    () =>
      baselineTarget.result
        ? getScopedSamples(baselineTarget.result, baselineSelectionState, selectionScope)
        : [],
    [baselineSelectionState, baselineTarget.result, selectionScope]
  );
  const sliceMappedSamples = useMemo(
    () =>
      baselineTarget.result
        ? getScopedSamples(baselineTarget.result, baselineSelectionState, sliceMappingScope)
        : [],
    [baselineSelectionState, baselineTarget.result, sliceMappingScope]
  );
  const baselineMetricRows = useMemo(
    () =>
      baselineTarget.result
        ? buildMetricRows({
            result: baselineTarget.result,
            selectionState: baselineSelectionState,
            scope: selectionScope,
          })
        : [],
    [baselineTarget.result, baselineSelectionState, selectionScope]
  );
  const baselineHistogram = useMemo(
    () => buildHistogramBins(scopedBaselineSamples, histogramMetric),
    [scopedBaselineSamples, histogramMetric]
  );

  const selectionCubePoints = useMemo(
    () =>
      baselineTarget.result && activeBaselineSelection
        ? buildCubePointsFromSamples(
            getScopedSamples(baselineTarget.result, baselineSelectionState, "selected-region")
          )
        : [],
    [activeBaselineSelection, baselineSelectionState, baselineTarget.result]
  );
  const hoverColor = hoverState.sample?.color ?? null;

  const selectedSample = useMemo(() => {
    if (!baselineTarget.result || !selectedColor) {
      return null;
    }
    return findNearestSampleByColor(baselineTarget.result, baselineBuckets, selectedColor);
  }, [baselineTarget.result, baselineBuckets, selectedColor]);
  const selectedSamples = useMemo(() => {
    if (!baselineTarget.result || !activeBaselineSelection || !selectedSample) {
      return [];
    }

    if (activeBaselineSelection.source === "image-rect") {
      return baselineTarget.result.samples.filter((sample) =>
        activeBaselineSelection.sampleIds.includes(sample.sampleId)
      );
    }

    return baselineTarget.result.samples.filter(
      (sample) =>
        sample.color.r === selectedSample.color.r &&
        sample.color.g === selectedSample.color.g &&
        sample.color.b === selectedSample.color.b
    );
  }, [activeBaselineSelection, baselineTarget.result, selectedSample]);

  const normalizeSliceValueForAxis = (nextAxis: SliceAxis, currentValue: number): number => {
    const nextRange = getAxisRange(nextAxis);
    const currentRange = getAxisRange(sliceAxis);
    if (sliceAxis === nextAxis) {
      return clamp(currentValue, nextRange.min, nextRange.max);
    }
    return clamp(mapAxisValue(currentValue, currentRange, nextRange), nextRange.min, nextRange.max);
  };

  const handleSliceAxisChange = (nextAxis: SliceAxis): void => {
    setSliceAxis(nextAxis);
    setSliceValue(normalizeSliceValueForAxis(nextAxis, sliceValue));
  };

  const handleSpaceChange = (nextSpace: ColorSpace3d): void => {
    setSpace(nextSpace);
    const nextAxis: SliceAxis = nextSpace === "rgb" ? "r" : nextSpace === "hsl" ? "h" : "lab-l";
    setSliceAxis(nextAxis);
    setSliceValue(normalizeSliceValueForAxis(nextAxis, sliceValue));
  };

  const handleSelectionScopeChange = (scope: SelectionScope): void => {
    setSelectionScope(scope);
    setSliceMappingScope(scope);
  };

  const setSelectionForCurrentSlot = (
    selectionFactory: (
      slot: SelectionSlot
    ) => ReturnType<typeof buildPointSelection> | ReturnType<typeof buildRectangleSelection>
  ) => {
    if (!baselineTarget.result) {
      return;
    }
    setSelectionStateByTarget((current) => {
      const state = current.baseline ?? defaultSelectionState;
      const slot = state.activeSelectionSlot;
      const nextSelection = selectionFactory(slot);
      return {
        ...current,
        baseline: {
          ...state,
          selectionA: slot === "A" ? nextSelection : state.selectionA,
          selectionB: slot === "B" ? nextSelection : state.selectionB,
        },
      };
    });
  };

  const handlePreviewSelectionCommit = (bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): void => {
    if (!baselineTarget.result) {
      return;
    }
    setSelectionForCurrentSlot((slot) =>
      buildRectangleSelection({
        result: baselineTarget.result!,
        targetId: baselineTarget.targetId,
        slot,
        bounds,
      })
    );
    handleSelectionScopeChange("selected-region");
    setLiveMessage(t("workbenchSelectionUpdated"));
  };

  const handleColorHover = (color: RgbColor | null, source: HoverState["source"]): void => {
    const sample = findNearestSampleByColor(baselineTarget.result, baselineBuckets, color);
    setHoverState({
      targetId: baselineTarget.targetId,
      sample,
      source,
    });
  };

  const handleColorSelect = (color: RgbColor): void => {
    if (!baselineTarget.result) {
      return;
    }
    const sample = findNearestSampleByColor(baselineTarget.result, baselineBuckets, color);
    setSelectedColor(color);
    if (!sample) {
      return;
    }
    setSelectionForCurrentSlot((slot) =>
      buildPointSelection({
        result: baselineTarget.result!,
        targetId: baselineTarget.targetId,
        slot,
        sampleId: sample.sampleId,
        source: "color-space-pick",
      })
    );
    setLiveMessage(t("workbenchSelectedColorUpdated", { value: rgbToHex(color) }));
  };

  const handlePreviewSampleSelect = (sample: PhotoSample): void => {
    setSelectedColor(sample.color);
    setSelectionForCurrentSlot((slot) =>
      buildPointSelection({
        result: baselineTarget.result!,
        targetId: baselineTarget.targetId,
        slot,
        sampleId: sample.sampleId,
        source: "image-point",
      })
    );
    setLiveMessage(t("workbenchSelectedColorUpdated", { value: rgbToHex(sample.color) }));
  };

  const handleSelectionClear = (): void => {
    setSelectionStateByTarget((current) => {
      const state = current.baseline ?? defaultSelectionState;
      const slot = state.activeSelectionSlot;
      return {
        ...current,
        baseline: {
          ...state,
          selectionA: slot === "A" ? null : state.selectionA,
          selectionB: slot === "B" ? null : state.selectionB,
        },
      };
    });
    handleSelectionScopeChange("full-image");
  };

  const handleSelectionSlotChange = (slot: SelectionSlot): void => {
    setSelectionStateByTarget((current) => ({
      ...current,
      baseline: {
        ...(current.baseline ?? defaultSelectionState),
        activeSelectionSlot: slot,
      },
    }));
  };

  const handleStatusChange = (message: string): void => {
    setLiveMessage(message);
  };

  const handleSourceFileSelected = (file: File | null): void => {
    setBaselineTarget((current) => ({ ...current, file }));
    setSelectedColor(null);
    setHoverState({ targetId: "baseline", sample: null, source: "preview" });
  };

  const handlePhotoPaste = (event: React.ClipboardEvent<HTMLButtonElement>): void => {
    const items = Array.from(event.clipboardData?.items ?? []);
    const imageItem = items.find((item) => item.kind === "file" && item.type.startsWith("image/"));
    const file = imageItem?.getAsFile();
    if (!file) {
      const message = t("photoPasteNoImage");
      setLiveMessage(message);
      toast.error(message);
      return;
    }
    event.preventDefault();
    const pastedFile = new File([file], file.name || clipboardImageFileName, {
      type: file.type || "image/png",
      lastModified: Date.now(),
    });
    const message = t("photoPasteApplied");
    setLiveMessage(message);
    toast.success(message);
    handleSourceFileSelected(pastedFile);
  };

  const applyManualColor = (): void => {
    const nextColor = toRgbColor(
      clamp(manualR, 0, 255),
      clamp(manualG, 0, 255),
      clamp(manualB, 0, 255)
    );
    setSelectedColor(nextColor);
    handleColorSelect(nextColor);
    setLiveMessage(t("workbenchManualApplied"));
    toast.success(t("workbenchManualApplied"));
  };

  const copyMetricTable = async (): Promise<void> => {
    const payload = serializeMetricRows(baselineMetricRows, copyFormat);
    await navigator.clipboard.writeText(payload);
    handleStatusChange(t("workbenchMetricTableCopied", { format: copyFormat }));
    toast.success(t("workbenchMetricTableCopied", { format: copyFormat }));
  };

  const copyHistogram = async (): Promise<void> => {
    const payload = serializeHistogramBins(baselineHistogram, copyFormat);
    await navigator.clipboard.writeText(payload);
    handleStatusChange(t("workbenchHistogramCopied", { format: copyFormat }));
    toast.success(t("workbenchHistogramCopied", { format: copyFormat }));
  };

  const selectedFormats = selectedColor
    ? [
        { label: t("copyFormatHex"), value: rgbToHex(selectedColor) },
        { label: t("copyFormatRgb"), value: formatRgb(selectedColor) },
        { label: t("copyFormatHsl"), value: formatHsl(selectedColor) },
      ]
    : [];

  return (
    <section className="workbenchRoot">
      <div className="workbenchMainGrid workbenchThreePane">
        <PreviewPanel
          target={baselineTarget}
          hoverSample={hoverState.sample}
          selectedSamples={selectedSamples}
          selectionState={baselineSelectionState}
          selectionDraft={selectionDraft}
          onHoverSampleChange={(sample) =>
            setHoverState({ targetId: baselineTarget.targetId, sample, source: "preview" })
          }
          onSelectionDraftChange={setSelectionDraft}
          onSelectionCommit={handlePreviewSelectionCommit}
          onSampleSelect={handlePreviewSampleSelect}
          onSourceFileSelected={handleSourceFileSelected}
          onPaste={handlePhotoPaste}
        />

        <section className="panel">
          <PanelHeader titleKey="panelRgbCube" requirementsKey="panelRgbCubeRequirements" />

          <Tabs
            value={space}
            onValueChange={(value) => handleSpaceChange(value as ColorSpace3d)}
            className="spaceTabs"
          >
            <TabsList className="spaceTabsList">
              <TabsTrigger value="rgb" className="spaceTabTrigger">
                {t("spaceRgb")}
              </TabsTrigger>
              <TabsTrigger value="hsl" className="spaceTabTrigger">
                {t("spaceHsl")}
              </TabsTrigger>
              <TabsTrigger value="lab" className="spaceTabTrigger">
                {t("spaceLab")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="cubeSettings">
            <div className="cubeOverlayMode">
              <span className="cubeControlLabel">{t("cubeOverlayModeLabel")}</span>
              <Tabs
                value={cubeOverlayMode}
                onValueChange={(value) => setCubeOverlayMode(value as RgbCubeOverlayMode)}
                className="spaceTabs"
              >
                <TabsList className="spaceTabsList">
                  <TabsTrigger value="grid" className="spaceTabTrigger">
                    {t("cubeOverlayModeGrid")}
                  </TabsTrigger>
                  <TabsTrigger value="image" className="spaceTabTrigger">
                    {t("cubeOverlayModeImage")}
                  </TabsTrigger>
                  <TabsTrigger value="both" className="spaceTabTrigger">
                    {t("cubeOverlayModeBoth")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <label className="toggleLabel">
              <input
                type="checkbox"
                checked={isAxisGuideVisible}
                onChange={(event) => setIsAxisGuideVisible(event.target.checked)}
                aria-label={t("cubeShowAxisGuide")}
              />
              <span>{t("cubeShowAxisGuide")}</span>
            </label>
            <label className="toggleLabel">
              <input
                type="checkbox"
                checked={isCubeSizeSliderVisible}
                onChange={(event) => setIsCubeSizeSliderVisible(event.target.checked)}
                aria-label={t("cubeShowSizeSlider")}
              />
              <span>{t("cubeShowSizeSlider")}</span>
            </label>
            {isCubeSizeSliderVisible ? (
              <label>
                {t("cubeSizeLabel", { size: cubeSize })}
                <input
                  type="range"
                  min={320}
                  max={900}
                  step={10}
                  value={cubeSize}
                  onChange={(event) => setCubeSize(Number(event.target.value))}
                />
              </label>
            ) : null}
          </div>

          <RgbCubeCanvas
            space={space}
            rotation={rotation}
            cubeSize={cubeSize}
            axisGuideMode={isAxisGuideVisible ? "visible" : "hidden"}
            sliceAxis={sliceAxis}
            sliceValue={sliceValue}
            imageCubePoints={baselineTarget.result?.cubePoints ?? []}
            selectionCubePoints={selectionCubePoints}
            hoverColor={hoverColor}
            selectedColor={selectedColor}
            overlayMode={cubeOverlayMode}
            onRotationChange={setRotation}
            onHoverColorChange={(color) => handleColorHover(color, "cube")}
            onColorSelect={handleColorSelect}
          />

          <div className="manualColorPicker">
            <strong>{t("workbenchManualPickerTitle")}</strong>
            <div className="manualColorInputs">
              <label>
                R
                <input
                  type="number"
                  value={manualR}
                  min={0}
                  max={255}
                  onChange={(event) => setManualR(Number(event.target.value))}
                />
              </label>
              <label>
                G
                <input
                  type="number"
                  value={manualG}
                  min={0}
                  max={255}
                  onChange={(event) => setManualG(Number(event.target.value))}
                />
              </label>
              <label>
                B
                <input
                  type="number"
                  value={manualB}
                  min={0}
                  max={255}
                  onChange={(event) => setManualB(Number(event.target.value))}
                />
              </label>
              <button type="button" onClick={applyManualColor}>
                {t("workbenchManualApply")}
              </button>
            </div>
          </div>
        </section>

        <div className="visualizationGrid">
          <SliceCanvas
            space={space}
            axis={sliceAxis}
            value={sliceValue}
            mappedSamples={sliceMappedSamples}
            selectedSamples={selectedSamples}
            hoverColor={hoverColor}
            onAxisChange={handleSliceAxisChange}
            onValueChange={setSliceValue}
            onHoverColorChange={(color) => handleColorHover(color, "slice")}
            onColorSelect={handleColorSelect}
          />

          <ColorInspector
            hoverColor={hoverColor}
            selectedColor={selectedColor}
            onColorPasted={(color) => {
              setSelectedColor(color);
              handleColorSelect(color);
            }}
            onStatusChange={handleStatusChange}
          />

          <section className="panel inspectorExtensionPanel">
            <div className="inspectorControls">
              <div>
                <strong>{t("workbenchSelectionSlotLabel")}</strong>
                <div className="segmentedControl">
                  <button
                    type="button"
                    className={
                      baselineSelectionState.activeSelectionSlot === "A" ? "segmentedActive" : ""
                    }
                    onClick={() => handleSelectionSlotChange("A")}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    className={
                      baselineSelectionState.activeSelectionSlot === "B" ? "segmentedActive" : ""
                    }
                    onClick={() => handleSelectionSlotChange("B")}
                  >
                    B
                  </button>
                </div>
              </div>
              <div>
                <strong>{t("workbenchSelectionScopeLabel")}</strong>
                <div className="segmentedControl">
                  <button
                    type="button"
                    className={selectionScope === "full-image" ? "segmentedActive" : ""}
                    onClick={() => handleSelectionScopeChange("full-image")}
                  >
                    {t("workbenchScopeFullImage")}
                  </button>
                  <button
                    type="button"
                    className={selectionScope === "selected-region" ? "segmentedActive" : ""}
                    onClick={() => handleSelectionScopeChange("selected-region")}
                  >
                    {t("workbenchScopeSelectedRegion")}
                  </button>
                </div>
              </div>
              <button type="button" onClick={handleSelectionClear}>
                {t("workbenchClearSelection")}
              </button>
            </div>

            <div className="inspectorDataGrid">
              <div>
                <strong>{t("workbenchHoverSampleLabel")}</strong>
                <code>
                  {hoverState.sample ? `${hoverState.sample.x}, ${hoverState.sample.y}` : "--"}
                </code>
                <code>
                  {hoverState.sample
                    ? `${hoverState.sample.lab.l.toFixed(2)}, ${hoverState.sample.lab.a.toFixed(2)}, ${hoverState.sample.lab.b.toFixed(2)}`
                    : "--"}
                </code>
              </div>
              <div>
                <strong>{t("workbenchSelectedSampleLabel")}</strong>
                <code>{selectedSample ? `${selectedSample.x}, ${selectedSample.y}` : "--"}</code>
                <code>
                  {selectedSample
                    ? `${selectedSample.lab.l.toFixed(2)}, ${selectedSample.lab.a.toFixed(2)}, ${selectedSample.lab.b.toFixed(2)}`
                    : "--"}
                </code>
              </div>
              <div>
                <strong>{t("workbenchSelectedFormatsLabel")}</strong>
                {selectedFormats.length > 0 ? (
                  selectedFormats.map((format) => (
                    <code key={format.label}>
                      {format.label}: {format.value}
                    </code>
                  ))
                ) : (
                  <code>--</code>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="panel analysisWorkbenchPanel">
        <PanelHeader
          titleKey="panelPhotoAnalysis"
          requirementsKey="panelPhotoAnalysisRequirements"
        />

        <div className="photoAnalysisTopRow">
          <article className="photoAnalysisStatusCard">
            <h3>{t("photoInsightTitle")}</h3>
            {baselineTarget.result ? (
              <ul className="insightList">
                <li>
                  {t("photoInsightHue", { label: getHueInsightLabel(baselineTarget.result) })}
                </li>
                <li>
                  {t("photoInsightSaturation", {
                    label: getSaturationInsightLabel(baselineTarget.result),
                  })}
                </li>
              </ul>
            ) : (
              <p className="muted">{t("photoPreviewEmpty")}</p>
            )}
          </article>
        </div>

        <div className="analysisWorkbenchControls">
          <label>
            {t("workbenchHistogramLabel")}
            <select
              value={histogramMetric}
              onChange={(event) =>
                setHistogramMetric(event.target.value as WorkbenchHistogramMetric)
              }
            >
              <option value="luminance">{t("workbenchHistogramLuminanceOption")}</option>
              <option value="hue">{t("workbenchHistogramHueOption")}</option>
              <option value="saturation">{t("workbenchHistogramSaturationOption")}</option>
              <option value="chroma">{t("workbenchHistogramChromaOption")}</option>
            </select>
          </label>
          <label>
            {t("workbenchCopyFormatWorkbenchLabel")}
            <select
              value={copyFormat}
              onChange={(event) => setCopyFormat(event.target.value as ExportFormat)}
            >
              <option value="markdown">{t("workbenchExportMarkdown")}</option>
              <option value="csv">{t("workbenchExportCsv")}</option>
              <option value="tsv">{t("workbenchExportTsv")}</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void copyMetricTable()}
            disabled={baselineMetricRows.length === 0}
          >
            {t("workbenchTableCopy")}
          </button>
          <button
            type="button"
            onClick={() => void copyHistogram()}
            disabled={baselineHistogram.length === 0}
          >
            {t("workbenchHistogramCopy")}
          </button>
        </div>

        <div className="analysisWorkbenchGrid">
          <article className="analysisCard">
            <h3>{t("workbenchMetricsTableTitle")}</h3>
            <div className="metricsTableWrap">
              <table className="metricsTable">
                <thead>
                  <tr>
                    <th>{t("workbenchTableGroup")}</th>
                    <th>{t("workbenchTableMetric")}</th>
                    <th>{t("workbenchTableValue")}</th>
                    <th>{t("workbenchTableDelta")}</th>
                    <th>{t("workbenchTableDescription")}</th>
                  </tr>
                </thead>
                <tbody>
                  {baselineMetricRows.map((row) => (
                    <tr key={row.key}>
                      <td>{row.group}</td>
                      <td>{row.label}</td>
                      <td>{formatMetricValue(row, row.value)}</td>
                      <td>{formatMetricValue(row, row.delta)}</td>
                      <td>{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="analysisCard">
            <h3>{t("workbenchHistogramCardTitle")}</h3>
            <GraphFrame xLabel="bin" yLabel="count" className="analysisGraphFrame">
              {renderHistogramChart({ bins: baselineHistogram })}
            </GraphFrame>
            <p className="muted">{t("workbenchHistogramBaselineHint")}</p>
          </article>
        </div>

        <div className="analysisGrid">
          {baselineTarget.result ? (
            <>
              <article className="analysisCard">
                <h3>{t("photoHueHistogram")}</h3>
                <GraphFrame
                  xLabel={t("graphAxisHue")}
                  yLabel={t("graphAxisCount")}
                  className="analysisGraphFrame"
                >
                  {renderHistogramChart({
                    bins: buildHistogramBins(baselineTarget.result.samples, "hue"),
                  })}
                </GraphFrame>
              </article>

              <article className="analysisCard">
                <h3>{t("photoSaturationHistogram")}</h3>
                <GraphFrame
                  xLabel={t("graphAxisSaturation")}
                  yLabel={t("graphAxisCount")}
                  className="analysisGraphFrame"
                >
                  {renderHistogramChart({
                    bins: buildHistogramBins(baselineTarget.result.samples, "saturation"),
                  })}
                </GraphFrame>
              </article>

              <article className="analysisCard">
                <h3>{t("photoColorAreaRatio")}</h3>
                <ul className="areaList">
                  {baselineTarget.result.colorAreas.map((area) => (
                    <li key={area.label}>
                      <ColorSwatch color={area.rgb} />
                      <span>{area.label === "others" ? t("photoOthers") : area.label}</span>
                      <strong>{ratioFormatter.format(area.ratio / 100)}</strong>
                      {area.label !== "others" ? (
                        <button
                          type="button"
                          onClick={() => handleColorSelect(area.rgb)}
                          className="areaInspectButton"
                        >
                          {t("photoInspectOnCube")}
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </article>
            </>
          ) : (
            <article className="analysisCard analysisCardEmpty">
              <h3>{t("photoHueHistogram")}</h3>
              <p className="muted">{t("photoPreviewEmpty")}</p>
            </article>
          )}
        </div>
      </section>

      <p className="muted copyStatus" aria-live="polite">
        {liveMessage}
      </p>
    </section>
  );
}
