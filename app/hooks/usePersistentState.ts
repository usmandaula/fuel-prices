"use client";

import { useState } from "react";

export function usePersistentState<T>(
  key: string,
  defaultValue: T
) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;

    try {
      const stored = localStorage.getItem(key);
      if (!stored || stored === "undefined") {
        return defaultValue;
      }
      return JSON.parse(stored) as T;
    } catch {
      return defaultValue;
    }
  });

  const setPersistentState = (value: T | ((prev: T) => T)) => {
    setState(prev => {
      const next =
        typeof value === "function"
          ? (value as (p: T) => T)(prev)
          : value;

      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}

      return next;
    });
  };

  return [state, setPersistentState] as const;
}
