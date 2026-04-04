"use client";

import NextImage from "next/image";
import { useId, useRef, useState } from "react";
import { PersistedDisclosure } from "@/components/workbench/persisted-disclosure";
import { PanelHeader } from "@/components/workbench/panel-header";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PhotoSample, TargetSelectionState } from "@/domain/photo-analysis/photo-analysis";
import { t } from "@/i18n/translate";
import controlStyles from "@/features/workbench/workbench-controls.module.css";
import previewStyles from "@/features/workbench/photo-preview-shared.module.css";
import {
  clamp,
  type PreviewSamplingGridColor,
  type SelectionDraft,
  type WorkbenchTarget,
} from "@/features/workbench/workbench-shared";
import { findNearestPreviewSampleInWorker } from "@/features/workbench/hover-search-client";
import { findNearestPreviewHoverSample } from "@/features/workbench/hover-search";
import { useSharedHoverState } from "@/features/workbench/shared-hover-store";
import { useLatestHoverPipeline } from "@/features/workbench/use-latest-hover-pipeline";

type Props = {
  target: WorkbenchTarget;
  selectedSamples: PhotoSample[];
  selectionState: TargetSelectionState;
  selectionDraft: SelectionDraft;
  uploadDisclosureStorageKey: string;
  optionsDisclosureStorageKey: string;
  isSamplingGridVisible: boolean;
  samplingGridColor: PreviewSamplingGridColor;
  samplingDensityPercent: number;
  onHoverSampleChange: (sample: PhotoSample | null) => void;
  onSamplingGridVisibleChange: (isVisible: boolean) => void;
  onSamplingGridColorChange: (color: PreviewSamplingGridColor) => void;
  onSamplingDensityPercentChange: (value: number) => void;
  onSelectionDraftChange: (draft: SelectionDraft) => void;
  onSelectionCommit: (bounds: { x: number; y: number; width: number; height: number }) => void;
  onSampleSelect: (sample: PhotoSample) => void;
  onSourceFileSelected: (file: File | null) => void;
  onPaste: (event: React.ClipboardEvent<HTMLDivElement>) => void;
  onPasteButtonClick: () => Promise<void>;
};

const areSameSample = (
  left: PhotoSample | null | undefined,
  right: PhotoSample | null | undefined
): boolean => left?.sampleId === right?.sampleId;

