import { labToChroma, rgbToHsl, rgbToLab } from "@/domain/color/color-conversion";
import { colorChannelMax } from "@/domain/color/color-constants";
import { toHueDegree, toPercentage, toRgbColor } from "@/domain/color/color-types";
import {
  alphaChannelOffset,
  maxSampleCount,
  noAlpha,
  rgbaStride,
} from "@/domain/photo-analysis/shared/photo-analysis-constants";
import {
  scaleHue,
  scaleLabComponent,
  scaleLightness,
  scaleSaturation,
  shouldUseWideCoordinates,
  unscaleHue,
  unscaleLabComponent,
  unscaleLightness,
  unscaleSaturation,
} from "@/domain/photo-analysis/shared/photo-analysis-color";
import type {
  PhotoSample,
  PhotoSampleBufferStore,
} from "@/domain/photo-analysis/shared/photo-analysis-types";

// Base analysis storage layer: builds and materializes sampled photo data.

export const samplePixelsToStore = (
  imageData: ImageData,
  step: number,
  maxSamples: number = maxSampleCount
): PhotoSampleBufferStore => {
  const { data, width, height } = imageData;
  const capacity = Math.min(maxSamples, Math.ceil(width / step) * Math.ceil(height / step));
  const x = shouldUseWideCoordinates(width, height)
    ? new Uint32Array(capacity)
    : new Uint16Array(capacity);
  const y = shouldUseWideCoordinates(width, height)
    ? new Uint32Array(capacity)
    : new Uint16Array(capacity);
  const r = new Uint8Array(capacity);
  const g = new Uint8Array(capacity);
  const b = new Uint8Array(capacity);
  const labL = new Uint16Array(capacity);
  const labA = new Int16Array(capacity);
  const labB = new Int16Array(capacity);
  const hue = new Uint16Array(capacity);
  const saturation = new Uint16Array(capacity);
  const lightness = new Uint16Array(capacity);
  let count = 0;

  for (let row = 0; row < height; row += step) {
    for (let column = 0; column < width; column += step) {
      if (count >= maxSamples) {
        break;
      }
      const offset = (row * width + column) * rgbaStride;
      const alpha = data[offset + alphaChannelOffset] / colorChannelMax;
      if (alpha === noAlpha) {
        continue;
      }

      const color = toRgbColor(data[offset], data[offset + 1], data[offset + 2]);
      const hsl = rgbToHsl(color);
      const lab = rgbToLab(color);
      x[count] = column;
      y[count] = row;
      r[count] = color.r;
      g[count] = color.g;
      b[count] = color.b;
      labL[count] = scaleLabComponent(lab.l);
      labA[count] = scaleLabComponent(lab.a);
      labB[count] = scaleLabComponent(lab.b);
      hue[count] = scaleHue(hsl.h);
      saturation[count] = scaleSaturation(hsl.s);
      lightness[count] = scaleLightness(hsl.l);
      count += 1;
    }
    if (count >= maxSamples) {
      break;
    }
  }

  return {
    count,
    x: x.subarray(0, count),
    y: y.subarray(0, count),
    r: r.subarray(0, count),
    g: g.subarray(0, count),
    b: b.subarray(0, count),
    labL: labL.subarray(0, count),
    labA: labA.subarray(0, count),
    labB: labB.subarray(0, count),
    hue: hue.subarray(0, count),
    saturation: saturation.subarray(0, count),
    lightness: lightness.subarray(0, count),
  };
};

export const materializeSample = (store: PhotoSampleBufferStore, index: number): PhotoSample => {
  const color = toRgbColor(store.r[index] ?? 0, store.g[index] ?? 0, store.b[index] ?? 0);
  const lab = {
    l: unscaleLabComponent(store.labL[index] ?? 0),
    a: unscaleLabComponent(store.labA[index] ?? 0),
    b: unscaleLabComponent(store.labB[index] ?? 0),
  };
  return {
    sampleId: index,
    x: Number(store.x[index] ?? 0),
    y: Number(store.y[index] ?? 0),
    color,
    hsl: {
      h: toHueDegree(unscaleHue(store.hue[index] ?? 0)),
      s: toPercentage(unscaleSaturation(store.saturation[index] ?? 0)),
      l: toPercentage(unscaleLightness(store.lightness[index] ?? 0)),
    },
    lab,
    chroma: labToChroma(lab),
  };
};

export const materializeSamples = (
  store: PhotoSampleBufferStore,
  indexes?: readonly number[]
): PhotoSample[] => {
  const targetIndexes = indexes ?? Array.from({ length: store.count }, (_, index) => index);
  return targetIndexes.map((index) => materializeSample(store, index));
};
