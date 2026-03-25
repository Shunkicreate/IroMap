"use client";

import { useEffect, useRef, useState } from "react";

type Options<T> = {
  storageKey: string;
  initialValue: T;
  parse: (rawValue: string) => T | null;
  serialize?: (value: T) => string;
};

export const usePersistedState = <T>({
  storageKey,
  initialValue,
  parse,
  serialize = JSON.stringify,
}: Options<T>) => {
  const [value, setValue] = useState<T>(initialValue);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const rawValue = window.localStorage.getItem(storageKey);
      if (rawValue == null) {
        setValue(initialValue);
      } else {
        setValue(parse(rawValue) ?? initialValue);
      }
    } catch {
      setValue(initialValue);
    } finally {
      hasLoadedRef.current = true;
    }
  }, [initialValue, parse, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasLoadedRef.current) {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, serialize(value));
    } catch {
      // Ignore storage failures and keep in-memory state.
    }
  }, [serialize, storageKey, value]);

  return [value, setValue] as const;
};
