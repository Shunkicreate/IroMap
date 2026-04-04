"use client";

import { useSyncExternalStore } from "react";
import type { HoverState } from "@/features/workbench/workbench-shared";

const defaultSharedHoverState: HoverState = {
  targetId: "baseline",
  sample: null,
  source: "preview",
};

const listeners = new Set<() => void>();
let sharedHoverState: HoverState = defaultSharedHoverState;

const areSameHoverState = (left: HoverState, right: HoverState): boolean => {
  return (
    left.targetId === right.targetId &&
    left.source === right.source &&
    left.sample?.sampleId === right.sample?.sampleId
  );
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const emit = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

export const getSharedHoverState = (): HoverState => {
  return sharedHoverState;
};

export const setSharedHoverState = (nextState: HoverState): void => {
  if (areSameHoverState(sharedHoverState, nextState)) {
    return;
  }
  sharedHoverState = nextState;
  emit();
};

export const useSharedHoverState = <T>(selector: (state: HoverState) => T): T => {
  return useSyncExternalStore(
    subscribe,
    () => selector(sharedHoverState),
    () => selector(defaultSharedHoverState)
  );
};
