"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  storageKey: string;
  isdefaultValue: boolean;
};

export const usePersistedBoolean = ({ storageKey, isdefaultValue }: Options) => {
  const [isValue, setIsValue] = useState<boolean>(isdefaultValue);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedValue = window.localStorage.getItem(storageKey);
      if (storedValue === "true" || storedValue === "false") {
        setIsValue(storedValue === "true");
      } else {
        setIsValue(isdefaultValue);
      }
    } catch {
      setIsValue(isdefaultValue);
    } finally {
      hasLoadedRef.current = true;
    }
  }, [isdefaultValue, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasLoadedRef.current) {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, String(isValue));
    } catch {
      // Ignore storage failures and keep in-memory state.
    }
  }, [isValue, storageKey]);

  return [isValue, setIsValue] as const;
};
