import { renderHook, act } from '@testing-library/react';
import { useDarkMode } from './useDarkMode';

describe('useDarkMode', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Reset document class
    document.documentElement.classList.remove('dark');
    
    // Reset matchMedia mock
    (window.matchMedia as jest.Mock).mockReturnValue({
      matches: false,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    });
  });

  test('initializes with light mode by default', () => {
    const { result } = renderHook(() => useDarkMode());
    
    expect(result.current.isDarkMode).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  test('toggles dark mode', () => {
    const { result } = renderHook(() => useDarkMode());
    
    // Initially false
    expect(result.current.isDarkMode).toBe(false);
    
    // Toggle to true
    act(() => {
      result.current.toggleDarkMode();
    });
    
    expect(result.current.isDarkMode).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    
    // Toggle back to false
    act(() => {
      result.current.toggleDarkMode();
    });
    
    expect(result.current.isDarkMode).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  test('persists dark mode preference in localStorage', () => {
    const { result } = renderHook(() => useDarkMode());
    
    // Toggle dark mode
    act(() => {
      result.current.toggleDarkMode();
    });
    
    expect(localStorage.setItem).toHaveBeenCalledWith('darkMode', 'true');
    
    // Toggle back
    act(() => {
      result.current.toggleDarkMode();
    });
    
    expect(localStorage.setItem).toHaveBeenCalledWith('darkMode', 'false');
  });

  test('loads dark mode preference from localStorage', () => {
    // Set localStorage to dark mode
    (localStorage.getItem as jest.Mock).mockReturnValue('true');
    
    const { result } = renderHook(() => useDarkMode());
    
    expect(result.current.isDarkMode).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});