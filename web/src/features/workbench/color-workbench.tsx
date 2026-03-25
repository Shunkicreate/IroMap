"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PersistedDisclosure } from "@/components/workbench/persisted-disclosure";
import { PanelHeader } from "@/components/workbench/panel-header";
import { usePersistedBoolean } from "@/components/workbench/use-persisted-boolean";
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
  type SelectionRefinementResult,
  type TargetSelectionState,
} from "@/domain/photo-analysis/photo-analysis";
import {
  analyzePhotoInWorker,
  buildDerivedAnalysisInWorker,
  refineSelectionRegionInWorker,
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
  const [sliceAxis, setSliceAxis] = useState<SliceAxis>("r");
  const [sliceValue, setSliceValue] = useState<number>(defaultSliceValue);
  const [space, setSpace] = useState<ColorSpace3d>("rgb");
  const [isAxisGuideVisible, setIsAxisGuideVisible] = useState<boolean>(true);
  const [isCubeSizeSliderVisible, setIsCubeSizeSliderVisible] = useState<boolean>(true);
  const [cubeSize, setCubeSize] = useState<number>(defaultCubeSize);
  const [rotation, setRotation] = useState<Rotation>(defaultRotation);
  const [cubeOverlayMode, setCubeOverlayMode] = useState<RgbCubeOverlayMode>("both");
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
  const [selectionRefinement, setSelectionRefinement] = useState<SelectionRefinementResult | null>(
    null
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
        setSelectionRefinement(null);
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
        const { analysisId, result } = await analyzePhotoInWorker(imageData, "balanced");
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
        setSelectionRefinement(null);
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
      samplingPolicy: "balanced",
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

      if (!baselineSelectionState.activeSelection?.bounds) {
        return;
      }

      const refinementStartedAt = performance.now();
      void refineSelectionRegionInWorker({
        analysisId,
        result,
        selectionState: baselineSelectionState,
        samplingPolicy: "detail",
      }).then((refinement) => {
        if (isStale || !refinement) {
          return;
        }
        recordPerformanceEntry("workbench.roi-refine.total", refinementStartedAt, {
          analysisId,
          selectedSamples: refinement.selectedSamples.length,
          totalMs: refinement.timings.totalMs,
        });
        setSelectionRefinement(refinement);
      });
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

  const selectionCubePoints =
    selectionRefinement?.selectionCubePoints ?? derivedAnalysis.selectionCubePoints;
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

    if (selectionRefinement) {
      return selectionRefinement.selectedSamples;
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
    selectionRefinement,
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
    setSelectionRefinement(null);
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
    setSelectionRefinement(null);
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
                <TabsTrigger value="rgb" className={controlStyles.spaceTabTrigger}>
                  {t("spaceRgb")}
                </TabsTrigger>
                <TabsTrigger value="hsl" className={controlStyles.spaceTabTrigger}>
                  {t("spaceHsl")}
                </TabsTrigger>
                <TabsTrigger value="lab" className={controlStyles.spaceTabTrigger}>
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
                      <TabsTrigger value="grid" className={controlStyles.spaceTabTrigger}>
                        {t("cubeOverlayModeGrid")}
                      </TabsTrigger>
                      <TabsTrigger value="image" className={controlStyles.spaceTabTrigger}>
                        {t("cubeOverlayModeImage")}
                      </TabsTrigger>
                      <TabsTrigger value="both" className={controlStyles.spaceTabTrigger}>
                        {t("cubeOverlayModeBoth")}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className={controlStyles.toggleRow}>
                  <label className={controlStyles.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={isCubeImageMappingVisible}
                      onChange={(event) => setIsCubeImageMappingVisible(event.target.checked)}
                      aria-label={t("workbenchShowWhiteMappingCube")}
                    />
                    <span>{t("workbenchShowWhiteMappingCube")}</span>
                  </label>
                  <label className={controlStyles.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={isCubeSelectionMappingVisible}
                      onChange={(event) => setIsCubeSelectionMappingVisible(event.target.checked)}
                      aria-label={t("workbenchShowSelectedMappingCube")}
                    />
                    <span>{t("workbenchShowSelectedMappingCube")}</span>
                  </label>
                </div>
                <label className={controlStyles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={isAxisGuideVisible}
                    onChange={(event) => setIsAxisGuideVisible(event.target.checked)}
                    aria-label={t("cubeShowAxisGuide")}
                  />
                  <span>{t("cubeShowAxisGuide")}</span>
                </label>
                <label className={controlStyles.toggleLabel}>
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
