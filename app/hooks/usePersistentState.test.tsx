// app/hooks/usePersistentState.test.tsx
import { renderHook, act } from '@testing-library/react';
import { usePersistentState } from './usePersistentState';

// Create a REAL localStorage mock that actually stores data
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] || null;
  }

  // Helper methods for testing
  setStore(data: Record<string, string>): void {
    this.store = { ...data };
  }

  getStore(): Record<string, string> {
    return { ...this.store };
  }
}

describe('usePersistentState', () => {
  let localStorageMock: LocalStorageMock;

  beforeEach(() => {
    // Create a fresh instance for each test
    localStorageMock = new LocalStorageMock();
    
    // Mock window.localStorage with our implementation
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    
    // Also mock global.localStorage for Node environment
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  test('initializes with default value when no localStorage value', () => {
    // localStorageMock is empty by default
    const { result } = renderHook(() => usePersistentState('testKey', 'default'));
    
    expect(result.current[0]).toBe('default');
  });

  test('initializes with localStorage value when available', () => {
    // Set value directly in our mock
    localStorageMock.setItem('testKey', JSON.stringify('savedValue'));
    
    const { result } = renderHook(() => usePersistentState('testKey', 'default'));
    
    expect(result.current[0]).toBe('savedValue');
  });

  test('updates localStorage when state changes', () => {
    const { result } = renderHook(() => usePersistentState('testKey', 'default'));
    
    const [, setState] = result.current;
    
    act(() => {
      setState('newValue');
    });
    
    // Check state was updated
    expect(result.current[0]).toBe('newValue');
    
    // Check localStorage was updated
    expect(localStorageMock.getItem('testKey')).toBe(JSON.stringify('newValue'));
  });

  test('handles JSON parse errors gracefully', () => {
    // Set invalid JSON in localStorage
    localStorageMock.setItem('testKey', 'invalid json');
    
    const { result } = renderHook(() => usePersistentState('testKey', 'default'));
    
    // Should fall back to default value
    expect(result.current[0]).toBe('default');
  });

  test('works with complex objects', () => {
    const complexObject = { 
      count: 1, 
      name: 'test', 
      nested: { value: true },
      array: [1, 2, 3]
    };
    
    const { result } = renderHook(() => usePersistentState('testKey', {}));
    
    const [, setState] = result.current;
    
    act(() => {
      setState(complexObject);
    });
    
    // Check state was updated
    expect(result.current[0]).toEqual(complexObject);
    
    // Check localStorage has the correct JSON
    const stored = localStorageMock.getItem('testKey');
    expect(stored).toBe(JSON.stringify(complexObject));
  });

  test('persists state across re-renders', () => {
    const { result, rerender } = renderHook(() => usePersistentState('testKey', 'default'));
    
    const [, setState] = result.current;
    
    act(() => {
      setState('updated');
    });
    
    // Force re-render
    rerender();
    
    expect(result.current[0]).toBe('updated');
  });

  test('different keys maintain separate state', () => {
    // First hook
    const { result: result1 } = renderHook(() => usePersistentState('key1', 'default1'));
    const [, setState1] = result1.current;
    
    // Second hook
    const { result: result2 } = renderHook(() => usePersistentState('key2', 'default2'));
    const [, setState2] = result2.current;
    
    // Update first
    act(() => {
      setState1('value1');
    });
    
    // Update second
    act(() => {
      setState2('value2');
    });
    
    // Check states are separate
    expect(result1.current[0]).toBe('value1');
    expect(result2.current[0]).toBe('value2');
    
    // Check localStorage has both values
    expect(localStorageMock.getItem('key1')).toBe(JSON.stringify('value1'));
    expect(localStorageMock.getItem('key2')).toBe(JSON.stringify('value2'));
  });

  test('reads from existing localStorage on mount', () => {
    // Pre-populate localStorage
    localStorageMock.setItem('preExistingKey', JSON.stringify('preExistingValue'));
    
    const { result } = renderHook(() => usePersistentState('preExistingKey', 'default'));
    
    expect(result.current[0]).toBe('preExistingValue');
  });
});