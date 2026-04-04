"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PersistedDisclosure } from "@/components/workbench/persisted-disclosure";
import { usePersistedState } from "@/components/workbench/use-persisted-state";
import { PanelHeader } from "@/components/workbench/panel-header";
import { usePersistedBoolean } from "@/components/workbench/use-persisted-boolean";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { rgbToHex } from "@/domain/color/color-format";
import { type ColorSpace3d, type RgbColor, type SliceAxis } from "@/domain/color/color-types";
import {
  buildColorSelection,
  buildDerivedPhotoAnalysis,
  buildPointSelection,
  buildRectangleSelection,
  serializeHistogramBins,
  serializeMetricRows,
  type ExportFormat,
  type PhotoSample,
  type TargetSelectionState,
} from "@/domain/photo-analysis/photo-analysis";
import {
  analyzePhotoInWorker,
  buildDerivedAnalysisInWorker,
  readFileAsImageData,
} from "@/features/photo-analysis/photo-analysis-client";
import { recordPerformanceEntry } from "@/features/photo-analysis/photo-analysis-performance";
import { ColorInspector } from "@/features/inspector/color-inspector";
import { RgbCubeCanvas } from "@/features/rgb-cube/rgb-cube-canvas";
import { SliceCanvas } from "@/features/slice/slice-canvas";
import { WorkbenchAnalysisPanel } from "@/features/workbench/workbench-analysis-panel";
import controlStyles from "@/features/workbench/workbench-controls.module.css";
import { WorkbenchMetricsPanel } from "@/features/workbench/workbench-metrics-panel";
import { WorkbenchPreviewPanel } from "@/features/workbench/workbench-preview-panel";
import {
  defaultSamplingDensityPercent,
  legacySamplingDensityPercent,
  maximumSamplingDensityPercent,
} from "@/domain/photo-analysis/shared/photo-analysis-constants";
import { resolveSamplingDensityPercent } from "@/domain/photo-analysis/shared/photo-analysis-color";
import {
  buildSampleBuckets,
  clamp,
  clipboardImageFileName,
  defaultCubeSize,
  defaultRotation,
  defaultSelectionState,
  defaultSliceValue,
  emptyTarget,
  fileSummaryPrecision,
  findNearestSampleByColor,
  getAxisRange,
  localizeMetricRows,
  mapAxisValue,
  storageKeys,
  type HoverState,
  type PreviewSamplingGridColor,
  type RgbCubeOverlayMode,
  type Rotation,
  type SelectionDraft,
  type WorkbenchTarget,
} from "@/features/workbench/workbench-shared";
import {
  registerHoverSearchAnalysis,
  resolveHoverColorToSampleInWorker,
  unregisterHoverSearchAnalysis,
} from "@/features/workbench/hover-search-client";
import { setSharedHoverState as setSharedHoverStateStore } from "@/features/workbench/shared-hover-store";
import { t } from "@/i18n/translate";

const parseColorSpace3d = (rawValue: string): ColorSpace3d | null =>
  rawValue === "rgb" || rawValue === "hsl" || rawValue === "lab" ? rawValue : null;

const parseSliceAxis = (rawValue: string): SliceAxis | null => {
  switch (rawValue) {
    case "r":
    case "g":
    case "b":
    case "h":
    case "s":
    case "l":
    case "lab-l":
    case "lab-a":
    case "lab-b":
      return rawValue;
    default:
      return null;
  }
};

const parseCubeOverlayMode = (rawValue: string): RgbCubeOverlayMode | null =>
  rawValue === "grid" || rawValue === "image" || rawValue === "both" ? rawValue : null;

const parseNumberValue =
  (isValid: (value: number) => boolean) =>
  (rawValue: string): number | null => {
    const value = Number(rawValue);
    return Number.isFinite(value) && isValid(value) ? value : null;
  };

const parsePersistedSliceValue = parseNumberValue((value) => value >= -128 && value <= 360);
const parsePersistedCubeSize = parseNumberValue((value) => value >= 320 && value <= 900);
const parsePersistedSamplingDensityPercent = parseNumberValue(
  (value) => value >= legacySamplingDensityPercent && value <= maximumSamplingDensityPercent
);

