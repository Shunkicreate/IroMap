"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  storageKey: string;
  defaultValue: boolean;
};

export const usePersistedBoolean = (options: Options) => {
  const [isValue, setIsValue] = useState<boolean>(options.defaultValue);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedValue = window.localStorage.getItem(options.storageKey);
      if (storedValue === "true" || storedValue === "false") {
        setIsValue(storedValue === "true");
      } else {
        setIsValue(options.defaultValue);
      }
    } catch {
      setIsValue(options.defaultValue);
    } finally {
      hasLoadedRef.current = true;
    }
  }, [options.defaultValue, options.storageKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasLoadedRef.current) {
      return;
    }

    try {
      window.localStorage.setItem(options.storageKey, String(isValue));
    } catch {
      // Ignore storage failures and keep in-memory state.
    }
  }, [isValue, options.storageKey]);

  return [isValue, setIsValue] as const;
};
