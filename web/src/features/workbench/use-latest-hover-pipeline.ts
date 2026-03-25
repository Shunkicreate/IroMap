"use client";

import { useEffect, useRef } from "react";

type Options<TInput, TResult> = {
  isEqual: (left: TResult, right: TResult) => boolean;
  onResolved: (result: TResult) => void;
  resolve: (input: TInput) => TResult;
};

export const useLatestHoverPipeline = <TInput, TResult>({
  isEqual,
  onResolved,
  resolve,
}: Options<TInput, TResult>) => {
  const frameRef = useRef<number | null>(null);
  const pendingInputRef = useRef<TInput | null>(null);
  const hasPendingInputRef = useRef(false);
  const lastResolvedRef = useRef<TResult | null>(null);
  const hasLastResolvedRef = useRef(false);
  const isEqualRef = useRef(isEqual);
  const onResolvedRef = useRef(onResolved);
  const resolveRef = useRef(resolve);

  useEffect(() => {
    isEqualRef.current = isEqual;
    onResolvedRef.current = onResolved;
    resolveRef.current = resolve;
  }, [isEqual, onResolved, resolve]);

  const flush = (): void => {
    frameRef.current = null;
    if (!hasPendingInputRef.current) {
      return;
    }

    const nextInput = pendingInputRef.current as TInput;
    pendingInputRef.current = null;
    hasPendingInputRef.current = false;

    const nextResult = resolveRef.current(nextInput);
    if (
      hasLastResolvedRef.current &&
      isEqualRef.current(lastResolvedRef.current as TResult, nextResult)
    ) {
      return;
    }

    lastResolvedRef.current = nextResult;
    hasLastResolvedRef.current = true;
    onResolvedRef.current(nextResult);
  };

  const schedule = (input: TInput): void => {
    pendingInputRef.current = input;
    hasPendingInputRef.current = true;
    if (frameRef.current != null) {
      return;
    }
    frameRef.current = window.requestAnimationFrame(() => {
      flush();
    });
  };

  const clearNow = (result: TResult): void => {
    if (frameRef.current != null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    pendingInputRef.current = null;
    hasPendingInputRef.current = false;
    if (
      hasLastResolvedRef.current &&
      isEqualRef.current(lastResolvedRef.current as TResult, result)
    ) {
      return;
    }
    lastResolvedRef.current = result;
    hasLastResolvedRef.current = true;
    onResolvedRef.current(result);
  };

  useEffect(() => {
    return () => {
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return { clearNow, flush, schedule };
};
