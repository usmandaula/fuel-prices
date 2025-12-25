import { useState, useEffect, useCallback, useRef } from 'react';

export function usePersistentState<T>(
  key: string, 
  defaultValue: T,
  options: {
    throttleMs?: number;
    syncBetweenTabs?: boolean;
    serializer?: (value: T) => string;
    deserializer?: (stored: string) => T;
  } = {}
): [T, (value: T | ((prev: T) => T)) => void] {
  const {
    throttleMs = 500,
    syncBetweenTabs = true,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
  } = options;

  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? deserializer(stored) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const initialLoadRef = useRef(true);

  // Debounced save function
  const saveToStorage = useCallback((value: T) => {
    if (typeof window === 'undefined') return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(key, serializer(value));
      } catch (error) {
        console.error(`Error saving to localStorage key "${key}":`, error);
      }
    }, throttleMs);
  }, [key, serializer, throttleMs]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    
    saveToStorage(state);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state, saveToStorage]);

  // Sync between tabs
  useEffect(() => {
    if (typeof window === 'undefined' || !syncBetweenTabs) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const newValue = deserializer(e.newValue);
          setState(newValue);
        } catch (error) {
          console.error(`Error parsing storage update for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserializer, syncBetweenTabs]);

  // Enhanced setter that accepts both value and updater function
  const setPersistentState = useCallback((value: T | ((prev: T) => T)) => {
    setState(prev => {
      const nextValue = typeof value === 'function' 
        ? (value as (prev: T) => T)(prev)
        : value;
      return nextValue;
    });
  }, []);

  return [state, setPersistentState];
}