export function WorkbenchPreviewPanel(props: Props) {
  const {
    target,
    selectedSamples,
    selectionState,
    selectionDraft,
    uploadDisclosureStorageKey,
    optionsDisclosureStorageKey,
    isSamplingGridVisible,
    samplingGridColor,
    samplingDensityPercent,
    onHoverSampleChange,
    onSamplingGridVisibleChange,
    onSamplingGridColorChange,
    onSamplingDensityPercentChange,
    onSelectionDraftChange,
    onSelectionCommit,
    onSampleSelect,
    onSourceFileSelected,
    onPaste,
    onPasteButtonClick,
  } = props;
  const imageWrapRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const patternId = useId();
  const [localHoverSample, setLocalHoverSample] = useState<PhotoSample | null>(null);
  const [isPointerInside, setIsPointerInside] = useState(false);
  const sharedHoverSample = useSharedHoverState((state) => state.sample);

  const getPreviewBounds = (): DOMRect | null => {
    if (imageRef.current) {
      return imageRef.current.getBoundingClientRect();
    }
    return imageWrapRef.current?.getBoundingClientRect() ?? null;
  };

  const sharedHoverPipeline = useLatestHoverPipeline<PhotoSample | null, PhotoSample | null>({
    debugLabel: "preview-shared-hover",
    isEqual: areSameSample,
    onResolved: (nextHoverSample) => {
      onHoverSampleChange(nextHoverSample);
    },
    resolve: (sample) => sample,
  });

  const hoverPipeline = useLatestHoverPipeline<{ x: number; y: number } | null, PhotoSample | null>(
    {
      debugLabel: "preview-local-hover",
      isEqual: areSameSample,
      onResolved: (nextHoverSample) => {
        setLocalHoverSample(nextHoverSample);
        sharedHoverPipeline.schedule(nextHoverSample);
      },
      resolve: (point) => {
        if (!point) {
          return null;
        }
        if (target.analysisId) {
          return findNearestPreviewSampleInWorker({
            analysisId: target.analysisId,
            x: point.x,
            y: point.y,
          });
        }
        return findNearestPreviewHoverSample(target, point.x, point.y);
      },
    }
  );

  const mapPointerToCoordinate = (
    event: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
  ): { x: number; y: number } | null => {
    if (!target.result) {
      return null;
    }
    const bounds = getPreviewBounds();
    if (!bounds) {
      return null;
    }
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * target.result.width,
      y: ((event.clientY - bounds.top) / bounds.height) * target.result.height,
    };
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
    setIsPointerInside(true);
    hoverPipeline.schedule(mapPointerToCoordinate(event));

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

  const displayedHoverSample = isPointerInside ? localHoverSample : sharedHoverSample;

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
      const coordinate = mapPointerToCoordinate(event);
      const sample = coordinate
        ? findNearestPreviewHoverSample(target, coordinate.x, coordinate.y)
        : null;
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

  const selection = selectionState.activeSelection;
  const selectionBox =
    selection?.bounds && target.result ? (
      <rect
        key={selection.selectionId}
        className={`${previewStyles.selectionBox} ${previewStyles.selectionBoxActive}`}
        x={selection.bounds.x}
        y={selection.bounds.y}
        width={selection.bounds.width}
        height={selection.bounds.height}
        rx="4"
        ry="4"
      />
    ) : null;

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
    displayedHoverSample && target.result
      ? {
          x: displayedHoverSample.x,
          y: displayedHoverSample.y,
        }
      : null;
  const selectedMarkers = target.result
    ? selectedSamples.map((sample) => ({
        sampleId: sample.sampleId,
        x: sample.x,
        y: sample.y,
      }))
    : [];
  const markerRadius = target.result
    ? Math.max(4, Math.min(target.result.width, target.result.height) * 0.01)
    : 5;
  const samplingStep = target.result?.samplingStep ?? 1;
  const samplingGridStroke =
    samplingGridColor === "white" ? "rgba(248, 250, 252, 0.72)" : "rgba(15, 23, 42, 0.58)";
  const samplingGridPattern =
    target.result && isSamplingGridVisible ? (
      <pattern
        id={patternId}
        width={samplingStep}
        height={samplingStep}
        patternUnits="userSpaceOnUse"
      >
        <path
          d={`M ${samplingStep} 0 L 0 0 0 ${samplingStep}`}
          fill="none"
          stroke={samplingGridStroke}
          strokeWidth="0.5"
        />
      </pattern>
    ) : null;

  return (
    <section className={`panel ${previewStyles.previewPanel}`}>
      <PanelHeader titleKey="photoPreviewTitle" requirementsKey="panelPhotoAnalysisRequirements" />
      <PersistedDisclosure
        storageKey={uploadDisclosureStorageKey}
        defaultOpen={true}
        summary={t("workbenchUploadDisclosure")}
        className={controlStyles.inlineDisclosure}
        contentClassName={controlStyles.inlineDisclosureContent}
      >
        <div
          className={previewStyles.uploadCta}
          onPaste={onPaste}
          tabIndex={0}
          role="button"
          aria-label={t("photoPasteZoneLabel")}
        >
          <div className={previewStyles.uploadCtaCopy}>
            <strong>{t("photoUploadCtaTitle")}</strong>
            <p>{t("photoUploadCtaDescription")}</p>
            {target.file ? (
              <p className={previewStyles.uploadCtaStatus}>{target.file.name}</p>
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
          <div className={`photoPasteZone ${previewStyles.pasteZone}`}>
            <strong>{t("photoPasteZoneTitle")}</strong>
            <p>{t("photoPasteZoneDescription")}</p>
            <p className={previewStyles.pasteShortcutHint}>{t("photoPasteZoneShortcut")}</p>
            <button
              type="button"
              className={`photoUploadButton ${previewStyles.pasteButton}`}
              onClick={() => void onPasteButtonClick()}
            >
              {t("photoPasteButton")}
            </button>
          </div>
        </div>
      </PersistedDisclosure>

      <PersistedDisclosure
        storageKey={optionsDisclosureStorageKey}
        defaultOpen={false}
        summary={t("workbenchDisplayOptionsDisclosure")}
        className={controlStyles.inlineDisclosure}
        contentClassName={controlStyles.inlineDisclosureContent}
      >
        <div className={controlStyles.cubeSettings}>
          <div className={controlStyles.toggleRow}>
            <label className={controlStyles.toggleLabel}>
              <Checkbox
                checked={isSamplingGridVisible}
                onCheckedChange={(checked) => onSamplingGridVisibleChange(checked === true)}
              />
              <span>{t("previewShowSamplingGrid")}</span>
            </label>
          </div>
          <div className={controlStyles.cubeOverlayMode}>
            <span className={controlStyles.cubeControlLabel}>
              {t("previewSamplingGridColorLabel")}
            </span>
            <Tabs
              value={samplingGridColor}
              onValueChange={(value) =>
                onSamplingGridColorChange(value as PreviewSamplingGridColor)
              }
              className={controlStyles.spaceTabs}
            >
              <TabsList className={controlStyles.twoOptionTabsList}>
                <TabsTrigger value="white" className={controlStyles.spaceTabTrigger}>
                  {t("previewSamplingGridColorWhite")}
                </TabsTrigger>
                <TabsTrigger value="black" className={controlStyles.spaceTabTrigger}>
                  {t("previewSamplingGridColorBlack")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <label className={controlStyles.stackedLabel}>
            {t("previewSamplingDensityLabel", { value: samplingDensityPercent })}
            <input
              className={controlStyles.rangeControl}
              type="range"
              min={1}
              max={100}
              step={1}
              value={samplingDensityPercent}
              onChange={(event) => onSamplingDensityPercentChange(Number(event.target.value))}
            />
          </label>
        </div>
      </PersistedDisclosure>

      <div
        ref={imageWrapRef}
        className={previewStyles.imageStage}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={commitDraft}
        onPointerLeave={() => {
          setIsPointerInside(false);
          hoverPipeline.clearNow(null);
          sharedHoverPipeline.clearNow(null);
          onSelectionDraftChange(null);
        }}
      >
        {target.previewUrl ? (
          <NextImage
            src={target.previewUrl}
            alt={t("photoPreviewAlt", { fileName: target.file?.name ?? t("photoUploadLabel") })}
            className={previewStyles.previewImage}
            ref={imageRef}
            width={640}
            height={480}
            priority
            unoptimized
          />
        ) : (
          <div className={previewStyles.previewEmpty}>{t("photoPreviewEmpty")}</div>
        )}
        <svg
          viewBox={`0 0 ${target.result?.width ?? 100} ${target.result?.height ?? 100}`}
          className={previewStyles.overlay}
          aria-hidden="true"
        >
          <defs>{samplingGridPattern}</defs>
          {samplingGridPattern && target.result ? (
            <rect
              className={previewStyles.samplingGrid}
              x="0"
              y="0"
              width={target.result.width}
              height={target.result.height}
              fill={`url(#${patternId})`}
            />
          ) : null}
          {selectionBox}
          {draftRect ? (
            <rect
              className={previewStyles.selectionDraft}
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
              className={previewStyles.hoverMarker}
              cx={hoverMarker.x}
              cy={hoverMarker.y}
              r={markerRadius * 0.75}
            />
          ) : null}
          {selectedMarkers.map((marker) => (
            <circle
              key={marker.sampleId}
              className={previewStyles.selectedMarker}
              cx={marker.x}
              cy={marker.y}
              r={markerRadius}
            />
          ))}
        </svg>
      </div>

      <details className={previewStyles.metaDetails}>
        <summary>{t("photoMetaSummary")}</summary>
        {target.file ? (
          <p className={`muted ${previewStyles.statusLine} previewStatusLine`}>
            {t("photoUploadSelected", { fileName: target.file.name })}
          </p>
        ) : null}
        <p className={`muted ${previewStyles.statusLine} previewStatusLine`}>
          {target.statusMessage || (target.file ? t("photoAnalyzing") : t("photoPreviewEmpty"))}
        </p>
        {target.error ? <p className="errorText">{target.error}</p> : null}
      </details>
    </section>
  );
}
