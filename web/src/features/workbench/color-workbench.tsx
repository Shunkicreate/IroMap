"use client";

import { useEffect, useMemo, useState } from "react";
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
  type RgbCubeOverlayMode,
  type Rotation,
  type SelectionDraft,
  type WorkbenchTarget,
} from "@/features/workbench/workbench-shared";
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
    isdefaultValue: true,
  });
  const [isCubeSizeSliderVisible, setIsCubeSizeSliderVisible] = usePersistedBoolean({
    storageKey: storageKeys.cubeSizeSliderVisible,
    isdefaultValue: true,
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
    isdefaultValue: true,
  });
  const [isCubeSelectionMappingVisible, setIsCubeSelectionMappingVisible] = usePersistedBoolean({
    storageKey: storageKeys.cubeSelectionMapping,
    isdefaultValue: true,
  });
  const [isSliceImageMappingVisible, setIsSliceImageMappingVisible] = usePersistedBoolean({
    storageKey: storageKeys.sliceImageMapping,
    isdefaultValue: true,
  });
  const [isSliceSelectionMappingVisible, setIsSliceSelectionMappingVisible] = usePersistedBoolean({
    storageKey: storageKeys.sliceSelectionMapping,
    isdefaultValue: true,
  });
  const baselineSelectionState = selectionStateByTarget.baseline ?? defaultSelectionState;
  const activeBaselineSelection = baselineSelectionState.activeSelection;

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
        const { imageData, decodeMs } = await readFileAsImageData(file);
        const { analysisId, result } = await analyzePhotoInWorker(imageData);
        if (isStale) {
          return;
        }
        recordPerformanceEntry("workbench.photo-analysis.total", startedAt, {
          fileName: file.name,
          decodeMs,
          analyzeMs: result.timings.totalMs,
          sampledPixels: result.sampledPixels,
          width: result.width,
          height: result.height,
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
  }, [baselineTarget.file]);

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
        selectedSamples: nextDerived.selectedSamples.length,
        metricsMs: nextDerived.timings.metricsMs,
        selectionMs: nextDerived.timings.selectionMs,
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
      return derivedAnalysis.selectedSamples;
    }

    return baselineTarget.result.samples.filter(
      (sample) =>
        sample.color.r === selectedSample.color.r &&
        sample.color.g === selectedSample.color.g &&
        sample.color.b === selectedSample.color.b
    );
  }, [
    activeBaselineSelection,
    baselineTarget.result,
    derivedAnalysis.selectedSamples,
    selectedSample,
  ]);

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
    setActiveSelection(() =>
      buildPointSelection({
        result: baselineTarget.result!,
        targetId: baselineTarget.targetId,
        sampleId: sample.sampleId,
        source: "color-space-pick",
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
    setHoverState({ targetId: "baseline", sample: null, source: "preview" });
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
        <div className="workbenchPreviewStack">
          <WorkbenchPreviewPanel
            target={baselineTarget}
            hoverSample={hoverState.sample}
            selectedSamples={selectedSamples}
            selectionState={baselineSelectionState}
            selectionDraft={selectionDraft}
            uploadDisclosureStorageKey={storageKeys.uploadPanel}
            onHoverSampleChange={(sample) =>
              setHoverState({ targetId: baselineTarget.targetId, sample, source: "preview" })
            }
            onSelectionDraftChange={setSelectionDraft}
            onSelectionCommit={handlePreviewSelectionCommit}
            onSampleSelect={handlePreviewSampleSelect}
            onSourceFileSelected={handleSourceFileSelected}
            onPaste={handlePhotoPaste}
            onPasteButtonClick={handlePhotoPasteButtonClick}
          />

          <WorkbenchMetricsPanel
            copyFormat={copyFormat}
            metricRows={localizedBaselineMetricRows}
            onCopyFormatChange={setCopyFormat}
            onCopyMetricTable={copyMetricTable}
          />
        </div>

        <div className="workbenchVisualStack">
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
              isdefaultOpen={false}
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
                </div>
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
            </PersistedDisclosure>

            <RgbCubeCanvas
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
              hoverColor={hoverColor}
              selectedColor={selectedColor}
              overlayMode={cubeOverlayMode}
              onRotationChange={setRotation}
              onHoverColorChange={(color) => handleColorHover(color, "cube")}
              onColorSelect={handleColorSelect}
            />
          </section>
        </div>

        <SliceCanvas
          space={space}
          axis={sliceAxis}
          value={sliceValue}
          displayOptionsStorageKey={storageKeys.sliceOptionsPanel}
          mappedSamples={sliceMappedSamples}
          selectedSamples={selectedSamples}
          ismappedSamplesVisible={isSliceImageMappingVisible}
          isselectedSamplesVisible={isSliceSelectionMappingVisible}
          hoverColor={hoverColor}
          onAxisChange={handleSliceAxisChange}
          onValueChange={setSliceValue}
          onHoverColorChange={(color) => handleColorHover(color, "slice")}
          onColorSelect={handleColorSelect}
          onMappedSamplesVisibilityChange={setIsSliceImageMappingVisible}
          onSelectedSamplesVisibilityChange={setIsSliceSelectionMappingVisible}
        />
      </div>

      <WorkbenchAnalysisPanel
        result={baselineTarget.result}
        luminanceHistogram={baselineLuminanceHistogram}
        hueHistogram={baselineHueHistogram}
        saturationHistogram={baselineSaturationHistogram}
        onCopyHistogram={copyHistogram}
      />

      <ColorInspector
        hoverColor={hoverColor}
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
