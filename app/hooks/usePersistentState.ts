// app/hooks/usePersistentState.ts - Updated version
import { useState, useEffect } from 'react';

export function usePersistentState<T>(
  key: string, 
  defaultValue: T
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    // SSR check
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
}