const parseRotation = (rawValue: string): Rotation | null => {
  try {
    const value = JSON.parse(rawValue) as Partial<Rotation>;
    if (
      typeof value.x === "number" &&
      Number.isFinite(value.x) &&
      typeof value.y === "number" &&
      Number.isFinite(value.y)
    ) {
      return { x: value.x, y: value.y };
    }
  } catch {
    return null;
  }

  return null;
};

const parsePreviewSamplingGridColor = (rawValue: string): PreviewSamplingGridColor | null =>
  rawValue === "white" || rawValue === "black" ? rawValue : null;

type SharedHoverEvent =
  | {
      kind: "sample";
      targetId: string;
      source: HoverState["source"];
      sample: PhotoSample | null;
    }
  | {
      kind: "color";
      targetId: string;
      source: HoverState["source"];
      color: RgbColor | null;
    };

const areSameSharedHoverEvent = (
  left: SharedHoverEvent | null,
  right: SharedHoverEvent | null
): boolean => {
  if (!left && !right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  if (
    left.kind !== right.kind ||
    left.targetId !== right.targetId ||
    left.source !== right.source
  ) {
    return false;
  }
  if (left.kind === "sample" && right.kind === "sample") {
    return left.sample?.sampleId === right.sample?.sampleId;
  }
  if (left.kind === "color" && right.kind === "color") {
    return (
      left.color?.r === right.color?.r &&
      left.color?.g === right.color?.g &&
      left.color?.b === right.color?.b
    );
  }
  return false;
};

export function ColorWorkbench() {
  const [baselineTarget, setBaselineTarget] = useState<WorkbenchTarget>(() =>
    emptyTarget("baseline", "Baseline")
  );
  const [selectionStateByTarget, setSelectionStateByTarget] = useState<
    Record<string, TargetSelectionState>
  >({
    baseline: { ...defaultSelectionState },
  });
  const pendingSharedHoverRef = useRef<SharedHoverEvent | null>(null);
  const sharedHoverFrameRef = useRef<number | null>(null);
  const sharedHoverSequenceRef = useRef(0);
  const isResolvingSharedHoverRef = useRef(false);
  const [selectedColor, setSelectedColor] = useState<RgbColor | null>(null);
  const [copyFormat, setCopyFormat] = useState<ExportFormat>("markdown");
  const [sliceAxis, setSliceAxis] = usePersistedState<SliceAxis>({
    storageKey: storageKeys.cubeSliceAxis,
    initialValue: "r",
    parse: parseSliceAxis,
    serialize: String,
  });
  const [sliceValue, setSliceValue] = usePersistedState<number>({
    storageKey: storageKeys.cubeSliceValue,
    initialValue: defaultSliceValue,
    parse: parsePersistedSliceValue,
    serialize: String,
  });
  const [space, setSpace] = usePersistedState<ColorSpace3d>({
    storageKey: storageKeys.cubeSpace,
    initialValue: "rgb",
    parse: parseColorSpace3d,
    serialize: String,
  });
  const [isAxisGuideVisible, setIsAxisGuideVisible] = usePersistedBoolean({
    storageKey: storageKeys.cubeAxisGuideVisible,
    defaultValue: true,
  });
  const [isCubeSizeSliderVisible, setIsCubeSizeSliderVisible] = usePersistedBoolean({
    storageKey: storageKeys.cubeSizeSliderVisible,
    defaultValue: true,
  });
  const [cubeSize, setCubeSize] = usePersistedState<number>({
    storageKey: storageKeys.cubeSize,
    initialValue: defaultCubeSize,
    parse: parsePersistedCubeSize,
    serialize: String,
  });
  const [rotation, setRotation] = usePersistedState<Rotation>({
    storageKey: storageKeys.cubeRotation,
    initialValue: defaultRotation,
    parse: parseRotation,
  });
  const [cubeOverlayMode, setCubeOverlayMode] = usePersistedState<RgbCubeOverlayMode>({
    storageKey: storageKeys.cubeOverlayMode,
    initialValue: "both",
    parse: parseCubeOverlayMode,
    serialize: String,
  });
  const [isPreviewSamplingGridVisible, setIsPreviewSamplingGridVisible] = usePersistedBoolean({
    storageKey: storageKeys.previewSamplingGridVisible,
    defaultValue: false,
  });
  const [previewSamplingGridColor, setPreviewSamplingGridColor] =
    usePersistedState<PreviewSamplingGridColor>({
      storageKey: storageKeys.previewSamplingGridColor,
      initialValue: "white",
      parse: parsePreviewSamplingGridColor,
      serialize: String,
    });
  const [samplingDensityPercent, setSamplingDensityPercent] = usePersistedState<number>({
    storageKey: storageKeys.samplingDensityPercent,
    initialValue: defaultSamplingDensityPercent,
    parse: parsePersistedSamplingDensityPercent,
    serialize: String,
  });
  const [liveMessage, setLiveMessage] = useState<string>("");
  const [selectionDraft, setSelectionDraft] = useState<SelectionDraft>(null);
  const [derivedAnalysis, setDerivedAnalysis] = useState(() =>
    buildDerivedPhotoAnalysis({
      result: {
        hueHistogram: [],
        saturationHistogram: [],
        colorAreas: [],
        cubePoints: [],
        samples: [],
        width: 0,
        height: 0,
        elapsedMs: 0,
        sampledPixels: 0,
        samplingStep: 1,
        samplingDensityPercent: maximumSamplingDensityPercent,
        timings: {
          totalMs: 0,
          samplingMs: 0,
          histogramMs: 0,
          colorAreasMs: 0,
          cubePointsMs: 0,
        },
      },
      selectionState: defaultSelectionState,
    })
  );
  const [isCubeImageMappingVisible, setIsCubeImageMappingVisible] = usePersistedBoolean({
    storageKey: storageKeys.cubeImageMapping,
    defaultValue: true,
  });
  const [isCubeSelectionMappingVisible, setIsCubeSelectionMappingVisible] = usePersistedBoolean({
    storageKey: storageKeys.cubeSelectionMapping,
    defaultValue: true,
  });
  const [isSliceImageMappingVisible, setIsSliceImageMappingVisible] = usePersistedBoolean({
    storageKey: storageKeys.sliceImageMapping,
    defaultValue: true,
  });
  const [isSliceSelectionMappingVisible, setIsSliceSelectionMappingVisible] = usePersistedBoolean({
    storageKey: storageKeys.sliceSelectionMapping,
    defaultValue: true,
  });
  const baselineSelectionState = selectionStateByTarget.baseline ?? defaultSelectionState;
  const activeBaselineSelection = baselineSelectionState.activeSelection;

  const baselineBuckets = useMemo(
    () => buildSampleBuckets(baselineTarget.result),
    [baselineTarget.result]
  );

  useEffect(() => {
    const analysisId = baselineTarget.analysisId;
    const result = baselineTarget.result;
    if (!analysisId || !result) {
      return;
    }

    registerHoverSearchAnalysis(analysisId, result);
    return () => {
      unregisterHoverSearchAnalysis(analysisId);
    };
  }, [baselineTarget.analysisId, baselineTarget.result]);

  useEffect(() => {
    const file = baselineTarget.file;
    let objectUrl = "";
    let isStale = false;
    const loadTarget = async (): Promise<void> => {
      if (!file) {
        setBaselineTarget((current) => ({ ...emptyTarget("baseline", current.label), file: null }));
        setDerivedAnalysis(
          buildDerivedPhotoAnalysis({
            result: {
              hueHistogram: [],
              saturationHistogram: [],
              colorAreas: [],
              cubePoints: [],
              samples: [],
              width: 0,
              height: 0,
              elapsedMs: 0,
              sampledPixels: 0,
              samplingStep: 1,
              samplingDensityPercent: maximumSamplingDensityPercent,
              timings: {
                totalMs: 0,
                samplingMs: 0,
                histogramMs: 0,
                colorAreasMs: 0,
                cubePointsMs: 0,
              },
            },
            selectionState: defaultSelectionState,
          })
        );
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
        analysisId: null,
        result: null,
      }));

      try {
        const startedAt = performance.now();
        const { imageData, decodeMs, downscaleMs, width, height, analysisWidth, analysisHeight } =
          await readFileAsImageData(file);
        const requestedSamplingDensityPercent = resolveSamplingDensityPercent(
          samplingDensityPercent,
          imageData.width * imageData.height
        );
        const { analysisId, result } = await analyzePhotoInWorker(
          imageData,
          requestedSamplingDensityPercent
        );
        if (isStale) {
          return;
        }
        recordPerformanceEntry("workbench.photo-analysis.total", startedAt, {
          fileName: file.name,
          decodeMs,
          downscaleMs,
          analyzeMs: result.timings.totalMs,
          sampledPixels: result.sampledPixels,
          width,
          height,
          analysisWidth,
          analysisHeight,
        });
        const success = t("photoSummary", {
          fileName: file.name,
          sampledPixels: result.sampledPixels,
          elapsedMs: result.elapsedMs.toFixed(fileSummaryPrecision),
        });
        setBaselineTarget((current) => ({
          ...current,
          file,
          analysisId,
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
  }, [baselineTarget.file, samplingDensityPercent]);

  useEffect(() => {
    const result = baselineTarget.result;
    const analysisId = baselineTarget.analysisId;

    if (!result || !analysisId) {
      return;
    }

    let isStale = false;
    const startedAt = performance.now();

    void buildDerivedAnalysisInWorker({
      analysisId,
      result,
      selectionState: baselineSelectionState,
    }).then((nextDerived) => {
      if (isStale) {
        return;
      }
      recordPerformanceEntry("workbench.derived-analysis.total", startedAt, {
        analysisId,
        selectionSource: baselineSelectionState.activeSelection?.source ?? "none",
        selectedSamples: nextDerived.selectedSamples.length,
        metricsMs: nextDerived.timings.metricsMs,
        selectionMs: nextDerived.timings.selectionMs,
        selectionRegistrationMs: nextDerived.timings.selectionRegistrationMs,
        selectionProjectionMs: nextDerived.timings.selectionProjectionMs,
        selectedSamplesMs: nextDerived.timings.selectedSamplesMs,
        cubePointsMs: nextDerived.timings.cubePointsMs,
        totalMs: nextDerived.timings.totalMs,
      });
      setDerivedAnalysis(nextDerived);
    });

    return () => {
      isStale = true;
    };
  }, [baselineSelectionState, baselineTarget.analysisId, baselineTarget.result]);

  const sliceMappedSamples = baselineTarget.result?.samples ?? [];
  const baselineMetricRows = derivedAnalysis.metricRows;
  const localizedBaselineMetricRows = useMemo(
    () => localizeMetricRows(baselineMetricRows),
    [baselineMetricRows]
  );
  const baselineLuminanceHistogram = derivedAnalysis.luminanceHistogram;
  const baselineHueHistogram = derivedAnalysis.hueHistogram;
  const baselineSaturationHistogram = derivedAnalysis.saturationHistogram;

  const selectionCubePoints = derivedAnalysis.selectionCubePoints;

  const selectedSamples = useMemo(() => {
    if (!activeBaselineSelection) {
      return [];
    }
    return derivedAnalysis.selectedSamples;
  }, [activeBaselineSelection, derivedAnalysis.selectedSamples]);

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

  const setActiveSelection = (
    selectionFactory: () =>
      | ReturnType<typeof buildPointSelection>
      | ReturnType<typeof buildRectangleSelection>
  ) => {
    if (!baselineTarget.result) {
      return;
    }
    setSelectionStateByTarget((current) => {
      const nextSelection = selectionFactory();
      return {
        ...current,
        baseline: {
          activeSelection: nextSelection,
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
    setActiveSelection(() =>
      buildRectangleSelection({
        result: baselineTarget.result!,
        targetId: baselineTarget.targetId,
        bounds,
      })
    );
    setLiveMessage(t("workbenchSelectionUpdated"));
  };

  const clearSharedHoverNow = (source: HoverState["source"]): void => {
    sharedHoverSequenceRef.current += 1;
    pendingSharedHoverRef.current = null;
    if (sharedHoverFrameRef.current != null) {
      window.cancelAnimationFrame(sharedHoverFrameRef.current);
      sharedHoverFrameRef.current = null;
    }
    setSharedHoverStateStore({
      targetId: baselineTarget.targetId,
      sample: null,
      source,
    });
  };

  const scheduleSharedHoverFlush = (): void => {
    if (sharedHoverFrameRef.current != null || isResolvingSharedHoverRef.current) {
      return;
    }
    sharedHoverFrameRef.current = window.requestAnimationFrame(() => {
      flushSharedHover();
    });
  };

  const flushSharedHover = (): void => {
    sharedHoverFrameRef.current = null;
    if (isResolvingSharedHoverRef.current) {
      return;
    }
    const nextHoverEvent = pendingSharedHoverRef.current;
    pendingSharedHoverRef.current = null;
    if (!nextHoverEvent) {
      return;
    }
    const sequence = sharedHoverSequenceRef.current + 1;
    sharedHoverSequenceRef.current = sequence;

    if (nextHoverEvent.kind === "sample") {
      const nextHover: HoverState = {
        targetId: nextHoverEvent.targetId,
        sample: nextHoverEvent.sample,
        source: nextHoverEvent.source,
      };
      setSharedHoverStateStore(nextHover);
      return;
    }

    const applyResolvedSample = (sample: PhotoSample | null): void => {
      if (sequence !== sharedHoverSequenceRef.current) {
        return;
      }
      const nextHover: HoverState = {
        targetId: nextHoverEvent.targetId,
        sample,
        source: nextHoverEvent.source,
      };
      setSharedHoverStateStore(nextHover);
    };

    if (!baselineTarget.analysisId) {
      applyResolvedSample(
        findNearestSampleByColor(baselineTarget.result, baselineBuckets, nextHoverEvent.color)
      );
      if (pendingSharedHoverRef.current) {
        scheduleSharedHoverFlush();
      }
      return;
    }

    isResolvingSharedHoverRef.current = true;
    void resolveHoverColorToSampleInWorker({
      analysisId: baselineTarget.analysisId,
      color: nextHoverEvent.color,
    })
      .then((sample) => {
        applyResolvedSample(sample);
      })
      .finally(() => {
        isResolvingSharedHoverRef.current = false;
        if (pendingSharedHoverRef.current) {
          scheduleSharedHoverFlush();
        }
      });
  };

  const enqueueSharedHover = (nextHover: SharedHoverEvent): void => {
    if (areSameSharedHoverEvent(pendingSharedHoverRef.current, nextHover)) {
      return;
    }
    pendingSharedHoverRef.current = nextHover;
    scheduleSharedHoverFlush();
  };

  const handleColorHover = (color: RgbColor | null, source: HoverState["source"]): void => {
    if (!color) {
      clearSharedHoverNow(source);
      return;
    }
    enqueueSharedHover({
      targetId: baselineTarget.targetId,
      kind: "color",
      color,
      source,
    });
  };

  const handlePreviewHover = (sample: PhotoSample | null): void => {
    if (!sample) {
      clearSharedHoverNow("preview");
      return;
    }
    enqueueSharedHover({
      targetId: baselineTarget.targetId,
      kind: "sample",
      sample,
      source: "preview",
    });
  };

  const handleColorSelect = (
    color: RgbColor,
    source: "color-space-pick" | "slice-pick" = "color-space-pick"
  ): void => {
    if (!baselineTarget.result) {
      return;
    }
    const sample = findNearestSampleByColor(baselineTarget.result, baselineBuckets, color);
    setSelectedColor(color);
    if (!sample) {
      return;
    }
    setActiveSelection(() =>
      buildColorSelection({
        result: baselineTarget.result!,
        targetId: baselineTarget.targetId,
        color: sample.color,
        source,
      })
    );
    setLiveMessage(t("workbenchSelectedColorUpdated", { value: rgbToHex(color) }));
  };

  const handlePreviewSampleSelect = (sample: PhotoSample): void => {
    setSelectedColor(sample.color);
    setActiveSelection(() =>
      buildPointSelection({
        result: baselineTarget.result!,
        targetId: baselineTarget.targetId,
        sampleId: sample.sampleId,
        source: "image-point",
      })
    );
    setLiveMessage(t("workbenchSelectedColorUpdated", { value: rgbToHex(sample.color) }));
  };

  const handleStatusChange = (message: string): void => {
    setLiveMessage(message);
  };

  const handleSourceFileSelected = (file: File | null): void => {
    setBaselineTarget((current) => ({ ...current, file }));
    setSelectedColor(null);
    pendingSharedHoverRef.current = null;
    if (sharedHoverFrameRef.current != null) {
      window.cancelAnimationFrame(sharedHoverFrameRef.current);
      sharedHoverFrameRef.current = null;
    }
    setSharedHoverStateStore({ targetId: "baseline", sample: null, source: "preview" });
  };

  const getClipboardImageFile = (clipboardData: DataTransfer | null | undefined): File | null => {
    const items = Array.from(clipboardData?.items ?? []);
    const imageItem = items.find((item) => item.kind === "file" && item.type.startsWith("image/"));
    return imageItem?.getAsFile() ?? null;
  };

  const applyPastedImageFile = (file: File): void => {
    const pastedFile = new File([file], file.name || clipboardImageFileName, {
      type: file.type || "image/png",
      lastModified: Date.now(),
    });
    const message = t("photoPasteApplied");
    setLiveMessage(message);
    toast.success(message);
    handleSourceFileSelected(pastedFile);
  };

  const getClipboardImageFileFromItems = async (): Promise<File | null> => {
    if (!navigator.clipboard?.read) {
      throw new Error("clipboard-read-unsupported");
    }

    const clipboardItems = await navigator.clipboard.read();
    for (const item of clipboardItems) {
      const imageType = item.types.find((type) => type.startsWith("image/"));
      if (!imageType) {
        continue;
      }

      const blob = await item.getType(imageType);
      const extension = imageType.split("/")[1] || "png";
      return new File([blob], `clipboard-image.${extension}`, {
        type: imageType,
        lastModified: Date.now(),
      });
    }

    return null;
  };

  const handlePhotoPaste = (event: React.ClipboardEvent<HTMLDivElement>): void => {
    const file = getClipboardImageFile(event.clipboardData);
    if (!file) {
      const message = t("photoPasteNoImage");
      setLiveMessage(message);
      toast.error(message);
      return;
    }
    event.preventDefault();
    applyPastedImageFile(file);
  };

  const handlePhotoPasteButtonClick = async (): Promise<void> => {
    try {
      const file = await getClipboardImageFileFromItems();
      if (!file) {
        const message = t("photoPasteNoImage");
        setLiveMessage(message);
        toast.error(message);
        return;
      }

      applyPastedImageFile(file);
    } catch (error) {
      const message =
        error instanceof Error && error.message === "clipboard-read-unsupported"
          ? t("photoPasteUnsupported")
          : error instanceof DOMException && error.name === "NotAllowedError"
            ? t("photoPastePermissionDenied")
            : t("photoPasteReadFailed");
      setLiveMessage(message);
      toast.error(message);
    }
  };

  useEffect(() => {
    return () => {
      if (sharedHoverFrameRef.current != null) {
        window.cancelAnimationFrame(sharedHoverFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleWindowPaste = (event: ClipboardEvent): void => {
      const items = Array.from(event.clipboardData?.items ?? []);
      const imageItem = items.find(
        (item) => item.kind === "file" && item.type.startsWith("image/")
      );
      const file = imageItem?.getAsFile();
      if (!file) {
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

    window.addEventListener("paste", handleWindowPaste);
    return () => {
      window.removeEventListener("paste", handleWindowPaste);
    };
  }, []);

  const copyMetricTable = async (): Promise<void> => {
    const payload = serializeMetricRows(localizedBaselineMetricRows, copyFormat, {
      headerLabels: {
        group: t("workbenchTableGroup"),
        key: t("workbenchTableKey"),
        label: t("workbenchTableMetric"),
        value: t("workbenchTableValue"),
        unit: t("workbenchTableUnit"),
        description: t("workbenchTableDescription"),
      },
    });
    await navigator.clipboard.writeText(payload);
    handleStatusChange(t("workbenchMetricTableCopied", { format: copyFormat }));
    toast.success(t("workbenchMetricTableCopied", { format: copyFormat }));
  };

  const copyHistogram = async (): Promise<void> => {
    const payload = serializeHistogramBins(
      [...baselineLuminanceHistogram, ...baselineHueHistogram, ...baselineSaturationHistogram],
      copyFormat,
      {
        headerLabels: {
          metric: t("workbenchTableMetric"),
          binIndex: t("graphAxisBin"),
          start: t("graphAxisStart"),
          end: t("graphAxisEnd"),
          count: t("graphAxisCount"),
          ratio: t("graphAxisRatio"),
        },
        metricLabels: {
          luminance: t("workbenchHistogramCardTitle"),
          hue: t("photoHueHistogram"),
          saturation: t("photoSaturationHistogram"),
        },
      }
    );
    await navigator.clipboard.writeText(payload);
    handleStatusChange(t("workbenchHistogramCopied", { format: copyFormat }));
    toast.success(t("workbenchHistogramCopied", { format: copyFormat }));
  };

  return (
    <section className="workbenchRoot">
      <div className="workbenchInteractiveGrid">
        <div className="workbenchPreviewRegion">
          <WorkbenchPreviewPanel
            target={baselineTarget}
            selectedSamples={selectedSamples}
            selectionState={baselineSelectionState}
            selectionDraft={selectionDraft}
            uploadDisclosureStorageKey={storageKeys.uploadPanel}
            optionsDisclosureStorageKey={storageKeys.previewOptionsPanel}
            isSamplingGridVisible={isPreviewSamplingGridVisible}
            samplingGridColor={previewSamplingGridColor}
            samplingDensityPercent={
              baselineTarget.result?.samplingDensityPercent ??
              (samplingDensityPercent === legacySamplingDensityPercent
                ? defaultSamplingDensityPercent
                : samplingDensityPercent)
            }
            onHoverSampleChange={handlePreviewHover}
            onSamplingGridVisibleChange={setIsPreviewSamplingGridVisible}
            onSamplingGridColorChange={setPreviewSamplingGridColor}
            onSamplingDensityPercentChange={setSamplingDensityPercent}
            onSelectionDraftChange={setSelectionDraft}
            onSelectionCommit={handlePreviewSelectionCommit}
            onSampleSelect={handlePreviewSampleSelect}
            onSourceFileSelected={handleSourceFileSelected}
            onPaste={handlePhotoPaste}
            onPasteButtonClick={handlePhotoPasteButtonClick}
          />
        </div>

        <div className="workbenchCubeRegion">
          <section className="panel">
            <PanelHeader titleKey="panelRgbCube" requirementsKey="panelRgbCubeRequirements" />

            <Tabs
              value={space}
              onValueChange={(value) => handleSpaceChange(value as ColorSpace3d)}
              className={controlStyles.spaceTabs}
            >
              <TabsList className={controlStyles.spaceTabsList}>
                <TabsTrigger
                  value="rgb"
                  className={`${controlStyles.spaceTabTrigger} ${controlStyles.spaceTabTriggerRgb}`}
                >
                  {t("spaceRgb")}
                </TabsTrigger>
                <TabsTrigger
                  value="hsl"
                  className={`${controlStyles.spaceTabTrigger} ${controlStyles.spaceTabTriggerHsl}`}
                >
                  {t("spaceHsl")}
                </TabsTrigger>
                <TabsTrigger
                  value="lab"
                  className={`${controlStyles.spaceTabTrigger} ${controlStyles.spaceTabTriggerLab}`}
                >
                  {t("spaceLab")}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <PersistedDisclosure
              storageKey={storageKeys.cubeOptionsPanel}
              defaultOpen={false}
              summary={t("workbenchDisplayOptionsDisclosure")}
              className={controlStyles.inlineDisclosure}
              contentClassName={controlStyles.inlineDisclosureContent}
            >
              <div className={controlStyles.cubeSettings}>
                <div className={controlStyles.cubeOverlayMode}>
                  <span className={controlStyles.cubeControlLabel}>
                    {t("cubeOverlayModeLabel")}
                  </span>
                  <Tabs
                    value={cubeOverlayMode}
                    onValueChange={(value) => setCubeOverlayMode(value as RgbCubeOverlayMode)}
                    className={controlStyles.spaceTabs}
                  >
                    <TabsList className={controlStyles.spaceTabsList}>
                      <TabsTrigger
                        value="grid"
                        className={`${controlStyles.spaceTabTrigger} ${controlStyles.overlayTabTriggerGrid}`}
                      >
                        {t("cubeOverlayModeGrid")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="image"
                        className={`${controlStyles.spaceTabTrigger} ${controlStyles.overlayTabTriggerImage}`}
                      >
                        {t("cubeOverlayModeImage")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="both"
                        className={`${controlStyles.spaceTabTrigger} ${controlStyles.overlayTabTriggerBoth}`}
                      >
                        {t("cubeOverlayModeBoth")}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className={controlStyles.toggleRow}>
                  <label className={controlStyles.toggleLabel}>
                    <Checkbox
                      checked={isCubeImageMappingVisible}
                      onCheckedChange={(checked) => setIsCubeImageMappingVisible(checked === true)}
                      aria-label={t("workbenchShowWhiteMappingCube")}
                    />
                    <span>{t("workbenchShowWhiteMappingCube")}</span>
                  </label>
                  <label className={controlStyles.toggleLabel}>
                    <Checkbox
                      checked={isCubeSelectionMappingVisible}
                      onCheckedChange={(checked) =>
                        setIsCubeSelectionMappingVisible(checked === true)
                      }
                      aria-label={t("workbenchShowSelectedMappingCube")}
                    />
                    <span>{t("workbenchShowSelectedMappingCube")}</span>
                  </label>
                  <label className={controlStyles.toggleLabel}>
                    <Checkbox
                      checked={isAxisGuideVisible}
                      onCheckedChange={(checked) => setIsAxisGuideVisible(checked === true)}
                      aria-label={t("cubeShowAxisGuide")}
                    />
                    <span>{t("cubeShowAxisGuide")}</span>
                  </label>
                  <label className={controlStyles.toggleLabel}>
                    <Checkbox
                      checked={isCubeSizeSliderVisible}
                      onCheckedChange={(checked) => setIsCubeSizeSliderVisible(checked === true)}
                      aria-label={t("cubeShowSizeSlider")}
                    />
                    <span>{t("cubeShowSizeSlider")}</span>
                  </label>
                </div>
                {isCubeSizeSliderVisible ? (
                  <label className={controlStyles.stackedLabel}>
                    {t("cubeSizeLabel", { size: cubeSize })}
                    <input
                      className={controlStyles.rangeControl}
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
            </PersistedDisclosure>

            <RgbCubeCanvas
              analysisId={baselineTarget.analysisId}
              space={space}
              rotation={rotation}
              cubeSize={cubeSize}
              axisGuideMode={isAxisGuideVisible ? "visible" : "hidden"}
              sliceAxis={sliceAxis}
              sliceValue={sliceValue}
              imageCubePoints={baselineTarget.result?.cubePoints ?? []}
              selectionCubePoints={selectionCubePoints}
              isimageMappingVisible={isCubeImageMappingVisible}
              isselectionMappingVisible={isCubeSelectionMappingVisible}
              selectedColor={selectedColor}
              overlayMode={cubeOverlayMode}
              onRotationChange={setRotation}
              onHoverColorChange={(color) => handleColorHover(color, "cube")}
              onColorSelect={(color) => handleColorSelect(color, "color-space-pick")}
            />
          </section>
        </div>

        <div className="workbenchSliceRegion">
          <SliceCanvas
            analysisId={baselineTarget.analysisId}
            space={space}
            axis={sliceAxis}
            value={sliceValue}
            displayOptionsStorageKey={storageKeys.sliceOptionsPanel}
            mappedSamples={sliceMappedSamples}
            selectedSamples={selectedSamples}
            ismappedSamplesVisible={isSliceImageMappingVisible}
            isselectedSamplesVisible={isSliceSelectionMappingVisible}
            onAxisChange={handleSliceAxisChange}
            onValueChange={setSliceValue}
            onHoverColorChange={(color) => handleColorHover(color, "slice")}
            onColorSelect={(color) => handleColorSelect(color, "slice-pick")}
            onMappedSamplesVisibilityChange={setIsSliceImageMappingVisible}
            onSelectedSamplesVisibilityChange={setIsSliceSelectionMappingVisible}
          />
        </div>

        <div className="workbenchMetricsRegion">
          <WorkbenchMetricsPanel
            copyFormat={copyFormat}
            metricRows={localizedBaselineMetricRows}
            onCopyFormatChange={setCopyFormat}
            onCopyMetricTable={copyMetricTable}
          />
        </div>
      </div>

      <WorkbenchAnalysisPanel
        result={baselineTarget.result}
        luminanceHistogram={baselineLuminanceHistogram}
        hueHistogram={baselineHueHistogram}
        saturationHistogram={baselineSaturationHistogram}
        onCopyHistogram={copyHistogram}
      />

      <ColorInspector
        selectedColor={selectedColor}
        contentStorageKey={storageKeys.inspectorPanel}
        onColorPasted={(color) => {
          setSelectedColor(color);
          handleColorSelect(color);
        }}
        onStatusChange={handleStatusChange}
      />

      <p className="muted copyStatus" aria-live="polite">
        {liveMessage}
      </p>
    </section>
  );
}
