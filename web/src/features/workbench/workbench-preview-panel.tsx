"use client";

import NextImage from "next/image";
import { useRef } from "react";
import { PersistedDisclosure } from "@/components/workbench/persisted-disclosure";
import { PanelHeader } from "@/components/workbench/panel-header";
import type { PhotoSample, TargetSelectionState } from "@/domain/photo-analysis/photo-analysis";
import { t } from "@/i18n/translate";
import controlStyles from "@/features/workbench/workbench-controls.module.css";
import previewStyles from "@/features/workbench/photo-preview-shared.module.css";
import {
  clamp,
  findNearestSampleByCoordinate,
  type SelectionDraft,
  type WorkbenchTarget,
} from "@/features/workbench/workbench-shared";

type Props = {
  target: WorkbenchTarget;
  hoverSample: PhotoSample | null;
  selectedSamples: PhotoSample[];
  selectionState: TargetSelectionState;
  selectionDraft: SelectionDraft;
  uploadDisclosureStorageKey: string;
  onHoverSampleChange: (sample: PhotoSample | null) => void;
  onSelectionDraftChange: (draft: SelectionDraft) => void;
  onSelectionCommit: (bounds: { x: number; y: number; width: number; height: number }) => void;
  onSampleSelect: (sample: PhotoSample) => void;
  onSourceFileSelected: (file: File | null) => void;
  onPaste: (event: React.ClipboardEvent<HTMLDivElement>) => void;
};

export function WorkbenchPreviewPanel({
  target,
  hoverSample,
  selectedSamples,
  selectionState,
  selectionDraft,
  uploadDisclosureStorageKey,
  onHoverSampleChange,
  onSelectionDraftChange,
  onSelectionCommit,
  onSampleSelect,
  onSourceFileSelected,
  onPaste,
}: Props) {
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
    hoverSample && target.result
      ? {
          x: hoverSample.x,
          y: hoverSample.y,
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

  return (
    <section className={`panel ${previewStyles.previewPanel}`}>
      <PanelHeader titleKey="photoPreviewTitle" requirementsKey="panelPhotoAnalysisRequirements" />
      <PersistedDisclosure
        storageKey={uploadDisclosureStorageKey}
        isdefaultOpen={true}
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
          <div className="photoPasteZone">
            <strong>{t("photoPasteZoneTitle")}</strong>
            <p>{t("photoPasteZoneHint")}</p>
          </div>
        </div>
      </PersistedDisclosure>

      <div
        ref={imageWrapRef}
        className={previewStyles.imageStage}
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
