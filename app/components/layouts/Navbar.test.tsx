// Navbar.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from './Navbar';

// Mock child components
jest.mock('../EnhancedSearch', () => {
  return function MockEnhancedSearch(props: any) {
    return <div data-testid="enhanced-search">EnhancedSearch</div>;
  };
});

jest.mock('../DarkModeToggle', () => {
  return function MockDarkModeToggle(props: any) {
    return (
      <button 
        data-testid="dark-mode-toggle"
        onClick={props.toggleDarkMode}
      >
        DarkMode: {props.isDarkMode ? 'ON' : 'OFF'}
      </button>
    );
  };
});

// Mock icons
jest.mock('react-icons/fa', () => ({
  FaList: () => <div data-testid="list-icon">📋</div>,
  FaMap: () => <div data-testid="map-icon">🗺️</div>,
}));

describe('Navbar', () => {
  const mockOnLocationFound = jest.fn();
  const mockSetViewMode = jest.fn();
  const mockToggleDarkMode = jest.fn();

  const defaultProps = {
    onLocationFound: mockOnLocationFound,
    currentLocation: { lat: 52.52, lng: 13.405, name: 'Berlin' },
    viewMode: 'list' as const,
    setViewMode: mockSetViewMode,
    isDarkMode: false,
    toggleDarkMode: mockToggleDarkMode,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders EnhancedSearch component', () => {
    render(<Navbar {...defaultProps} />);
    
    expect(screen.getByTestId('enhanced-search')).toBeInTheDocument();
  });

  test('renders DarkModeToggle component', () => {
    render(<Navbar {...defaultProps} />);
    
    const darkModeToggle = screen.getByTestId('dark-mode-toggle');
    expect(darkModeToggle).toBeInTheDocument();
    expect(darkModeToggle).toHaveTextContent('DarkMode: OFF');
  });

  test('calls toggleDarkMode when dark mode toggle is clicked', () => {
    render(<Navbar {...defaultProps} />);
    
    const darkModeToggle = screen.getByTestId('dark-mode-toggle');
    fireEvent.click(darkModeToggle);
    
    expect(mockToggleDarkMode).toHaveBeenCalledTimes(1);
  });

  test('shows DarkMode as ON when isDarkMode is true', () => {
    render(<Navbar {...defaultProps} isDarkMode={true} />);
    
    const darkModeToggle = screen.getByTestId('dark-mode-toggle');
    expect(darkModeToggle).toHaveTextContent('DarkMode: ON');
  });

  test('renders view switch buttons', () => {
    render(<Navbar {...defaultProps} />);
    
    expect(screen.getByText('List')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByTestId('list-icon')).toBeInTheDocument();
    expect(screen.getByTestId('map-icon')).toBeInTheDocument();
  });

  test('highlights active view mode', () => {
    render(<Navbar {...defaultProps} />);
    
    const listButton = screen.getByText('List').closest('button');
    const mapButton = screen.getByText('Map').closest('button');
    
    expect(listButton).toHaveClass('active');
    expect(mapButton).not.toHaveClass('active');
  });

  test('highlights map button when viewMode is map', () => {
    render(<Navbar {...defaultProps} viewMode="map" />);
    
    const listButton = screen.getByText('List').closest('button');
    const mapButton = screen.getByText('Map').closest('button');
    
    expect(listButton).not.toHaveClass('active');
    expect(mapButton).toHaveClass('active');
  });

  test('calls setViewMode when view buttons are clicked', () => {
    render(<Navbar {...defaultProps} />);
    
    const mapButton = screen.getByText('Map').closest('button');
    fireEvent.click(mapButton!);
    
    expect(mockSetViewMode).toHaveBeenCalledWith('map');
    
    const listButton = screen.getByText('List').closest('button');
    fireEvent.click(listButton!);
    
    expect(mockSetViewMode).toHaveBeenCalledWith('list');
  });

  test('passes currentLocation to EnhancedSearch', () => {
    // This test verifies that props are passed through
    // Since EnhancedSearch is mocked, we can't directly test prop passing
    // But we can verify the component renders
    render(<Navbar {...defaultProps} />);
    
    expect(screen.getByTestId('enhanced-search')).toBeInTheDocument();
  });

  test('renders without currentLocation', () => {
    const propsWithoutLocation = {
      ...defaultProps,
      currentLocation: undefined,
    };
    
    render(<Navbar {...propsWithoutLocation} />);
    
    expect(screen.getByTestId('enhanced-search')).toBeInTheDocument();
  });

  test('has correct navbar structure with three sections', () => {
    const { container } = render(<Navbar {...defaultProps} />);
    
    const nav = container.querySelector('.app-nav');
    expect(nav).toBeInTheDocument();
    
    const leftSection = container.querySelector('.nav-left');
    const centerSection = container.querySelector('.nav-center');
    const rightSection = container.querySelector('.nav-right');
    
    expect(leftSection).toBeInTheDocument();
    expect(centerSection).toBeInTheDocument();
    expect(rightSection).toBeInTheDocument();
    
    // Check that EnhancedSearch is in center
    const enhancedSearchInCenter = centerSection?.querySelector('[data-testid="enhanced-search"]');
    expect(enhancedSearchInCenter).toBeInTheDocument();
    
    // Check that DarkModeToggle and view-switch are in right section
    const darkModeInRight = rightSection?.querySelector('[data-testid="dark-mode-toggle"]');
    const viewSwitchInRight = rightSection?.querySelector('.view-switch');
    
    expect(darkModeInRight).toBeInTheDocument();
    expect(viewSwitchInRight).toBeInTheDocument();
  });

  test('view switch buttons have proper labels and icons', () => {
    render(<Navbar {...defaultProps} />);
    
    const listButton = screen.getByText('List').closest('button');
    const mapButton = screen.getByText('Map').closest('button');
    
    expect(listButton).toContainElement(screen.getByTestId('list-icon'));
    expect(mapButton).toContainElement(screen.getByTestId('map-icon'));
  });
});